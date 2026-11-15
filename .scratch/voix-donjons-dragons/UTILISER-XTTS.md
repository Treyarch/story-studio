# Utiliser les voix regroupées avec XTTS

Le serveur est installé dans `/home/mathieu/.local/share/story-studio-xtts` et écoute uniquement sur `http://127.0.0.1:8020`. Il utilise le processeur. Il est compatible avec les routes utilisées par Story Studio (`/health`, `/voices`, `/speakers`, `/tts`).

## Brancher Story Studio

Dans **Préférences → Génération de voix locale** :

1. Choisir **XTTS (avancé)** et activer XTTS.
2. Adresse : `http://127.0.0.1:8020`.
3. Dossier XTTS : `/home/mathieu/.local/share/story-studio-xtts`.
4. Langue : français (`fr`). Cocher le démarrage automatique et le mode CPU.
5. Cliquer sur **Tester et actualiser les voix**.

Les identifiants commencent par `dd_` : par exemple `dd_narration_faerun`, `dd_kissandra`, `dd_aurinax`, `dd_renaer`, `dd_esvel_rojenard`, `dd_xanathar`. La correspondance avec les personnages figure dans [BANQUE-XTTS.md](/home/mathieu/Documents/story-studio/voix-donjons-dragons/BANQUE-XTTS.md). Les valeurs de configuration sont aussi conservées dans [configuration-xtts.json](/home/mathieu/Documents/story-studio/voix-donjons-dragons/configuration-xtts.json) ; ce fichier documente les réglages, il ne constitue pas un import automatique dans l’application.

Les préférences de l’application n’ont pas été changées directement pendant son exécution. Une fois ces valeurs renseignées, sélectionner la voix dans la fenêtre de génération d’un champ audio, puis lancer la génération. Le serveur renvoie un WAV 24 kHz ; Story Studio récupère le fichier depuis son dossier `output`.

## Regroupements

Les quatre identités fusionnées sont **Aurinax**, **Xanathar**, **Renaer** (dont son déguisement de mendiant) et **Esvel Rojenard** (dont l’indic anonyme). Chaque personnage dispose d’un identifiant unique et de deux références sélectionnées.

Les autres profils restent distincts. Les deux narrations ne sont pas fusionnées sur la seule base d’une proximité acoustique. Le videur drakéide reste hors de la banque active : sa seule réplique est trop courte. Volo est présent, mais sa référence de 4,62 s est courte ; sa fidélité doit être évaluée à l’écoute.

Les fichiers restent séparés et le serveur transmet les différentes références au même conditionnement XTTS. Il ne réentraîne pas le modèle. Une copie de la meilleure référence est également disponible sous `voices/<identifiant>.wav` pour la compatibilité de Story Studio ; les références multiples vivent sous `voices/references/<identifiant>/`. Leur liste et leurs noms sont dans `voice-bank.json`.

Le choix de variante conserve l’original quand le fond est estimé discret, sinon UVR si disponible puis Spleeter. Ce choix est une présélection modifiable, et la validation globale des échantillons ne constitue pas une validation individuelle de tous les timbres. Certains noms ou attributions restent à confirmer comme indiqué dans les fiches d’origine.

## Écouter les générations

[ESSAIS-XTTS.html](/home/mathieu/Documents/story-studio/voix-donjons-dragons/ESSAIS-XTTS.html) présente une génération de chaque voix avec sa référence principale. La page embarque les audios et reste lisible sans accès aux fichiers voisins. Le [bilan JSON](/home/mathieu/Documents/story-studio/voix-donjons-dragons/essais-xtts/bilan.json) donne les résultats HTTP et les temps de traitement. Le texte est inédit et identique entre les voix pour faciliter l’écoute.

Le succès technique et la reconnaissance des mots ne garantissent pas que l’interprétation est fidèle au personnage. Écouter une génération courte avant de produire un chapitre entier.

## Démarrage et arrêt

Le serveur lancé pendant cette session est un service utilisateur temporaire :

```bash
systemctl --user status story-studio-xtts.service
systemctl --user stop story-studio-xtts.service
```

Après arrêt, Story Studio peut le relancer via le démarrage automatique, grâce à `venv/bin/python` et `server.py`. Démarrage manuel :

```bash
cd /home/mathieu/.local/share/story-studio-xtts
./venv/bin/python server.py --cpu
```

Ne pas lancer une deuxième instance si le port 8020 répond déjà. Le journal du service de cette session est `serveur.log`. Les conditionnements vocaux sont mis en cache dans `conditioning/` et recalculés si les fichiers de référence changent. Le serveur ne rend aucun dossier accessible par HTTP.

## Versions et modèle

L’environnement Python est isolé. Les versions effectives sont conservées dans `.scratch/voix-donjons-dragons/xtts-requirements.lock.txt` du dépôt. Les scripts de regroupement et d’adaptation HTTP y sont aussi conservés. Les fichiers sources d’origine n’ont pas été modifiés.

Le modèle est **XTTS-v2**, téléchargé depuis [coqui/XTTS-v2](https://huggingface.co/coqui/XTTS-v2), et utilisé avec `coqui-tts` 0.28.0. Sa [licence CPML](https://huggingface.co/coqui/XTTS-v2/blob/main/LICENSE.txt) limite l’utilisation du modèle et de ses sorties à un usage non commercial. Une copie accompagne le modèle et les essais (`LICENSE-XTTS.txt`).

Documentation technique : [références multiples XTTS](https://coqui-tts.readthedocs.io/en/latest/models/xtts.html) et [installation Coqui TTS](https://coqui-tts.readthedocs.io/en/latest/installation.html).
