#!/usr/bin/env python3
"""Repères de personnages fondés sur les annonces du récit, à valider à l'écoute."""
import html
import json
import math
import shutil
from pathlib import Path

import numpy as np
from scipy.signal import resample_poly

import extraire as ex
from cataloguer import write_wav
from autonomiser import rendre_autonome


def main():
    roles=json.loads(Path(__file__).with_name('roles.json').read_text())
    ex.init_models()
    entries=[]
    md=['# Repères de personnages à confirmer', '',
        'Ces étiquettes reposent sur les annonces du récit. Elles ne garantissent ni un locuteur unique dans chaque coupe, ni des voix acoustiquement différentes.',
        'Aucun nom de comédien n’est inféré. Aucune référence n’est encore validée à l’écoute pour XTTS.',
        'Les contextes ASR peuvent dépasser les limites de la coupe. Comparer l’original à la version séparée avant de choisir.', '']
    cards=[]
    for role in roles:
        p=ex.TRANSCRIPTS/role['story']/'scenes'/(role['scene']+'.json')
        transcript=json.loads(p.read_text())
        directory=ex.ROOT/'personnages'/role['id']
        directory.mkdir(parents=True,exist_ok=True)
        # Le découpage est séparé à part, avec du contexte, pour éviter les jointures du traitement global.
        left=max(0,role['start']-1)
        right=min(transcript['duration'],role['end']+1)
        x=ex.decode(transcript['audio'],start=left,duration=right-left)
        vocal,background=ex.separate_in_blocks(x)
        a,b=round((role['start']-left)*44100),round((role['end']-left)*44100)
        raw=x[a:b].mean(axis=1)
        clean=vocal[a:b]
        bg=background[a:b]
        bg_db=20*math.log10(math.sqrt(float(np.mean(bg**2))+1e-12)/math.sqrt(float(np.mean(clean**2))+1e-12))
        raw=resample_poly(raw,1,2).astype(np.float32)
        clean=resample_poly(clean,1,2).astype(np.float32)
        gain=min(1.,.89/max(float(np.max(np.abs(raw))),float(np.max(np.abs(clean))),1e-6))
        write_wav(directory/'original.wav',raw*gain)
        write_wav(directory/'voix-separee.wav',clean*gain)
        vector=ex.embedding(resample_poly(clean,320,441).astype(np.float32))
        context=' '.join(s['text'].strip() for s in transcript['segments']
                         if min(role['end'],s['end'])-max(role['start'],s['start'])>.2)
        entry=dict(role,status='hypothese_textuelle_a_ecouter',validated=False,
            audio=transcript['audio'],transcript=str(p),duration=role['end']-role['start'],
            original='original.wav',vocals='voix-separee.wav',context=context,
            removed_background_db=round(bg_db,2),embedding=vector,
            natural_reference_candidate=bg_db<=-20,
            xtts_status='candidat_a_valider' if role['end']-role['start']>=6 else 'court_a_completer')
        ex.save(directory/'profil.json',entry)
        (directory/'contexte.txt').write_text(context+'\n\nAttribution : '+role['evidence']+'\n')
        entries.append(entry)
        base='personnages/'+role['id']
        md.extend([f"## {role['role']}", '',f"`{role['story']}/{role['scene']}` : {role['start']:.2f}–{role['end']:.2f} s.",
            f"[Original]({base}/original.wav) · [Voix séparée]({base}/voix-separee.wav)", '',
            'Attribution textuelle : '+role['evidence'], '',
            f"Fond retiré estimé : {bg_db:.1f} dB par rapport à la voix ; {entry['xtts_status']}.", '',context,''])
        cards.append(f'<section><h2>{html.escape(role["role"])}</h2><p>{html.escape(role["evidence"])}</p>'
            f'<label>Original<audio controls preload="none" src="{base}/original.wav"></audio></label>'
            f'<label>Voix séparée<audio controls preload="none" src="{base}/voix-separee.wav"></audio></label>'
            f'<p>{html.escape(context)}</p></section>')
        print(f"{role['id']}: {bg_db:.1f} dB ; {entry['duration']:.1f} s",flush=True)
    ex.save(ex.ROOT/'personnages.json',dict(status='attributions_textuelles_a_confirmer',roles=entries))
    candidates=[]
    for entry in entries:
        if entry['duration']<6:
            continue
        for variant,source in [('originaux','original.wav'),('separes','voix-separee.wav')]:
            dest=ex.ROOT/'candidats-xtts'/variant/(entry['id']+'.wav')
            dest.parent.mkdir(parents=True,exist_ok=True)
            shutil.copyfile(ex.ROOT/'personnages'/entry['id']/source,dest)
        candidates.append({k:v for k,v in entry.items() if k not in ['embedding']})
    ex.save(ex.ROOT/'candidats-xtts/manifest.json',dict(status='a_ecouter_non_valide',
        sample_rate=22050,format='mono PCM_16',voices=candidates))
    originals=sorted([e for e in entries if e['natural_reference_candidate'] and e['duration']>=6],
                     key=lambda e:e['removed_background_db'])
    lines=['# Originaux à écouter en priorité','','Présélection d’après la faible énergie d’accompagnement estimée par Spleeter. Ce score ne garantit pas une absence de musique : l’écoute tranche. Les attributions reposent sur le contexte du récit.','']
    for e in originals:
        base='personnages/'+e['id']
        lines.append(f"- **{e['role']}** — {e['duration']:.1f} s : [original]({base}/original.wav) · [version séparée]({base}/voix-separee.wav).")
    (ex.ROOT/'ORIGINAUX-A-ECOUTER.md').write_text('\n'.join(lines)+'\n')
    (ex.ROOT/'PERSONNAGES.md').write_text('\n'.join(md)+'\n')
    (ex.ROOT/'PERSONNAGES-liens-locaux.html').write_text('<!doctype html><html lang="fr"><meta charset="utf-8"><title>Repères des personnages</title><style>body{font:17px system-ui;max-width:960px;margin:40px auto;padding:20px;background:#17191d;color:#eee}section{border-top:1px solid #666;padding:20px 0}label{display:inline-flex;flex-direction:column;margin:8px 20px 8px 0}p{line-height:1.5}audio{max-width:100%}</style><h1>Repères de personnages à confirmer</h1><p>Attributions d’après le texte, à confirmer à l’écoute. Certains rôles peuvent partager un même comédien ou un même timbre. Comparer les deux versions et conserver l’original si la séparation altère la voix. Aucune référence n’est encore validée pour XTTS.</p>'+''.join(cards)+'</html>')

    rendre_autonome(ex.ROOT/'PERSONNAGES-liens-locaux.html', ex.ROOT/'PERSONNAGES.html')
    shutil.copyfile(ex.ROOT/'PERSONNAGES.html', ex.ROOT/'PERSONNAGES-AUTONOME.html')


if __name__=='__main__':
    main()
