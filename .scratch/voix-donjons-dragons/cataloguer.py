#!/usr/bin/env python3
"""Regroupement acoustique provisoire et export de paires original/voix séparée."""
import argparse
import collections
import html
import json
import math
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.cluster.hierarchy import linkage, fcluster
from scipy.spatial.distance import pdist

from extraire import ROOT, STORIES, decode, save
from autonomiser import rendre_autonome

NAMES = ['Kissandra','Tacheline','Aspine','Aurinax','Méloun','Shanaïra','Phylund',
         'Renaer','Laeral','Silverhand','Vajra','Safahr','Rojenard','Esvel','Quid']


def write_wav(path, data):
    if not len(data):
        raise ValueError(f'Extrait vide : {path}')
    data = np.asarray(data,dtype=np.float32).copy()
    fade = min(110,len(data)//2)
    data[:fade] *= np.linspace(0,1,fade)
    data[-fade:] *= np.linspace(1,0,fade)
    sf.write(path,data,22050,subtype='PCM_16')


def export_reference(row, directory, number):
    prefix = f'extrait-{number:02}'
    a,b = row['start'],row['end']
    with sf.SoundFile(row['vocals_cache']) as f:
        f.seek(round(a*f.samplerate))
        clean=f.read(round((b-a)*f.samplerate),dtype='float32')
    original = decode(row['audio'],rate=22050,channels=1,start=a,duration=b-a)[:,0]
    count=min(len(clean),len(original))
    clean,original=clean[:count],original[:count]
    # Même atténuation pour la comparaison, aucune amplification ni compression.
    peak=max(float(np.max(np.abs(clean))),float(np.max(np.abs(original))),1e-6)
    gain=min(1.,.89/peak)
    write_wav(directory/(prefix+'-voix.wav'),clean*gain)
    write_wav(directory/(prefix+'-original.wav'),original*gain)
    result = {k:v for k,v in row.items() if k not in ['embedding','cluster']}
    result.update(status='a_ecouter',identity_status='non_validee',
        original=prefix+'-original.wav',vocals=prefix+'-voix.wav',sample_rate=22050,
        format='PCM_16 mono',shared_gain=gain,
        text_status='contexte_ASR_chevauchant_l_extrait_pas_alignement_mot_a_mot',
        source_quality_status='peu_de_fond_estime' if row['removed_background_db']<=-20 else 'fond_present_estime',
        xtts_status='candidat_a_valider' if row['duration']>=6 else 'court_a_completer')
    save(directory/(prefix+'.json'),result)
    (directory/(prefix+'.txt')).write_text(row['context']+'\n')
    return result


def main(args):
    rows=[]
    scenes=list((ROOT/'analyse').glob('*/*.json'))
    for path in sorted(scenes):
        d=json.loads(path.read_text())
        for w in d['windows']:
            if w['duration']<2.5 or w['rms']<.004 or w['source_clipping_fraction']>.001:
                continue
            rows.append(dict(w,story=d['story'],scene=d['scene'],audio=d['audio'],
                             transcript=d['transcript'],vocals_cache=d['vocals_cache']))
    if not rows:
        raise RuntimeError('Aucune fenêtre vocale exploitable')
    vectors=np.asarray([r['embedding'] for r in rows],dtype=np.float64)
    distances=np.clip(pdist(vectors,metric='cosine'),0,2) if len(rows)>1 else None
    tree=linkage(distances,method='average') if len(rows)>1 else None
    diagnostics={str(t):len(set(fcluster(tree,t,criterion='distance'))) if tree is not None else 1
                 for t in [.18,.23,.28,.33,.38]}
    labels=fcluster(tree,args.threshold,criterion='distance') if tree is not None else [1]
    groups=collections.defaultdict(list)
    for row,label in zip(rows,labels):
        groups[int(label)].append(row)
    ordered=sorted(groups.values(),key=lambda g:(-sum(r['duration'] for r in g),g[0]['story'],g[0]['scene']))
    catalog=[]
    md=['# Catalogue provisoire des voix', '',
        '**Groupes acoustiques automatiques, pas une liste certaine de personnages ou de comédiens.**',
        'Une voix jouée peut être répartie en plusieurs groupes ; plusieurs personnages joués par une même personne peuvent rester ensemble.',
        'Aucune écoute humaine ni validation XTTS n’est présumée. Les noms cités dans le contexte ne désignent pas nécessairement le locuteur.', '',
        'Chaque extrait existe en original et en version voix séparée (WAV mono, 22 050 Hz, PCM 16 bits).',
        'Le score de fond mesure l’énergie de la piste retirée par Spleeter : c’est un indice de sélection, pas une certification d’absence de musique.',
        'Privilégier l’original si son fond est déjà discret et si la séparation altère la voix. Vérifier les changements de locuteur, mots coupés, musique résiduelle et artefacts.',
        'Le texte est le contexte des segments ASR chevauchants, pas une transcription exacte de la coupe.', '']
    for i,group in enumerate(ordered,1):
        name=f'voix-{i:03}'
        directory=ROOT/'echantillons'/name
        directory.mkdir(parents=True,exist_ok=True)
        center=np.mean([r['embedding'] for r in group],axis=0)
        center/=np.linalg.norm(center)
        for row in group:
            row['similarity_to_centroid']=round(float(np.dot(row['embedding'],center)),4)
        # Préférence aux extraits longs, avec peu d'accompagnement estimé et centraux dans leur groupe.
        def score(r):
            return (r['duration']<6, r['removed_background_db']+25*(1-r['similarity_to_centroid']),-min(r['duration'],9))
        ranked=sorted(group,key=score)
        selected=[]
        seen=set()
        for row in ranked:
            key=(row['story'],row['scene'])
            if key in seen:
                continue
            seen.add(key)
            selected.append(row)
            if len(selected)>=3:
                break
        refs=[export_reference(row,directory,n) for n,row in enumerate(selected,1)]
        contexts=collections.Counter(n for r in group for n in NAMES if n.lower() in r['context'].lower())
        story_counts=dict(collections.Counter(r['story'] for r in group))
        item=dict(id=name,status='a_identifier_et_a_ecouter',validated_character=None,
            windows=len(group),duration_seconds=round(sum(r['duration'] for r in group),2),
            stories=story_counts,mentioned_names=dict(contexts),references=refs)
        save(directory/'profil.json',item)
        catalog.append(item)
        md.extend([f'## {name}', '',f"{len(group)} passages ; {item['duration_seconds']/60:.1f} min cumulées ; {len(story_counts)} histoire(s).",''])
        if contexts:
            md.extend(['Noms mentionnés dans les contextes (indices uniquement) : '+', '.join(n for n,_ in contexts.most_common(6))+'.',''])
        for n,r in enumerate(refs,1):
            stem=f'echantillons/{name}/extrait-{n:02}'
            md.extend([f"- Extrait {n}, `{r['story']}/{r['scene']}`, {r['start']:.2f}–{r['end']:.2f} s : [original]({stem}-original.wav) · [voix séparée]({stem}-voix.wav). Fond estimé {r['removed_background_db']:.1f} dB ; {r['xtts_status']}.",
                '  Contexte : '+r['context'].replace('\n',' '),''])
    save(ROOT/'catalogue.json',dict(status='provisoire_a_valider',analysis_scenes=len(scenes),
        acoustic_windows=len(rows),clustering=dict(method='liaison_moyenne_distance_cosinus',threshold=args.threshold,
        diagnostic_cluster_counts=diagnostics,warning='seuil_heuristique_non_calibre_sur_ce_corpus'),profiles=catalog))
    (ROOT/'CATALOGUE.md').write_text('\n'.join(md)+'\n')
    # Feuille d'écoute locale : aucune dépendance réseau, aucune lecture automatique.
    cards=[]
    for item in catalog:
        refs=[]
        for i,r in enumerate(item['references'],1):
            base=f"echantillons/{item['id']}/extrait-{i:02}"
            refs.append(f'<p>{html.escape(r["story"]+" / "+r["scene"])} — {r["start"]:.2f}–{r["end"]:.2f} s</p>'
                f'<label>Original <audio controls preload="none" src="{base}-original.wav"></audio></label>'
                f'<label>Voix séparée <audio controls preload="none" src="{base}-voix.wav"></audio></label>'
                f'<p class="context">{html.escape(r["context"])}</p>')
        cards.append(f'<section><h2>{item["id"]}</h2><p>Identification à confirmer à l’écoute.</p>'+''.join(refs)+'</section>')
    (ROOT/'ECOUTE-liens-locaux.html').write_text('<!doctype html><html lang="fr"><meta charset="utf-8"><title>Échantillons vocaux D&amp;D</title><style>body{font:17px system-ui;max-width:960px;margin:40px auto;padding:20px;background:#17191d;color:#eee}section{border-top:1px solid #666;padding:20px 0}label{display:inline-flex;flex-direction:column;margin:8px 20px 8px 0}.context{color:#bbb;line-height:1.5}audio{max-width:100%}</style><h1>Catalogue provisoire des voix</h1><p>Groupes acoustiques automatiques : ils ne constituent pas des identifications certaines de personnages. Comparer chaque original avec la voix séparée ; privilégier l’original si la séparation dégrade le timbre. Les textes donnent un contexte approximatif. Aucun extrait n’a encore été validé à l’écoute pour XTTS.</p>'+''.join(cards)+'</html>')
    rendre_autonome(ROOT/'ECOUTE-liens-locaux.html', ROOT/'ECOUTE.html')
    save(ROOT/'bilan-catalogue.json',dict(status='echantillons_prets_a_ecouter',scenes=len(scenes),
        profiles=len(catalog),references=sum(len(i['references']) for i in catalog),
        diagnostics=diagnostics,threshold=args.threshold))
    print(json.dumps(dict(profiles=len(catalog),windows=len(rows),diagnostics=diagnostics),ensure_ascii=False),flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--threshold',type=float,default=.23)
    main(parser.parse_args())
