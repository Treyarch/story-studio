# Voix des aventures Donjons & Dragons

Outils locaux et reproductibles pour préparer les références XTTS ; les audios et modèles restent hors dépôt.

## Emplacements

- Corpus et fiches d’écoute : `/home/mathieu/Documents/story-studio/voix-donjons-dragons/`.
- Transcriptions relues : `.scratch/transcriptions-donjons-dragons/`.
- Séparation / diarisation : `/home/mathieu/.local/share/story-studio-voix/`.
- Serveur et modèle XTTS : `/home/mathieu/.local/share/story-studio-xtts/`.

## Chaîne de traitement

- `extraire.py` : séparation Spleeter par blocs, diarisation, embeddings, cache et catalogue acoustique provisoire via `cataloguer.py`.
- `roles.json`, `extraire_roles.py` : repères de personnages attribués d’après le récit ; comparaison original / séparation.
- `comparer_uvr.py` : variante UVR sur les passages au fond plus présent.
- `autonomiser.py`, `verifier_fiche.py` : intégration des WAV dans les HTML et contrôle de portabilité / intégrité. Les versions `*-liens-locaux.html` sont les sources des fiches autonomes.
- `preparer_banque.py` : regroupement des personnages déjà reconnus (Aurinax, Xanathar, Renaer et Esvel), choix explicite des variantes et installation des références. Les noms de personnages ne sont pas déduits des seuls clusters acoustiques.
- `xtts_server.py` : source du `server.py` déployé dans l’installation XTTS ; protocole `/health`, `/voices`, `/speakers`, `/tts` de Story Studio. CPU, boucle locale uniquement, génération sérialisée, références multiples et cache de conditionnement.
- `tester_banque.py` : génération d’un même texte inédit par chaque profil actif, bilan et fiche d’écoute autonome.

Ne pas relancer la transcription brute sur les textes relus. Les sorties générées n’écrasent pas les MP3 sources. La validation globale des échantillons a été donnée par l’utilisateur ; le choix de variante reste une présélection modifiable et certaines identifications restent incertaines.

## Installation XTTS utilisée

Python 3.12, PyTorch / torchaudio 2.8 CPU, `coqui-tts` 0.28.0. Installer PyTorch et torchaudio depuis l’index CPU officiel avant les autres dépendances ; le verrouillage effectif figure dans `xtts-requirements.lock.txt`. Le paquet `six` est nécessaire à l’import des modules de texte de cette version.

Le modèle public `coqui/XTTS-v2` est téléchargé sous `models/xtts-v2/` ; l’installation conserve ses empreintes dans `model-manifest.json` et sa licence dans `LICENSE.txt`. La CPML limite l’utilisation du modèle et de ses sorties à un usage non commercial.

Le guide utilisateur et les réglages précis sont dans `UTILISER-XTTS.md` du corpus. La configuration native Story Studio n’a pas été modifiée directement pendant l’exécution de l’application. Les essais couvrent le protocole HTTP et les fichiers locaux attendus par Story Studio ; la connexion via les préférences de l’application reste à effectuer.

## État conservé dans Git

Les guides, la configuration de connexion, le manifeste de regroupement et les bilans de vérification sont versionnés ici. Le manifeste conserve les chemins et empreintes des références choisies. Les fichiers audio, HTML avec audios intégrés, environnements Python et poids des modèles restent dans les emplacements locaux ci-dessus. Les sondes exploratoires sont conservées sous `essais-techniques/`.
