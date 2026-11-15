#!/usr/bin/env python3
"""Vérifier la portabilité et l'intégrité des médias embarqués d'une fiche."""
import argparse
import base64
import hashlib
from html.parser import HTMLParser
from pathlib import Path

class AudioSources(HTMLParser):
    def __init__(self):
        super().__init__()
        self.sources=[]
    def handle_starttag(self, tag, attrs):
        if tag=='audio':
            self.sources.append(dict(attrs)['src'])

def verify(page, local):
    p,q=AudioSources(),AudioSources()
    p.feed(page.read_text());q.feed(local.read_text())
    assert p.sources, 'aucun lecteur audio'
    assert len(p.sources)==len(q.sources), 'nombre de lecteurs différent'
    for i,(embedded,relative) in enumerate(zip(p.sources,q.sources),1):
        assert embedded.startswith('data:audio/wav;base64,'), f'Lecteur {i} : dépendance à un fichier voisin ({embedded})'
        data=base64.b64decode(embedded.split(',',1)[1],validate=True)
        original=(local.parent/relative).read_bytes()
        assert hashlib.sha256(data).digest()==hashlib.sha256(original).digest(), f'Lecteur {i} : audio altéré'
    print(f'{page.name} : {len(p.sources)} lecteurs autonomes, WAV identiques aux sources.')

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('page',type=Path)
    parser.add_argument('local',type=Path)
    args=parser.parse_args()
    verify(args.page,args.local)
