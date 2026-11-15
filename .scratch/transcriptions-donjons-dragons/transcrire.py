#!/usr/bin/env python3
"""Transcription locale, reprenable, sans modifier les histoires sources."""
import argparse
import hashlib
import json
import re
import time
from dataclasses import asdict
from pathlib import Path
from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parent
SOURCES = Path('/home/mathieu/Documents/story-studio/packs-rapatries')
STORIES = [
    ('b0b3657c-9f0b-420a-969f-ffe7670e73d9', 'sur-les-chemins-de-faerun'),
    ('0d3052e0-0350-4f92-bee0-6dd804a2c1a7', 'dans-les-bas-fonds-deauprofonde'),
]
MODEL = 'turbo'

def write_json(path, data):
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temp.replace(path)

def stamp(t):
    ms = round(t * 1000)
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f'{h:02}:{m:02}:{s:02},{ms:03}'

def natural(name):
    return [int(s) if s.isdigit() else s.lower() for s in re.split(r'(\d+)', name)]

def compile_story(directory, title):
    records = [json.loads(p.read_text()) for p in sorted((directory/'scenes').glob('*.json'), key=lambda p:natural(p.stem))]
    lines = [f'# {title}', '', 'Transcription automatique en français — à relire, notamment les noms propres.',
             'Les scènes et variantes suivent les noms des fichiers, pas un parcours de jeu reconstitué.', '']
    for r in records:
        lines.extend([f"## {r['scene']}", '', r['text'] or '[Aucune parole détectée]', ''])
    (directory/'histoire.md').write_text('\n'.join(lines), encoding='utf-8')
    write_json(directory/'index.json', {'title':title, 'model':MODEL, 'completed':len(records), 'scenes':[{'scene':r['scene'],'audio':r['audio'],'duration':r['duration'],'review':r['review']} for r in records]})

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--limit', type=int)
    args=parser.parse_args()
    print(f'Chargement Whisper {MODEL}, CPU int8 (8 threads)…', flush=True)
    model=WhisperModel(MODEL, device='cpu', compute_type='int8', cpu_threads=8, num_workers=1)
    completed=0
    errors=[]
    write_json(ROOT/'etat.json', {'status':'en_cours'})
    for uid,slug in STORIES:
        wrapper=SOURCES/(uid+'.flam')
        title=json.loads((wrapper/'flam-copy.json').read_text())['title']
        directory=ROOT/slug
        scenes=directory/'scenes'
        scenes.mkdir(parents=True, exist_ok=True)
        files=sorted((wrapper/uid/'sounds').glob('*.mp3'), key=lambda p:natural(p.stem))
        for i,audio in enumerate(files,1):
            dest=scenes/(audio.stem+'.json')
            digest=hashlib.sha256(audio.read_bytes()).hexdigest()
            if dest.exists():
                old=json.loads(dest.read_text())
                if old.get('sha256')==digest and old.get('model')==MODEL:
                    continue
            print(f'{slug} [{i}/{len(files)}] {audio.name}', flush=True)
            started=time.monotonic()
            try:
                segments,info=model.transcribe(str(audio), language='fr', beam_size=5, vad_filter=True,
                    condition_on_previous_text=False, word_timestamps=True)
                segments=[asdict(s) for s in segments]
                text=' '.join(s['text'].strip() for s in segments).strip()
                review=[]
                if not text: review.append('aucune_parole_detectee')
                if any(s['avg_logprob'] < -1 or s['compression_ratio'] > 2.4 for s in segments):
                    review.append('confiance_a_verifier')
                record={'scene':audio.stem,'audio':str(audio),'sha256':digest,'model':MODEL,
                        'language':'fr','duration':info.duration,'text':text,'review':review,'segments':segments}
                (scenes/(audio.stem+'.txt')).write_text(text+'\n',encoding='utf-8')
                srt='\n\n'.join(f"{n}\n{stamp(s['start'])} --> {stamp(s['end'])}\n{s['text'].strip()}" for n,s in enumerate(segments,1))
                (scenes/(audio.stem+'.srt')).write_text(srt+'\n',encoding='utf-8')
                write_json(dest,record)
                completed+=1
                print(f'  {info.duration:.1f}s audio / {time.monotonic()-started:.1f}s calcul — {text[:160]}',flush=True)
                compile_story(directory,title)
                if args.limit and completed>=args.limit: return
            except Exception as exc:
                errors.append({'audio':str(audio),'error':str(exc)})
                write_json(ROOT/'erreurs.json',errors)
                print(f'ERREUR : {exc}',flush=True)
                if len(errors)>=3: raise RuntimeError('Arrêt après trois erreurs ; consulter erreurs.json') from exc
        compile_story(directory,title)
    write_json(ROOT/'etat.json',{'status':'termine_avec_erreurs' if errors else 'termine','errors':len(errors)})
    print(f'Terminé. {len(errors)} erreur(s).',flush=True)

if __name__=='__main__': main()
