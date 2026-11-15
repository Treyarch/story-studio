# Validation du lot 04 : génération et installation contrôlées

La génération et l’installation sont disponibles dans le panneau de l’éditeur
FLAM. Générer choisit un dossier de sortie ; installer demande séparément
le volume monté et sa confirmation. Modifier le document désactive
l’installation du pack précédent jusqu’à une nouvelle génération.

## Résultat livré

- Un dossier `<uuid>.flam` contenant l’archive `adventure.plain.pk` et son
  manifeste. Le document JSON est revérifié côté Rust, sans code Lua fourni
  par l’interface. Le runtime embarqué et le module de données sont contrôlés
  à l’octet lors de chaque relecture.
- Narrations converties par FFmpeg en MP3 stéréo, 44,1 kHz, 128 kb/s, sans tags
  ni Xing, avec tables de seek vérifiées. Le texte sans piste reste du texte.
  Images préparées en JPEG, au plus 320 × 240, sous des noms internes générés.
- Publication exclusive après vérification des chemins, de l’identité,
  des ressources, du manifeste et des empreintes. Un média absent, un document
  invalide ou une annulation ne publie aucun nouveau pack prêt.
- Transfert limité aux volumes FLAM montés et accessibles en écriture,
  firmwares 2.4.1 et 2.4.2. Refus de toute identité déjà listée ou présente,
  y compris masquée ou orpheline. Verrou de mutation partagé avec le pilote.
- Liste, liste masquée éventuelle, cache et reçu conservés sur l’ordinateur
  sous `flam-installations/<identifiant-de-transfert>/` dans les données de
  l’application. Les clés de chiffrement ne figurent pas dans le reçu.
- Chiffrement, transfert temporaire, relecture, publication exclusive,
  contrôle des modifications concurrentes, barrière de volume et relecture
  finale. Annulation avec restauration quand l’état est reconnaissable ;
  erreur de récupération explicite et conservation du reçu sinon.

Le contrat technique et les limites figurent dans le
[README du runtime](../../src/flamRuntime/README.md).

## Vérifications locales

- `cargo test --manifest-path src-tauri/Cargo.toml --lib flam_ --no-default-features` :
  27 tests réussis ; 1 test matériel explicitement ignoré.
- Les tests Rust construisent le pack de production, l’extraient et exécutent
  le harnais Lua complet avec et sans narration. Il couvre les deux classes,
  l’inventaire, les effets atomiques, les récompenses, les vingt résultats,
  les revisites, les refus de stockage et les protections audio du lot 03.
- Les volumes synthétiques démontrent le chiffrement, les sauvegardes,
  la relecture, le refus de remplacement visible/masqué/orphelin,
  les annulations avant et après inscription et après invalidation du cache,
  la préservation des histoires et parties témoins et la conservation d’une
  liste modifiée par une intervention externe.
- Les refus couvrent aussi une archive altérée, un manifeste d’identité
  étrangère, du Lua modifié même avec des empreintes recalculées, un chemin
  d’archive interdit, les liens, les références invalides et les médias absents.
- Les 18 tests ciblés FLAM du cycle de projet, de l’édition, du runtime et
  de la production passent. Les formulaires de production réels sont exercés
  avec les seuls dialogues et IPC simulés : séparation génération/transfert,
  confirmation, révision courante, erreurs, exclusivité et annulation au démontage.
- Une sélection de 90 tests couvrant aussi le codec, l’historique strict,
  les noms de sauvegarde et la production Avancée passe.
- ESLint ciblé, `npm run check:i18n` (zéro erreur et avertissement),
  `npm run build`, le harnais des prototypes et `git diff --check` passent.

## Limites et suite

Aucun appareil réel n’a été écrit pendant ce lot. La lecture physique,
la disposition sur écran et la reprise après extinction hors ligne restent
à confirmer au [ticket 05](issues/05-validation-appareil.md).
Les images sont préparées et livrées, mais le runtime du lot 03 conserve
son rendu texte et choix sans afficher les illustrations des scènes.

Aucune mise à jour d’aventure installée, migration de partie ou réparation
automatique après coupure n’est proposée. Un état de transfert incertain
exige une vérification à partir de la sauvegarde locale ; il n’est jamais
annoncé comme une installation réussie. Les tests ont été exécutés sous Linux ;
aucune validation de transfert Windows ou macOS n’est revendiquée.
