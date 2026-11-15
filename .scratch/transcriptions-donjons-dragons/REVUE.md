# Revue des transcriptions Donjons & Dragons

Date : 2026-11-14. Passe **légère** : cohérence des noms propres + suppression
d’artefacts Whisper évidents. Pas de réécriture stylistique.

## Bilan

| Histoire | Scènes | Scènes touchées (noms) |
|---|---|---|
| Sur les Chemins de Faerûn | 340 | ~160 |
| Dans les bas-fonds d’Eauprofonde | 444 | ~220 |

Fichiers mis à jour par scène : `.json` (texte + segments), `.txt`, `.srt`,
puis `histoire.md` et `index.json` régénérés.

- Script : [`normaliser-noms.py`](normaliser-noms.py)
- Stats : [`revue-noms-stats.json`](revue-noms-stats.json)
- Glossaire : [`GLOSSAIRE-NOMS.md`](GLOSSAIRE-NOMS.md)
- Backup : [`backup-avant-revue/`](backup-avant-revue/)

Les scènes corrigées portent le marqueur `noms_normalises` dans `review`.

## Corrections de noms (principales)

- **Lieux** : Eauprofonde, Arprofond, Faerûn, Port-Crâne
- **Factions** : Zhentarim, Xanathar, Griseforces, Enclave d’Émeraude, Ménestrels
- **Personnages** : Phylund, Renaer, Aspine, Aurinax, Kissandra, Méloun, Rojenard, Safahr
- **Créatures** : ours-hibou
- **Artefacts** : ~11× « Sous-titrage ST' 501 / FR … » supprimés

## Passe lexicale (2026-11-15)

Script : [`normaliser-lexique.py`](normaliser-lexique.py) —
stats : [`revue-lexique-stats.json`](revue-lexique-stats.json) —
backup : [`backup-avant-lexique/`](backup-avant-lexique/).

~107 scènes touchées. Principaux motifs :
tyrannœil, méphite, luth, vert/serres/cerfs, guet, Méloun résiduel,
UI dés (nécessaire / lancer), casing Enclave / Portail Béant.

Jugement lexical validé à l’écoute : **Haut Profonde News → Eauprofonde News**.

## Encore non corrigé (volontaire)

- Accords / conjugaisons cassés (« atteignaient », « sors ses outils », etc.)
- Phrases ASR trop douteuses (« Pour l'amour de home », « Tit tit je n'ai fronté »,
  « médaillons. naturel. », « Reporters sans affaires »)
- Réécriture stylistique

## Validation noms

Les 3 jugements (Aspine, Rojenard, Aurinax) ont été validés à l’écoute
le 2026-11-15.

## Suite possible

1. S’appuyer sur `GLOSSAIRE-NOMS.md` pour génération (XTTS / suite narrative).
2. Relire les scènes « tronc » pour la grammaire restante, au besoin.
3. Restauration : `backup-avant-lexique/` (lexique) ou `backup-avant-revue/` (pré-noms).
