#!/usr/bin/env python3
"""Regrouper les personnages et installer leurs références sans réencodage."""
import collections
import hashlib
import json
import shutil
from pathlib import Path

ROOT=Path('/home/mathieu/Documents/story-studio/voix-donjons-dragons')
INSTALL=Path('/home/mathieu/.local/share/story-studio-xtts')
LABELS={'aurinax':'Aurinax','xanathar':'Xanathar','renaer':'Renaer Neverember','esvel-rojenard':'Esvel Rojenard'}


def save(path,data):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')


def main():
    roles=json.loads((ROOT/'personnages.json').read_text())['roles']
    groups=collections.defaultdict(list)
    for role in roles:
        groups[role.get('canonical_character',role['id'])].append(role)
    registry={}
    bank=[]
    lines=['# Banque XTTS par personnage','','Qualité des échantillons globalement approuvée par l’utilisateur. Les variantes ci-dessous sont choisies selon une règle explicite : original si le fond estimé est inférieur ou égal à −20 dB ; sinon variante UVR si disponible, puis Spleeter. Ce choix automatique reste modifiable après comparaison.', '',
           'Chaque personnage possède un seul identifiant XTTS. Les extraits de plusieurs scènes sont transmis comme références séparées, sans concaténation. Les narrations des deux histoires restent deux profils ; les rapprochements acoustiques seuls ne créent pas de fusion.', '']
    for key,members in sorted(groups.items()):
        voice='dd_'+key.replace('-','_')
        label=LABELS.get(key,members[0]['role'])
        directory=ROOT/'banque-xtts'/key
        directory.mkdir(parents=True,exist_ok=True)
        available=[]
        for role in sorted(members,key=lambda r:r['removed_background_db']):
            if role['duration']<3:
                continue
            base=ROOT/'personnages'/role['id']
            if role['removed_background_db']<=-20:
                variant='original.wav'
            elif (base/'voix-uvr.wav').exists():
                variant='voix-uvr.wav'
            else:
                variant='voix-separee.wav'
            src=base/variant
            dest=directory/(role['id']+'.wav')
            shutil.copyfile(src,dest)
            installed=INSTALL/'voices/references'/voice/dest.name
            installed.parent.mkdir(parents=True,exist_ok=True)
            shutil.copyfile(src,installed)
            available.append(dict(role_id=role['id'],variant=variant,duration=role['duration'],
                file=str(dest),installed_file=str(installed.relative_to(INSTALL)),
                source=str(src),sha256=hashlib.sha256(src.read_bytes()).hexdigest(),
                story=role['story'],scene=role['scene'],start=role['start'],end=role['end'],
                evidence=role['evidence'],short_reference=role['duration']<6))
        entry=dict(id=voice,character=key,label=label,source_roles=[r['id'] for r in members],
            active=bool(available),references=available,
            selection_status='presélection_après_approbation_globale_pas_de_validation_individuelle')
        if available:
            primary=INSTALL/'voices'/(voice+'.wav')
            shutil.copyfile(available[0]['source'],primary)
            shutil.copyfile(available[0]['source'],directory/'reference-principale.wav')
            registry[voice]=dict(label=label,references=[r['installed_file'] for r in available],
                primary=str(primary.relative_to(INSTALL)),short_reference=any(r['short_reference'] for r in available))
            lines.extend([f'## {label}', '',f'Identifiant : `{voice}` — {len(available)} référence(s).', ''])
            for sample in available:
                rel=Path(sample['file']).relative_to(ROOT)
                lines.append(f"- [{sample['role_id']} : {sample['variant']}]({rel}) — {sample['duration']:.2f} s, `{sample['story']}/{sample['scene']}`.")
            if registry[voice]['short_reference']:
                lines.extend(['','Référence courte : la stabilité de cette voix devra être évaluée sur les générations.'])
            lines.append('')
        else:
            entry['inactive_reason']='Réplique de moins de 3 secondes : davantage de parole est nécessaire.'
            lines.extend([f'## {label}', '',entry['inactive_reason'],''])
        save(directory/'profil.json',entry)
        bank.append(entry)
    save(INSTALL/'voice-bank.json',dict(version=1,voices=registry))
    save(ROOT/'banque-xtts.json',dict(groups=len(bank),active_voices=len(registry),profiles=bank))
    (ROOT/'BANQUE-XTTS.md').write_text('\n'.join(lines)+'\n')
    print(f'{len(bank)} profils regroupés ; {len(registry)} voix actives ; {sum(len(r["references"]) for r in registry.values())} références.')


if __name__=='__main__':
    main()
