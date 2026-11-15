#!/usr/bin/env python3
"""Intégrer les WAV de la fiche pour les aperçus sans accès aux fichiers voisins."""
import base64
import html
import re
from pathlib import Path


def rendre_autonome(source: Path, destination: Path):
    source, destination = Path(source), Path(destination)
    root = source.parent.resolve()
    content = source.read_text()

    def replace(match):
        relative = html.unescape(match[2])
        if relative.startswith('data:audio/'):
            return match[0]
        audio = (root/relative).resolve()
        if not audio.is_relative_to(root) or audio.suffix != '.wav':
            raise ValueError(f'Chemin audio inattendu : {relative}')
        data = audio.read_bytes()
        if data[:4] != b'RIFF' or data[8:12] != b'WAVE':
            raise ValueError(f'WAV invalide : {audio}')
        encoded = base64.b64encode(data).decode('ascii')
        return match[1] + 'data:audio/wav;base64,' + encoded + match[3]

    content = re.sub(r'(<audio\b[^>]*\bsrc=")([^"]+)(")', replace, content)
    destination.write_text(content)


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=Path)
    parser.add_argument('destination', type=Path)
    args = parser.parse_args()
    rendre_autonome(args.source, args.destination)
