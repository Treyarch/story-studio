# Document d’aventure FLAM

Le [premier lot](../../../.scratch/flam-editeur-visuel/issues/01-document-aventure.md)
fournit le document et son raccord au cycle de projet ; il ne génère pas encore
d’aventure jouable. L’[ADR](../../../docs/adr/0001-document-aventure-flam.md)
explique le mode de projet distinct.

Le [deuxième lot](../../../.scratch/flam-editeur-visuel/issues/02-edition-scenes-regles.md)
ajoute l’entrée « Aventure FLAM » et les formulaires d’auteur. Le choix initial
propose un projet vide ou « Les compagnons du village », avec une nouvelle
identité d’aventure à chaque création. L’exemple reste en français comme tout
contenu d’auteur ; les commandes sont traduites en français, anglais et italien.
La génération et l’installation sont disponibles depuis « Génération et
installation » en tête de l’atelier ; voir le [runtime](../../flamRuntime/README.md).

## Atelier graphe

Le graphe est la vue principale. Les scènes sont des cartes, les jets des
losanges ; les liens portent les choix et les plages du dé. Le départ et
les fins ont des repères distincts. Les liens conditionnels sont pointillés.
Une sélection ouvre le formulaire correspondant dans le panneau Réglages.
La liste des définitions offre aussi un accès clavier aux mêmes éléments.

L’atelier partage avec l’Éditeur graphe le châssis `GraphWorkspacePanels`,
les en-têtes, les commandes de barre et `GraphSurfaceControls` : panneaux
déplaçables, redimensionnables et refermables, zoom avec pourcentage, cadrage,
navigation Précédent/Suivant et vue d’ensemble. Les préférences de panneaux
FLAM sont conservées séparément des préférences de l’éditeur avancé.
La sélection rouvre les réglages masqués ; les outils média passent de la
liste au graphe lorsque la liste est fermée.

La recherche et les filtres de liste portent les scènes, classes, objets,
événements, récompenses, jets et choix. Les filtres de liens distinguent choix,
conditions et jets. L’adaptateur `flamGraphControls` traduit seulement la
caméra et les nœuds vers les commandes communes : il ne projette pas les
règles FLAM dans le modèle Lunii.

« Relier depuis cette scène » crée un choix vers une scène ou un jet, par
clic dans le graphe ou par la liste de destinations. Ce geste et le rattachement
à la scène sont un unique pas d’annulation. Pour prolonger une fin, il faut
retirer son statut de fin. Les règles et médias restent édités par les mêmes
formulaires et commandes ; aucun moteur de jeu n’est ajouté au graphe.

Les prises permettent aussi le raccordement direct par glissement. La prise
creuse d’une scène ajoute un choix ; ses autres prises déplacent les liens
existants. Un jet possède une prise par plage de péripéties, dirigée uniquement
vers une scène. Une fin conserve son arrivée sans prise de sortie. Les traits
et prises utilisent les mêmes coordonnées, y compris après zoom.

Le geste reprend la prise commune `GraphLinkPort`, le criblage de cible et le
déplacement de caméra aux bords de l’éditeur d’origine. Échap, une annulation
du pointeur, une perte de focus ou un démontage annulent le glissement. La
cible et le document vivant sont relus au relâchement. Le clavier permet
d’activer une prise puis de choisir la destination dans la liste.

Un dépôt dans le vide ouvre la création d’une scène ou d’un jet relié. Le
nouveau nœud, son placement et le raccordement forment un seul pas d’annulation.
Annuler le dialogue ne modifie rien. Les bornes d’une plage, les conditions,
effets et récompenses d’un choix sont conservés lors d’un changement de cible.

Déplacement des cartes, zoom, cadrage et réorganisation sont des gestes de
vue. Le placement manuel et la réorganisation sont enregistrés dans
`authoring.graphLayout` du projet, avec leurs propres positions de scènes et
de jets. Ils marquent le projet modifié, passent par l’historique ordinaire et
sont restaurés à la réouverture, après « Enregistrer sous » et en reprise de
session. Les anciens projets sans ce bloc reçoivent un placement automatique.
Les coordonnées ne font pas partie du document exporté sur FLAM. Un brouillon aux références absentes
reste éditable : ses liens incomplets ne sont pas dessinés, et ses diagnostics
permettent de retrouver les champs concernés.

Chaque choix propose « Relancer la narration si ce choix revient à la même
scène ». Activé par défaut, ce réglage conserve la lecture habituelle. Désactivé,
il affiche directement les choix actualisés après application des effets et
sauvegarde, y compris si un jet ramène à la scène courante. Une destination
différente joue toujours sa narration. Le champ optionnel `replayAudioOnReturn`
vaut implicitement `true` dans les documents existants.

## Interface

- `createAdventureDocument({ title })` crée un brouillon vide, une identité
  d’aventure neuve et une compatibilité de partie initiale `saveVersion: 1`.
- `assertAdventureDocument(document)` vérifie strictement la forme, la version,
  les types de règles et l’unicité globale des identifiants. Il lève une
  `AdventureDocumentError` portant `code` et `path`. Il n’invente aucun champ.
- `diagnoseAdventureDocument(document)` retourne des diagnostics de contenu
  `{ code, path, severity, params }`. Les chemins sont des pointeurs JSON dans
  le document. Une structure invalide lève ; une référence manquante, quantité
  invalide ou plage de dé incorrecte produit un diagnostic `error`.
- `editAdventureDefinition(document, { collection, id, patch })` ajoute ou
  modifie une définition par ses champs ; `patch: null` la supprime si aucune
  référence ne subsiste. Les champs `name`, `title` ou `label` sont renommables,
  l’identifiant ne l’est pas. Une définition ajoutée doit porter tous ses champs.
- `replaceAdventureDocument(previous, next)` vérifie la structure et refuse
  un changement d’identité, de compatibilité de partie ou une suppression
  encore référencée. Il retourne un clone et ne modifie aucun argument.
- `createFlamProject({ document, projectName, storage })` enveloppe le document
  dans un projet `.mbah`. Sans argument, il crée un brouillon et son stockage.
- `withFlamDocument(project, document)` produit un projet modifié via les mêmes
  règles. L’appelant l’installe par `store.setProject` pour bénéficier de
  l’historique ordinaire, sans créer de seconde pile d’annulation.
- `editAdventure(document, command)` assemble les gestes de formulaires. Ajouter
  ou retirer un choix et son rattachement à une scène constitue une mutation
  atomique ; les suppressions encore référencées sont refusées par le document.
- `commitAdventureEdit(store, epoch, command)` relit le projet vivant, refuse
  les résultats d’une ancienne époque ou d’une définition supprimée, puis
  publie un unique pas d’historique. Les formulaires ne gardent aucun document
  parallèle. Les résultats médias et voix passent par cette même porte.
- `adventureDiagnosticTarget(document, path)` retrouve la définition à inspecter
  depuis un diagnostic du module. L’interface sélectionne cette définition,
  défile jusqu’au champ et lui donne le focus.

## Représentation

Le document porte `version`, `id`, `saveVersion`, `title`, `startSceneId` et les
collections `scenes`, `choices`, `classes`, `items`, `events`, `rewards`, `rolls`.
La [fixture originale](./example.json) illustre
les deux classes, la clé consommable, la porte mémorisée, une récompense unique
et les vingt issues possibles du dé réparties entre deux fins.

Les choix sont référencés par les scènes. Ils mènent soit à une destination,
soit à un jet dont les issues portent les destinations. Les conditions sont
une conjonction ; les effets expriment `chooseClass`, `giveItem`, `consumeItem`
ou `setEvent`. Une récompense regroupe ses effets et l’option `repeatable`.
Les quantités doivent être des entiers positifs pour la génération, mais une
quantité négative ou fractionnaire reste enregistrable comme brouillon.

Les scènes portent des chemins médias `audio` et `image`, chacun nullable.
Le parcours commun des références sait les relativiser, les déplacer et les
protéger contre une suppression comme médias inutilisés. Les textes et les
identifiants ne sont pas traités comme des chemins.

Les diagnostics `CONDITIONAL_EXITS` sont des avertissements demandant un essai
de parcours. Ils ne démontrent pas une impasse, ni une absence d’impasse.
Le module n’exécute pas les règles et ne valide aucune sauvegarde d’appareil.

## Vérifications

```sh
node --test scripts/flamAdventure.test.mjs scripts/flamAdventurePersistence.test.mjs
node --test scripts/flamEditing.test.mjs scripts/flamEditorInteraction.test.mjs scripts/flamGraph.test.mjs
node --test scripts/flamWorkspacePanels.test.mjs scripts/flamWorkspaceViewState.test.mjs
node --test scripts/flamGraphLinks.test.mjs scripts/flamGraphPorts.test.mjs
```

Ces tests passent par le module, les codecs réels, le store sous double
exécution stricte et les fonctions de sauvegarde sur disque temporaire réel.
Seuls React, les dialogues et le transport de fichiers Tauri sont simulés.
