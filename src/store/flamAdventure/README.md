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
les fins ont des repères distincts. Les liens narratifs conditionnels sont en tirets ;
les liens de consultation sont pointillés.
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
conditions, jets et consultation. L’adaptateur `flamGraphControls` traduit seulement la
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

## Présentation de l’aventure

Le bloc optionnel `presentation` décrit le menu, ses rubriques et entrées, les
chapitres et passages et les jalons de progression. Il est modifié depuis
l’inspecteur et conservé par le même historique. Les objets acceptent aussi
texte, image et audio facultatifs. Toutes ces références médias suivent celles
des scènes. Les anciens documents sans présentation restent valides. Voir le
[guide du lecteur illustré](../../../docs/flam-interface-aventure.md).

## Menu et fiche dans le graphe

« Ajouter un menu » et « Ajouter une fiche » créent des nœuds de consultation
avec titre, texte et image facultative. Choisir le menu d’accueil dans le champ
« Menu principal ». Une prise d’ajout de menu peut être reliée à une fiche déjà
créée ; l’inspecteur permet aussi d’ajouter, nommer et retirer les accès.
Les cartes de consultation ont une bordure discontinue et leurs liens sont
pointillés. Scènes et jets gardent leurs choix narratifs propres.

Le document v1 ajoute la collection `screens` et la référence `mainMenuId`.
Chaque écran porte `id`, `type` (`menu`, `detail` ou `grid`), `title`, `text`, `image`
et `links`. Un accès de consultation porte `id`, `label`, `screenId` et cible un Menu
ou une Fiche. Une commande narrative porte `id`, `type: "narrative"`,
`choiceId` et référence la collection commune `choices`. Une fiche
n’a pas de sortie configurée ; Retour est fourni par le lecteur. Les accès de consultation ne
portent ni conditions ni effets ; les commandes réutilisent les conditions,
effets, récompenses et destinations des choix narratifs. Les références absentes sont sauvegardables
comme brouillon et diagnostiquées avant la génération ; un menu principal
qui n’est pas un Menu, un accès vers un écran absent ou une commande vers un
choix absent bloque le pack. Un même accès ne peut mélanger ces deux contrats.
Les suppressions encore référencées sont protégées. Les images et positions
de ces nœuds utilisent le cycle commun de médias, d’historique et de fichier.

Le lecteur ajoute Commencer/Reprendre, Recommencer et Bibliothèque au menu
principal. Retour pendant le récit interrompt la narration et ouvre le menu ;
Retour depuis la fiche retrouve le menu par lequel elle a été ouverte.
Les sous-menus conservent en mémoire le chemin réellement emprunté et leur
sélection ; une fiche partagée reste un seul nœud, quel que soit son accès. Reprendre relit la scène narrative
conservée au début, sans exécuter de transition. Les événements audio périmés
sont invalidés avant l’arrêt de la lecture. Consulter ne sauvegarde aucune
transaction de partie et ne déclenche ni effet ni tirage.

Dans l’inspecteur du menu, « Ajouter une commande narrative » crée un choix
et son rattachement au menu en une seule étape d’historique. Son formulaire
est celui des choix de scène : conditions, effets, récompense, destination
vers une scène ou un jet, et comportement indisponible. Sa prise permet de
rebrancher la destination sans perdre les règles. Retirer une commande retire
sa définition seulement si aucune scène ni aucun autre menu ne l’utilise.
Les accès de consultation restent dépourvus de règles. Les listes de menu
se parcourent par groupes de trois lignes avec la molette.

Le lecteur décrit les commandes sans modifier la partie. À la validation,
il vérifie le rattachement au menu, les conditions, la récompense et la
faisabilité de tous les effets sur une copie de la partie. Le même moteur
applique ensuite la transition, sauvegarde et confirme la partie, puis
poursuit le récit. Une nouvelle tentative de sauvegarde conserve l’identité
de la commande et de son menu ; aucun effet partiel ne fuit dans la partie.
Une véritable commande narrative remplace la scène à reprendre et quitte
le chemin de consultation ; Reprendre ne rejoue aucune commande.

Les fiches enrichies, les fiches personnage et le thème commun sont décrits ci-dessous. Le bloc `presentation`
antérieur reste lisible sans conversion ; son formulaire n’est proposé que
tant qu’aucun écran n’a été créé dans le graphe. Quand un menu principal est
désigné, il fournit l’accueil à la place des anciennes rubriques.

## Thème, remplacements et aperçu

« Couleurs de l’aventure » règle le fond, le texte et la sélection communs.
Dans « Couleurs de cet écran », activer un remplacement pour la couleur à
personnaliser. Le désactiver rétablit l’héritage ; changer le thème conserve
les autres remplacements. Les champs acceptent une couleur `#RRGGBB`, via
sélecteur ou saisie. Une valeur incorrecte reste sauvegardable comme brouillon,
avec un diagnostic localisé qui bloque la génération.

Le document v1 porte un objet optionnel `theme`. Scènes et écrans portent un
objet optionnel `colors`. Ces deux objets acceptent `background`, `text` et
`selection`, chacun optionnel. La priorité est : remplacement de l’écran,
puis thème, puis défaut (`#132e32`, `#f3f0df`, `#53d9d1`). Un remplacement
retiré est un champ absent, sans copie de la valeur héritée. Les règles,
l’état de partie et les médias ne portent aucune couleur.

Le module `theme.js` fournit la résolution commune et une projection de
présentation sans exécution de conditions ni d’effets. L’aperçu de l’écran
sélectionné apparaît dans le graphe : composition 320 × 212, couleurs
résolues, titre, début de texte, image et choix. Son sélecteur permet de
présenter les autres choix sans jouer une partie. Commencer/Reprendre y
est un libellé d’auteur illustratif, indépendant d’une sauvegarde de joueur.
La narration configurée est identifiée, sans lecture automatique. Les cartes
du graphe reprennent aussi le fond et le texte résolus de leurs écrans.

Le lecteur Lua résout le même contrat à chaque changement d’écran et applique
le fond au conteneur, le texte aux libellés et la sélection au choix pointé.
Il réutilise ses styles, sans allouer un style à chaque mouvement de molette.
Les retours, sous-menus et reprises narratives rétablissent les couleurs de
leur destination. Le thème et ses remplacements passent par l’historique,
la sauvegarde, la réouverture et la validation native de génération.

Les futurs gabarits adoptent `colors` et la même priorité d’héritage ; leur
composition d’aperçu sera ajoutée lors de leur livraison. L’aperçu utilise
les polices du poste : la qualité visuelle et la lisibilité sur l’écran
physique restent vérifiées au ticket de validation matérielle.

## Grille d’inventaire et fiche type des objets

Ajouter une Grille dans le graphe, puis une Fiche. Dans « Contenu de la fiche »,
choisir « Objet sélectionné dans la grille ». Relier la prise de la Grille à
cette fiche type, ou la sélectionner dans « Fiche type des objets ». Un Menu
peut ensuite ouvrir la Grille. La fiche type n’exige aucune copie de contenu :
les noms, descriptions et images sont renseignés dans la collection Objets.
Son titre d’auteur sert à la reconnaître dans le graphe ; le joueur voit le
nom de l’objet consulté.

La Grille porte `type: "grid"`, `source: "inventory"` et `detailScreenId`,
référence d’un écran `detail` avec `contentSource: "item"`. Une fiche ordinaire
utilise `contentSource: "author"` ou l’absence du champ. Une Grille n’a pas de
liens de menu ; sa prise de fiche type représente un seul lien pour tous les
objets possibles. Une fiche type ne s’ouvre pas directement depuis un Menu,
car elle exige un objet sélectionné. Les diagnostics des références et les
protections de suppression couvrent ce contrat, côté éditeur et génération.

Le lecteur ne retient que les objets dont la quantité est positive. Chaque
page affiche quatre cases en deux lignes et deux colonnes, avec image
facultative et nom. La case pointée utilise la couleur de sélection. Tourner
la molette parcourt les cases, puis les commandes Page précédente, Page
suivante et Retour lorsqu’elles sont disponibles ; la commande pointée et
le numéro de page apparaissent en bas. Cliquer un objet ouvre sa fiche avec
ses données uniques, sans consommation ni autre transaction. Retour retrouve
la page et la case pointées, puis le menu d’accès. Un inventaire sans objet
présente « Inventaire vide. ».

L’ouverture suivante reflète les quantités actuelles après acquisition ou
consommation par le récit. Les données de page et de sélection restent dans
le chemin de consultation en mémoire ; elles ne modifient pas la sauvegarde
narrative. Le rendu réutilise quatre cases et au plus quatre sources d’image
sur la page, relâchées quand elles ne sont plus utilisées.

Grille et fiche type adoptent thème, remplacements, historique, sauvegarde,
réouverture et préparation des médias communs. L’aperçu de la Grille présente
les définitions d’objets par quatre, sans prédire leur possession dans une
partie. Celui de la fiche type permet de sélectionner un objet de référence
et réutilise son contenu. Les collections d’auteur utilisent la même grille, comme décrit ci-dessous.
Les compositions et l’audio des fiches sont décrits dans la section suivante.

## Collections et souvenirs conditionnels

Dans « Source de la grille », choisir « Entrées de l’auteur ». Ajouter les
entrées, renseigner leur libellé et image facultative, puis choisir une Fiche
d’auteur pour chacune ou relier sa prise dans le graphe. Plusieurs entrées
peuvent partager une même Fiche. Le contenu détaillé est celui de la Fiche ;
son image peut différer de la vignette de collection.

Le document porte alors `source: "collection"`, `detailScreenId: null` et un
ensemble `entries`. Chaque entrée porte `id`, `label`, `image`, `screenId`,
`conditions` et `unavailable` (`hidden` ou `disabled`). Les conditions sont
celles des choix narratifs : classe, quantité d’objet et événement. Aucun
effet ni commande narrative n’est admis dans une entrée. La fiche cible doit
être une Fiche d’auteur ; une fiche type d’objet exige le contexte d’inventaire.
Les identifiants d’entrée sont uniques dans le document, notamment pour
l’affectation différée des médias.

Le formulaire propose explicitement Masquer l’entrée ou Afficher verrouillée
lorsque les conditions ne sont pas réunies. Le lecteur filtre les entrées
masquées avant de répartir les contenus par quatre. Les entrées verrouillées
restent des cases visibles marquées `[x]`, avec libellé et image, mais leur
validation n’ouvre aucune destination. Retours, pages, sélection et thème
utilisent le même parcours que l’inventaire. Une collection sans contenu
visible affiche « Collection vide. ».

Pour conserver un souvenir après consommation d’un objet, définir un événement
comme « Clé découverte », le mémoriser dans le récit lors de l’acquisition,
puis conditionner le souvenir sur cet événement. Conditionner au contraire
sur une quantité d’objet reflète seulement sa possession actuelle. Consulter
ne mémorise pas une découverte : seules les actions du récit modifient la
partie. Les conditions sont relues à chaque ouverture de la collection.

Les entrées, règles, références et images passent par les diagnostics,
l’historique, la sauvegarde et la génération communs. Les références invalides
bloquent la génération et les fiches encore utilisées sont protégées contre
la suppression. Le changement de source réinitialise sa configuration dans
une seule étape d’historique ; Annuler retrouve les entrées et médias précédents.
L’aperçu présente toutes les définitions d’auteur et précise que les conditions
détermineront les contenus accessibles dans une partie.

## Illustration commune ou selon le choix sélectionné

Scènes et Menus proposent « Mode d’illustration » : Illustration commune ou
Selon le choix sélectionné. Le mode commun conserve l’image de l’écran en
parcourant ses choix. En sélection, l’image associée au choix pointé est
utilisée ; à défaut, l’image commune reste visible. Sans aucune de ces images,
l’illustration est masquée. Pendant la narration d’une scène, l’image commune
est utilisée jusqu’à l’affichage des choix.

Les scènes portent `illustrationMode: "common" | "selection"`, avec `common`
par défaut. L’image de chaque choix est un champ `image` optionnel de la
collection `choices`. Le formulaire de choix propose son image, y compris
depuis l’édition de la scène. Les Menus portent le même mode ; chaque accès
ou commande de `links` peut porter sa propre `image`. Une commande de menu
peut ainsi utiliser une autre illustration que le même choix dans une scène.
Les commandes automatiques Commencer/Reprendre, Recommencer et Bibliothèque
utilisent l’image commune lorsqu’aucune image de choix ne leur est associée.

Dans l’inspecteur d’un Menu en mode sélection, les images se règlent sur les
accès et commandes. Changer de mode conserve les images configurées pour
pouvoir revenir au réglage précédent. L’aperçu utilise le même choix d’image
et son sélecteur permet de parcourir les choix sans avancer une partie.
Les couleurs de thème et leurs remplacements restent ceux de l’écran.

Les images sont attachées aux identifiants des choix et des accès, et non à
leur position dans la liste. Le lecteur transporte ces images avec les choix
visibles après filtrage et défilement. Un mouvement de sélection change
seulement l’image affichée : aucun effet, sauvegarde, tirage ou audio n’est
exécuté. Seule la validation du choix applique son comportement habituel.

Ces médias utilisent la préparation, la relativisation, le déplacement et la
génération communs. Une importation différée de choix retrouve son identité ;
celle d’un accès de Menu retrouve le couple menu/accès pour éviter les
homonymes. Un accès supprimé ou un projet remplacé n’est pas recréé par le
résultat d’un ancien import. Modes, affectations et suppressions d’image sont
annulables et retrouvés à la réouverture.


## Fiches enrichies et carnet

Un écran `detail` accepte `layout: "split"` (valeur par défaut) ou
`layout: "fullImage"`, ainsi qu’un chemin `audio` facultatif. Ces champs
sont réservés aux Fiches. Titre et texte peuvent rester vides ; image et audio sont facultatifs.
La fiche type d’inventaire reprend le nom, le texte, l’image et l’audio de
l’objet courant ; seul son gabarit est configuré sur l’écran.

La composition descriptive réserve 140 × 140 pixels à l’image à gauche et
144 × 140 au texte à droite. Sans image, le texte utilise toute la largeur.
Le carnet réserve les 296 × 140 pixels de contenu à l’image, ajustée en
conservant ses proportions. Si un texte l’accompagne, Lire la description
et Voir l’illustration alternent les deux vues. Les textes longs se parcourent
ligne par ligne avec Texte précédent et Texte suivant, sur une fenêtre de
sept lignes. Le découpage préserve les caractères UTF-8.

Écouter la description lance explicitement l’audio ; Arrêter la description
ou Retour l’arrête. La fin naturelle et les erreurs de lecture gardent la
fiche et sa position de lecture. Les événements audio périmés restent ignorés.
Ces actions ne sauvegardent pas la partie, ne valident pas l’écoute d’une
scène et ne rejouent aucun effet. Reprendre conserve la narration depuis son
début. Les fiches d’auteur, les collections et les objets utilisent ce même
lecteur.

L’aperçu présente la composition et permet de parcourir le texte, sans lire
l’audio. Réglages et médias passent par l’historique, la sauvegarde, la
réouverture et la préparation communs. Les diagnostics et la validation native
rejettent une composition inconnue ou ces champs sur un autre type d’écran.


## Fiche personnage

Ajouter une fiche personnage crée un écran `type: "character"`, relié aux
Menus comme les autres consultations. Son `image` est le portrait facultatif ;
`text` contient la description commune. La liste `information` contient des
blocs `{ id, text, conditions }`, présentés dans leur ordre après cette
description. Les identifiants sont uniques dans le document.

Chaque bloc utilise les conditions existantes de classe, de possession d’objet
et d’événement ; toutes ses conditions doivent être satisfaites. Une liste vide
rend le bloc toujours visible. Pour conserver une découverte après consommation
d’un objet, utiliser un événement acquis par le récit. Les classes gardent leur
sens narratif, sans statistiques ni jauges de personnage.

Le vrai moteur de règles filtre les blocs à l’ouverture. Le lecteur réutilise
la composition descriptive et le défilement des Fiches : portrait à gauche,
texte à droite, ou texte en pleine largeur sans portrait. Une fiche entièrement
vide reste consultable. Retour suit le menu d’origine, sans effet, jet,
sauvegarde ni changement de scène narrative à reprendre.

L’inspecteur configure les blocs avec le même éditeur de conditions que le
récit. L’aperçu d’auteur montre tous les blocs et indique cette convention,
sans simuler une partie. Portrait, conditions, liens, couleurs et textes suivent
l’historique et le cycle de fichier commun. Les références des blocs protègent
les définitions contre la suppression ; leurs diagnostics mènent à la fiche.
Les champs `information` sont réservés à ce gabarit, sans effets autorisés.


## Filtres et rangement du graphe unifié

Les commandes Tout, Récit et Consultation filtrent la surface du graphe.
Tout montre les scènes, jets et écrans de consultation. Récit montre les
scènes, jets et Menus portant des commandes narratives, avec leurs liens
narratifs. Consultation montre les Menus, Grilles, Fiches et Fiches personnage,
avec leurs liens de consultation. Une fiche partagée garde toujours un seul
nœud. Les filtres de familles de liens restent disponibles séparément ; une
consultation conditionnelle appartient à la famille Consultation.

Le filtre s’applique aussi aux prises, aux destinations proposées, au cadrage
et à la vue d’ensemble. Il masque les éléments sans les retirer du moteur,
sans changer leurs positions ni le document d’auteur. Le filtre de visibilité
reste local à la surface ; il n’est pas enregistré dans le fichier de projet.

Ranger agit sur les cartes et les liens visibles, de gauche à droite. Les
cycles sont regroupés dans une colonne et leurs sorties vont vers les colonnes
suivantes. Les cartes d’une même colonne sont espacées selon leur hauteur,
y compris les Menus longs. Les positions masquées restent intactes. Cette
opération utilise la commande de placement commune : elle est annulable,
rétablissable et enregistrée dans `authoring.graphLayout`. La réouverture
restaure les positions de tous les éléments.

Ces réglages de présentation restent hors du document joué : ils ne changent
ni les destinations, ni les règles, ni les données compilées pour le lecteur.


## Démonstration complète

Le [guide d’usage des écrans](../../../docs/flam-ecrans-guide.md) décrit les
parcours livrés. La démonstration originale L’atelier des lucioles se trouve
sous `exports/flam-ecrans-personnalisables/atelier-des-lucioles/`, avec son
projet `.mbah`, ses images et narrations locales, et son pack de production.
Sa définition reproductible est `scripts/flamDemoFixture.mjs` ; le même
parcours combiné est exécuté par le harnais Lua depuis les deux générateurs.
Le [compte rendu du ticket 11](../../../.scratch/flam-ecrans-personnalisables/validation-11.md)
sépare ces contrôles locaux des essais sur appareil restant à effectuer.
