#!/usr/bin/env python3
"""Générer un essai de chaque voix via le protocole réel de Story Studio."""
import html
import json
import shutil
import time
import urllib.error
import urllib.request
from pathlib import Path

from autonomiser import rendre_autonome

ROOT=Path('/home/mathieu/Documents/story-studio/voix-donjons-dragons')
INSTALL=Path('/home/mathieu/.local/share/story-studio-xtts')
TEXT='La porte est ouverte. Notre prochaine aventure peut commencer.'


def main():
    bank=json.loads((INSTALL/'voice-bank.json').read_text())['voices']
    dest=ROOT/'essais-xtts/banque'
    dest.mkdir(parents=True,exist_ok=True)
    results=[]
    for voice,profile in bank.items():
        started=time.monotonic()
        request=urllib.request.Request('http://127.0.0.1:8020/tts',
            data=json.dumps({'voice':voice,'text':TEXT,'language':'fr'}).encode(),
            headers={'Content-Type':'application/json'})
        try:
            with urllib.request.urlopen(request,timeout=300) as response:
                data=json.load(response)
            source=INSTALL/'output'/data['file']
            target=dest/(voice+'.wav')
            shutil.copyfile(source,target)
            result=dict(voice=voice,label=profile['label'],status='generation_reussie',
                text=TEXT,file=str(target),elapsed=round(time.monotonic()-started,2),
                references=len(profile['references']))
        except Exception as exc:
            detail=exc.read().decode() if isinstance(exc,urllib.error.HTTPError) else str(exc)
            result=dict(voice=voice,label=profile['label'],status='erreur',error=detail)
        results.append(result)
        (ROOT/'essais-xtts/bilan.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
        print(result,flush=True)
    cards=[]
    lines=['# Essais de génération XTTS', '',TEXT,'']
    for result in results:
        if result['status']!='generation_reussie':
            continue
        voice=result['voice']
        reference=INSTALL/bank[voice]['primary']
        copy=dest/(voice+'-reference.wav')
        shutil.copyfile(reference,copy)
        base='essais-xtts/banque/'+voice
        cards.append(f'<section><h2>{html.escape(result["label"])}</h2><code>{voice}</code>'
            f'<div><label>Référence principale<audio controls preload="none" src="{base}-reference.wav"></audio></label>'
            f'<label>Texte généré par XTTS<audio controls preload="none" src="{base}.wav"></audio></label></div></section>')
        lines.append(f'- **{result["label"]}** — `{voice}` : [génération]({base}.wav) · [référence principale]({base}-reference.wav).')
    page=ROOT/'ESSAIS-XTTS-liens-locaux.html'
    page.write_text('<!doctype html><html lang="fr"><meta charset="utf-8"><title>Essais XTTS par personnage</title><style>body{font:17px system-ui;max-width:1000px;margin:40px auto;padding:20px;background:#17191d;color:#eee}section{border-top:1px solid #666;padding:20px 0}label{display:inline-flex;flex-direction:column;margin:8px 20px 8px 0}p{line-height:1.5}audio{max-width:100%}</style><h1>Essais XTTS par personnage</h1><p>Texte inédit généré : '+html.escape(TEXT)+'</p><p>Les personnages disposant de plusieurs extraits utilisent toutes leurs références sélectionnées ; le lecteur de référence n’en montre que la principale. Le succès technique d’une génération ne garantit pas la fidélité au timbre, l’émotion ou l’identification du personnage : ces points restent à écouter.</p>'+''.join(cards)+'</html>')
    rendre_autonome(page,ROOT/'ESSAIS-XTTS.html')
    (ROOT/'ESSAIS-XTTS.md').write_text('\n'.join(lines)+'\n')


if __name__=='__main__':
    main()
