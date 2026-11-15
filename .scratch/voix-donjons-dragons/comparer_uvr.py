#!/usr/bin/env python3
"""Variante UVR sur les références où Spleeter estime un fond plus présent."""
import json
import time
import shutil
from autonomiser import rendre_autonome

import numpy as np
import sherpa_onnx as so
from scipy.signal import resample_poly

from extraire import ROOT, MODELS, decode, save
from cataloguer import write_wav


def main():
    model=MODELS/'UVR-MDX-NET-Voc_FT.onnx'
    separator=so.OfflineSourceSeparation(so.OfflineSourceSeparationConfig(
        model=so.OfflineSourceSeparationModelConfig(
            uvr=so.OfflineSourceSeparationUvrModelConfig(model=str(model)),num_threads=2)))
    roles=json.loads((ROOT/'personnages.json').read_text())['roles']
    targets=[d for d in roles if d['removed_background_db']>-20 and d['duration']>=6]
    md=['# Variantes UVR à comparer', '',
        'Second séparateur pour les références dont le fond est estimé plus présent. Aucune supériorité auditive n’est présumée : comparer à l’original et à Spleeter, notamment le timbre et les consonnes.', '']
    for role in targets:
        t=time.monotonic()
        left=max(0,role['start']-1)
        x=decode(role['audio'],start=left,duration=role['end']-left+1)
        padded=np.pad(x,((0,44100),(0,0)))
        o=separator.process(sample_rate=44100,samples=np.ascontiguousarray(padded.T))
        a,b=round((role['start']-left)*o.sample_rate),round((role['end']-left)*o.sample_rate)
        clean=o.stems[0].data[:,a:b].mean(axis=0)
        if len(clean)!=b-a:
            raise ValueError(f"Sortie UVR tronquée : {role['id']}")
        clean=resample_poly(clean,22050,o.sample_rate).astype(np.float32)
        gain=min(1.,.89/max(float(np.max(np.abs(clean))),1e-6))
        dest=ROOT/'personnages'/role['id']/'voix-uvr.wav'
        write_wav(dest,clean*gain)
        flat=ROOT/'candidats-xtts/uvr'/(role['id']+'.wav')
        flat.parent.mkdir(parents=True,exist_ok=True)
        write_wav(flat,clean*gain)
        save(dest.with_suffix('.json'),dict(status='variante_a_ecouter',model=str(model),
            source=role['audio'],start=role['start'],end=role['end'],gain=gain))
        base='personnages/'+role['id']
        md.extend([f"## {role['role']}", '',
                   f'[Original]({base}/original.wav) · [Spleeter]({base}/voix-separee.wav) · [UVR]({base}/voix-uvr.wav)', ''])
        print(role['id'],round(time.monotonic()-t,2),'s',flush=True)
    (ROOT/'VARIANTES-UVR.md').write_text('\n'.join(md)+'\n')
    page=ROOT/'PERSONNAGES-liens-locaux.html'
    content=page.read_text()
    for role in targets:
        base='personnages/'+role['id']
        marker=f'<label>Voix séparée<audio controls preload="none" src="{base}/voix-separee.wav"></audio></label>'
        extra=f'<label>Variante UVR<audio controls preload="none" src="{base}/voix-uvr.wav"></audio></label>'
        if extra not in content:
            content=content.replace(marker,marker+extra)
    page.write_text(content)
    rendre_autonome(page, ROOT/'PERSONNAGES.html')
    shutil.copyfile(ROOT/'PERSONNAGES.html', ROOT/'PERSONNAGES-AUTONOME.html')


if __name__=='__main__':
    main()
