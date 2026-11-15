#!/usr/bin/env python3
"""2ᵉ passe : corrections lexicales ASR ciblées (sans réécriture de style)."""
from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKUP = ROOT / "backup-avant-lexique"
MODEL = "turbo"

STORIES = [
    ("sur-les-chemins-de-faerun", "Donjons & Dragons, Sur les Chemins de Faerûn"),
    ("dans-les-bas-fonds-deauprofonde", "Donjons & Dragons, Dans les bas-fonds d'Eauprofonde"),
]


def natural(name: str):
    return [int(s) if s.isdigit() else s.lower() for s in re.split(r"(\d+)", name)]


def write_json(path: Path, data) -> None:
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temp.replace(path)


def build_rules():
    rules = []

    def add(pat: str, repl: str, note: str, flags: int = 0):
        rules.append((re.compile(pat, flags), repl, note))

    # Créatures / monstres
    add(r"\btiraneuils\b", "tyrannœils", "tyrannoœil", re.I)
    add(r"\btiraneuil\b", "tyrannœil", "tyrannoœil", re.I)
    add(r"\btir à neuil\b", "tyrannœil", "tyrannoœil", re.I)
    add(r"\btir à neul\b", "tyrannœil", "tyrannoœil", re.I)
    add(r"\btyrannite\b", "tyrannœil", "tyrannoœil", re.I)
    add(r"\bméphite\b", "méphite", "méphite")  # noop keep case later
    add(r"\bMéfite\b", "Méphite", "méphite")
    add(r"\bméfite\b", "méphite", "méphite")
    add(r"\bméfie de fumant\b", "méphite fumant", "méphite", re.I)
    add(r"\boursibou\b", "ours-hibou", "ours_hibou", re.I)  # filet de sécurité

    # Vocabulaire clair
    add(r"\bJouer du lutte\b", "Jouer du luth", "luth")
    add(r"\bTon lutte\b", "Ton luth", "luth")
    add(r"\bton lutte\b", "ton luth", "luth")
    add(r"\bdu lutte\b", "du luth", "luth")
    add(r"\bun lutte\b", "un luth", "luth")
    add(r"palette de verre", "palette de vert", "vert")
    add(r"d'un verre doré", "d'un vert doré", "vert")
    add(r"empreintes de sabots de plusieurs dents", "empreintes de sabots de plusieurs cerfs", "cerfs")
    add(r"\bdufteux\b", "duveteux", "duveteux", re.I)
    add(r"sur ses cerfs,", "sur ses serres,", "serres")
    add(r"sur ses cerfs ", "sur ses serres ", "serres")
    add(r"des cerfs de dragon", "des serres de dragon", "serres")
    add(r"avec des cerfs de dragon", "avec des serres de dragon", "serres")
    add(r"jambes à leurs coups", "jambes à leur cou", "cou")
    add(r"\benjaillit\b", "en jaillit", "en_jaillit", re.I)
    add(r"\bpoudines noirs\b", "poudings noirs", "pouding", re.I)
    add(r"\bpoudines\b", "poudings", "pouding", re.I)
    add(r"carte des égaux", "carte des égouts", "egouts", re.I)
    add(r"membres du game municipal", "membres du guet municipal", "guet", re.I)
    add(r"agents du gay", "agents du guet", "guet", re.I)
    add(r"hommes du gain", "hommes du guet", "guet", re.I)
    add(r"cellules du gay", "cellules du guet", "guet", re.I)
    add(r"\bHéberlué\b", "Éberlué", "eberlue")
    add(r"\bHéberluée\b", "Éberluée", "eberlue")
    add(r"\bUn non-K\b", "Un en-cas", "encas")
    add(r"T'accordes\?", "Ta corde ?", "corde")
    add(r"T'affiches personnages", "Ta fiche personnage", "fiche")
    add(r"un ray de lumière", "un rayon de lumière", "rayon", re.I)
    add(r"Comment haussent-elles", "Comment osent-elles", "osent")
    add(r"D'un bon agile", "D'un bond agile", "bond")
    add(r"ça m'est bien légal", "ça m'est bien égal", "egal")
    add(r"panneaux en chaîne", "panneaux en chêne", "chene")
    add(r"fait de vitrailles", "fait de vitraux", "vitraux")
    add(r"épousser les braises", "épousseter les braises", "epousseter")
    add(r"\bFaitons ça\b", "Fêtons ça", "fetons")
    add(r"\bun indique\b", "un indic", "indic", re.I)
    add(r"\bchalons\b", "chalands", "chalands", re.I)
    add(r"Renverser en stand", "Renverser un stand", "stand")
    add(r"tu t'entends bien que mal", "tu t'en sors tant bien que mal", "entends")
    add(r"esquive le cou\b", "esquive le coup", "coup")
    add(r"forme de mâles au trésor", "forme de malles au trésor", "malles")
    add(r"\baller furter\b", "aller fureter", "fureter")
    add(r"\bBauf,", "Bof,", "bof")
    add(r"signe de filet", "signe de filer", "filer")
    add(r"ne l'émeugère", "ne l'émeut guère", "emeut")
    add(r"\bSenior Finland\b", "Seigneur Phylund", "phylund")
    add(r"Ne produit-t-il pas", "Ne produit-il pas", "produit_il")
    add(r"\bIl Il\b", "Il", "doublon_il")
    add(r"\bScoupe\b", "Scoop", "scoop")

    # UI dés
    add(r"résultat de (\d+) nécessaires", r"résultat de \1 nécessaire", "des_ui")
    add(r"\bun lancé réussi\b", "un lancer réussi", "lancer")

    # Méloun / Aurinax résiduels
    add(r"\bMais Lune\b", "Méloun", "meloun")
    add(r"\bMais Loune\b", "Méloun", "meloun")
    add(r"\bde mes lunes\b", "de Méloun", "meloun")
    add(r"au-dessus de mes lunes", "au-dessus de Méloun", "meloun")
    add(r"que t'as donnée au Rinax", "qu'Aurinax t'a donnée", "aurinax")
    add(r"\bau Rinax\b", "Aurinax", "aurinax")

    # Journal (validé à l'écoute : Eauprofonde News)
    add(r"\ble Haut Profonde News\b", "le Eauprofonde News", "journal")
    add(r"\bHaut Profonde News\b", "Eauprofonde News", "journal")
    add(r"aux profondes news", "à l'Eauprofonde News", "journal", re.I)
    add(r"\bDeepwater News\b", "Eauprofonde News", "journal")
    add(r"au Eauprofonde News", "à l'Eauprofonde News", "journal")

    # Enclave casing
    add(r"l'enclave d'émeraudes", "l'Enclave d'Émeraude", "enclave", re.I)
    add(r"l'enclave d'émeraude", "l'Enclave d'Émeraude", "enclave", re.I)
    add(r"\benclave d'émeraudes\b", "Enclave d'Émeraude", "enclave", re.I)
    add(r"\benclave d'émeraude\b", "Enclave d'Émeraude", "enclave", re.I)

    # Portail Béant casing léger
    add(r"\bauberge du portail béant\b", "auberge du Portail Béant", "portail")
    add(r"\bAuberge du portail béant\b", "Auberge du Portail Béant", "portail")

    return [(p, r, n) for (p, r, n) in rules if not (n == "méphite" and p.pattern == r"\bméphite\b")]


RULES = build_rules()

NOTES = {
    "tyrannoœil": "tiraneuil / tir à neu* / tyrannite → tyrannœil",
    "méphite": "méfite / méfie de fumant → méphite",
    "ours_hibou": "oursibou → ours-hibou",
    "luth": "lutte (instrument) → luth",
    "vert": "verre (couleur) → vert",
    "cerfs": "dents (sabots) → cerfs",
    "duveteux": "dufteux → duveteux",
    "serres": "cerfs (griffes) → serres",
    "cou": "jambes à leurs coups → à leur cou",
    "en_jaillit": "enjaillit → en jaillit",
    "pouding": "poudines → poudings",
    "egouts": "carte des égaux → égouts",
    "guet": "gay / gain / game → guet",
    "eberlue": "Héberlué → Éberlué",
    "encas": "Un non-K → Un en-cas",
    "corde": "T'accordes → Ta corde",
    "fiche": "T'affiches personnages → Ta fiche personnage",
    "rayon": "ray de lumière → rayon",
    "osent": "haussent-elles → osent-elles",
    "bond": "bon agile → bond agile",
    "egal": "légal → égal (ça m'est…)",
    "chene": "chaîne → chêne (panneaux)",
    "vitraux": "vitrailles → vitraux",
    "epousseter": "épousser → épousseter",
    "fetons": "Faitons → Fêtons",
    "indic": "un indique → un indic",
    "chalands": "chalons → chalands",
    "stand": "Renverser en stand → un stand",
    "entends": "t'entends bien que mal → t'en sors…",
    "coup": "esquive le cou → le coup",
    "malles": "mâles au trésor → malles",
    "fureter": "furter → fureter",
    "bof": "Bauf → Bof",
    "filer": "signe de filet → filer",
    "emeut": "émeugère → émeut guère",
    "phylund": "Senior Finland → Seigneur Phylund",
    "produit_il": "produit-t-il → produit-il",
    "doublon_il": "Il Il → Il",
    "scoop": "Scoupe → Scoop",
    "des_ui": "N nécessaires → N nécessaire",
    "lancer": "un lancé réussi → un lancer réussi",
    "meloun": "Mais Lune / mes lunes → Méloun",
    "aurinax": "au Rinax → Aurinax",
    "journal": "Haut Profonde News / Deepwater → Eauprofonde News",
    "enclave": "casing Enclave d'Émeraude",
    "portail": "casing Portail Béant",
}


def apply_text(text: str, counters: dict) -> str:
    if not text:
        return text
    out = text
    for cre, repl, note in RULES:
        out, n = cre.subn(repl, out)
        if n:
            counters[note] = counters.get(note, 0) + n
    out = re.sub(r"[ \t]{2,}", " ", out)
    out = re.sub(r" +([.,;:!?])", r"\1", out)
    return out


def apply_srt(content: str) -> str:
    lines = content.splitlines(True)
    out = []
    for line in lines:
        if re.match(r"^\d+$", line.strip()) or "-->" in line or line.strip() == "":
            out.append(line)
            continue
        nl = "\n" if line.endswith("\n") else ""
        body = line[:-1] if nl else line
        out.append(apply_text(body, {}) + nl)
    return "".join(out)


def compile_story(directory: Path, title: str) -> None:
    records = [
        json.loads(p.read_text())
        for p in sorted((directory / "scenes").glob("*.json"), key=lambda p: natural(p.stem))
    ]
    lines = [
        f"# {title}",
        "",
        "Transcription automatique en français — passes noms + lexique ASR appliquées.",
        "Les scènes et variantes suivent les noms des fichiers, pas un parcours de jeu reconstitué.",
        "",
    ]
    for r in records:
        lines.extend([f"## {r['scene']}", "", r.get("text") or "[Aucune parole détectée]", ""])
    (directory / "histoire.md").write_text("\n".join(lines), encoding="utf-8")
    write_json(
        directory / "index.json",
        {
            "title": title,
            "model": MODEL,
            "completed": len(records),
            "scenes": [
                {
                    "scene": r["scene"],
                    "audio": r["audio"],
                    "duration": r["duration"],
                    "review": r.get("review", []),
                }
                for r in records
            ],
        },
    )


def ensure_backup() -> None:
    if BACKUP.exists():
        print(f"Backup déjà présent : {BACKUP}")
        return
    BACKUP.mkdir(parents=True)
    for slug, _ in STORIES:
        shutil.copytree(ROOT / slug, BACKUP / slug)
    print(f"Backup créé : {BACKUP}")


def main() -> None:
    ensure_backup()
    report = {}
    for slug, title in STORIES:
        directory = ROOT / slug
        scenes_changed = 0
        counters: dict[str, int] = {}
        for jp in sorted((directory / "scenes").glob("*.json"), key=lambda p: natural(p.stem)):
            data = json.loads(jp.read_text(encoding="utf-8"))
            before = data.get("text", "")
            after = apply_text(before, counters)
            if "segments" in data:
                for seg in data["segments"]:
                    if isinstance(seg.get("text"), str):
                        seg["text"] = apply_text(seg["text"], {})
                    for w in seg.get("words") or []:
                        if isinstance(w.get("word"), str):
                            w["word"] = apply_text(w["word"], {})
            data["text"] = after
            rev = list(data.get("review") or [])
            if after != before and "lexique_normalise" not in rev:
                rev.append("lexique_normalise")
            data["review"] = rev
            write_json(jp, data)
            jp.with_suffix(".txt").write_text((after or "") + "\n", encoding="utf-8")
            sp = jp.with_suffix(".srt")
            if sp.exists():
                sp.write_text(apply_srt(sp.read_text(encoding="utf-8")), encoding="utf-8")
            if after != before:
                scenes_changed += 1
        compile_story(directory, title)
        report[slug] = {"scenes_modifiees": scenes_changed, "corrections": counters}
        print(f"\n{slug}: {scenes_changed} scènes modifiées")
        for k, v in sorted(counters.items(), key=lambda kv: -kv[1]):
            print(f"  {v:4d}  {NOTES.get(k, k)}")

    write_json(ROOT / "revue-lexique-stats.json", report)
    print("\nStatistiques :", ROOT / "revue-lexique-stats.json")


if __name__ == "__main__":
    main()
