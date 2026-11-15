# Transcriptions des aventures Donjons & Dragons

Sources : les deux copies locales de la bibliothèque Story Studio. Aucun fichier source n’est modifié et aucun audio n’est envoyé à un service distant. Le modèle Whisper est téléchargé, puis la reconnaissance fonctionne localement sur le processeur.

Pour chaque histoire :

- `scenes/*.txt` : transcription brute par fichier audio ;
- `scenes/*.srt` : sous-titres horodatés ;
- `scenes/*.json` : texte, segments, mots horodatés, indicateurs de confiance et chemin de l’audio source ;
- `histoire.md` : compilation des scènes et variantes selon l’ordre naturel de leurs noms ;
- `index.json` : correspondances entre textes et audios.

Les noms de fichiers sont conservés. Leur ordre ne reconstitue pas les embranchements du jeu. Les textes sont automatiques. Des passes **noms** puis **lexique ASR** ont été appliquées (voir `REVUE.md`, `GLOSSAIRE-NOMS.md`) ; des accords / phrases douteuses restent. Les scènes sans parole ou présentant certains indicateurs de faible confiance sont signalées dans l’index. Une transcription vide peut également être due à une parole manquée par la détection vocale.

## Reprendre

```bash
/home/mathieu/.local/share/story-studio-transcription/venv/bin/python /home/mathieu/Documents/story-studio/transcriptions-donjons-dragons/transcrire.py
```

Les scènes déjà transcrites avec le même modèle et le même SHA-256 sont conservées. Les nouveaux résultats sont enregistrés progressivement. `etat.json` apparaît lorsque le traitement complet se termine ; `erreurs.json` recense les éventuels échecs. Le journal du traitement lancé comme service est dans `traitement.log`.

## Utilisation pour la suite

Les transcriptions peuvent alimenter une synthèse des personnages, événements, objets et fils narratifs avant la rédaction d’une nouvelle aventure. Il faut relire les noms propres et distinguer les variantes incompatibles avant d’en tirer une chronologie.

Pour XTTS, la référence vocale est un extrait audio ; la transcription aide à sélectionner et documenter cet extrait. Aucun échantillon n’est encore validé pour XTTS. Il faudra écouter les candidats pour choisir un seul locuteur, sans musique, bruit ni autre voix, avant de préparer les WAV de référence. La transcription seule ne sépare pas la voix de la musique et n’identifie pas les comédiens.

## Suivre le traitement en cours

Le service utilisateur `story-studio-transcriptions-dd.service` poursuit le lot indépendamment de la conversation, tant que la machine et la session utilisateur restent actives.

```bash
systemctl --user status story-studio-transcriptions-dd.service
 tail -n 10 /home/mathieu/Documents/story-studio/transcriptions-donjons-dragons/traitement.log
```

Pour arrêter le calcul : `systemctl --user stop story-studio-transcriptions-dd.service`. La commande « Reprendre » ci-dessus conserve les scènes terminées.
