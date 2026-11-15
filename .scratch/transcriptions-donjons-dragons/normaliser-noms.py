#!/usr/bin/env python3
"""Passe légère : normaliser les noms propres incohérents + artefacts ASR évidents."""
from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKUP = ROOT / "backup-avant-revue"
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

    # Artefacts
    add(r"\s*[–—-]?\s*Sous-titrage\b[^\n.]*", "", "artefact_sous_titrage", re.I)

    # Lieux / organisations
    add(r"\b[Hh]exanatar\b", "Xanathar", "xanathar")
    add(r"\bXanatar\b", "Xanathar", "xanathar")
    add(r"\bxanatar\b", "Xanathar", "xanathar")
    add(r"\bZhentarima\b", "Zhentarim", "zhentarim")
    add(r"\bZentarim\b", "Zhentarim", "zhentarim")
    add(r"\bzentarim\b", "Zhentarim", "zhentarim")
    add(r"\bPortcrane\b", "Port-Crâne", "port_crane")
    add(r"\bPorcrane\b", "Port-Crâne", "port_crane")
    add(r"\bPortcrâne\b", "Port-Crâne", "port_crane")
    add(r"\bPort[- ]Crane\b", "Port-Crâne", "port_crane")
    add(r"\bPort[- ]crane\b", "Port-Crâne", "port_crane")
    add(r"\bport crâne\b", "Port-Crâne", "port_crane")
    add(r"\bPort Crane\b", "Port-Crâne", "port_crane")
    add(r"\bGrisforces\b", "Griseforces", "griseforces")
    add(r"\bGrisforce\b", "Griseforces", "griseforces")
    add(r"\bFéérune\b", "Faerûn", "faerun")
    add(r"\bFéérun\b", "Faerûn", "faerun")
    add(r"forêt d'art profond", "forêt d'Arprofond", "arprofond", re.I)
    add(r"d'art profond", "d'Arprofond", "arprofond", re.I)
    add(r"\bart profond\b", "Arprofond", "arprofond", re.I)
    add(r"\b[Aa]u profonde\b", "Eauprofonde", "eauprofonde")
    add(r"d'eau profonde", "d'Eauprofonde", "eauprofonde")
    add(r"\bà eau profonde\b", "à Eauprofonde", "eauprofonde")
    add(r"\beau profonde\b", "Eauprofonde", "eauprofonde")
    add(r"\bEau profonde\b", "Eauprofonde", "eauprofonde")

    # Personnages
    add(r"\bRenner\b", "Renaer", "renaer")
    add(r"\bPhyland\b", "Phylund", "phylund")
    add(r"\bFeyland\b", "Phylund", "phylund")
    add(r"\bOrinax\b", "Aurinax", "aurinax")
    add(r"\borinax\b", "Aurinax", "aurinax")
    add(r"\bVajra Safar\b", "Vajra Safahr", "safahr")
    add(r"\bSafar\b", "Safahr", "safahr")
    add(r"\bAspin\b", "Aspine", "aspine")
    add(r"\bAspinalède\b", "Aspine", "aspine")
    add(r"\bAspinalede\b", "Aspine", "aspine")
    add(r"\bAspinted\b", "Aspine", "aspine")
    add(r"\bAspint\b", "Aspine", "aspine")
    add(r"\bAspina\b", "Aspine", "aspine")
    add(r"\bAspyn\b", "Aspine", "aspine")
    add(r"\bà Spine\b", "à Aspine", "aspine")
    add(r"d'aspine", "d'Aspine", "aspine", re.I)
    add(r"\bKisandra\b", "Kissandra", "kissandra")
    add(r"\bIssandra\b", "Kissandra", "kissandra")
    add(r"\bissandra\b", "Kissandra", "kissandra")
    add(r"\bMéloune\b", "Méloun", "meloun")
    add(r"\bMelun\b", "Méloun", "meloun")
    add(r"\bmelun\b", "Méloun", "meloun")
    add(r"\bRojnar\b", "Rojenard", "rojenard")
    add(r"\bOrinac\b", "Aurinax", "aurinax")
    add(r"\bEau Profonde\b", "Eauprofonde", "eauprofonde")
    add(r"château d'Eau Profonde", "château d'Eauprofonde", "eauprofonde")

    # Créatures / orgs
    add(r"\boursibou\b", "ours-hibou", "ours_hibou", re.I)
    add(r"enclave d'Emeraude", "Enclave d'Émeraude", "enclave_emeraude", re.I)
    add(r"\bMenestrelles\b", "Ménestrels", "menestrels")
    add(r"\bmenestrelles\b", "Ménestrels", "menestrels")
    add(r"\bMenestrelle\b", "Ménestrel", "menestrels")
    add(r"\bmenestrelle\b", "ménestrel", "menestrels")
    add(r"\bMenestrel\b", "Ménestrel", "menestrels")
    add(r"\bmenestrel\b", "ménestrel", "menestrels")
    return rules


RULES = build_rules()

NOTES = {
    "artefact_sous_titrage": "Suppression des hallucinations « Sous-titrage … »",
    "xanathar": "Xanatar/Hexanatar → Xanathar",
    "zhentarim": "Zentarim → Zhentarim",
    "port_crane": "Porcrane/Portcrane/… → Port-Crâne",
    "griseforces": "Grisforce(s) → Griseforces",
    "faerun": "Féérun(e) → Faerûn",
    "arprofond": "art profond → Arprofond",
    "eauprofonde": "eau profonde / Au profonde → Eauprofonde",
    "renaer": "Renner → Renaer",
    "phylund": "Phyland/Feyland → Phylund",
    "aurinax": "Orinax → Aurinax",
    "safahr": "Safar → Safahr",
    "aspine": "Aspin → Aspine (même dryade)",
    "kissandra": "Kisandra → Kissandra",
    "meloun": "Méloune/Melun → Méloun",
    "rojenard": "Rojnar → Rojenard (cohérence avec Esvel Rojenard)",
    "ours_hibou": "oursibou → ours-hibou",
    "enclave_emeraude": "enclave d'Emeraude → Enclave d'Émeraude",
    "menestrels": "Menestrel(les) → Ménestrel(s)",
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
        "Transcription automatique en français — passe de relecture des noms propres appliquée.",
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
            if after != before and "noms_normalises" not in rev:
                rev.append("noms_normalises")
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
        print(f"{slug}: {scenes_changed} scènes modifiées")
        for k, v in sorted(counters.items(), key=lambda kv: -kv[1]):
            print(f"  {v:4d}  {NOTES.get(k, k)}")

    write_json(ROOT / "revue-noms-stats.json", report)
    print("Statistiques :", ROOT / "revue-noms-stats.json")


if __name__ == "__main__":
    main()
