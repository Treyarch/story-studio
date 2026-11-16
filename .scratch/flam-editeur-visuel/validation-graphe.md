# Atelier FLAM centré sur le graphe

À la suite de l’essai matériel, l’utilisateur a retenu un graphe principal
avec médias et règles dans le panneau de la scène sélectionnée.

## Réalisation

- Graphe Cytoscape, déjà présent dans Story Studio, avec scènes, départ,
  fins, jets en losange, choix nommés, liens conditionnels pointillés et
  plages des péripéties.
- Sélection d’une scène, d’un choix ou d’un jet reliée aux formulaires
  existants, à la médiathèque et aux diagnostics. Navigation clavier
  disponible dans la liste des définitions.
- Ajout de scènes et de jets depuis le graphe. Création d’un choix depuis
  une scène vers une scène ou un jet, par clic ou liste de destinations.
  Création et rattachement forment un pas d’annulation commun.
- Déplacement des cartes, zoom, cadrage et réorganisation. Les changements
  de texte et de destination conservent les positions et la caméra.
- Génération et installation accessibles dans l’en-tête, en conservant le
  pack courant quand le panneau est replié.
- Aucun changement de format du projet ni du runtime exporté.

## Vérifications

22 tests ciblés réussissent : projection et synchronisation du vrai moteur
Cytoscape en mode sans rendu, interactions des formulaires et sélection du
graphe, création de liens, annulation/rétablissement, codecs et sauvegarde,
production et harnais du vrai runtime avec et sans narration.

ESLint ciblé, `npm run check:i18n` (zéro erreur et avertissement),
`npm run build` et `git diff --check` passent. La compilation conserve
l’avertissement de taille des bundles.

## Limites

Le placement manuel, initialement limité à la session, est désormais
conservé dans le projet (`authoring.graphLayout`), hors du document joué.
Les déplacements et la réorganisation sont annulables et marquent le projet
modifié. La sauvegarde, « Enregistrer sous » et la reprise de session
conservent ce placement. Les anciens fichiers sans placement restent lisibles. Un brouillon
conserve ses diagnostics, mais un lien à destination absente n’est pas tracé.
Le graphe ne constitue pas un simulateur de partie.

Aucun essai visuel dans la WebView ni nouveau parcours physique sur FLAM
n’est revendiqué pour cette modification d’interface.


## Correction de la persistance du placement

Le test disque a d’abord échoué : le bloc de placement n’était pas admis par
l’enveloppe, et le graphe ne publiait pas ses coordonnées dans le projet.
Le geste réel `dragfree` de Cytoscape est désormais relié au store. Les
coordonnées sont validées à l’entrée, préservées par l’édition du document et
restaurées après lecture ; la suppression d’une scène retire sa position et
son annulation la restaure. Le bouton « Réorganiser » utilise la même sauvegarde.

Les tests couvrent aussi la restauration dans une nouvelle instance de
Cytoscape, les coordonnées négatives et fractionnaires, les refus de
coordonnées invalides ou dupliquées et la garde contre une ancienne session.

Après correction : 25 tests ciblés FLAM et 11 tests du codec et de l’historique
strict passent. ESLint ciblé et la compilation passent également.

## Alignement sur l’Éditeur graphe d’origine

L’utilisateur demande de reprendre au maximum la présentation éprouvée du
graphe d’origine, en ajoutant les possibilités FLAM. Les deux ateliers montent
désormais le même `GraphWorkspacePanels` et les mêmes en-têtes, commandes de
barre et `GraphSurfaceControls`. L’extraction garde la disposition, les
poignées, l’ordre des panneaux et les dialogues de l’atelier avancé.

FLAM retrouve les bascules de panneaux dans la barre principale, la recherche
dans la liste, les outils média communs, le zoom avec pourcentage, le cadrage,
Précédent/Suivant et la vue d’ensemble navigable. Les commandes de création
de scène, de jet, de lien et la production restent dans l’en-tête du graphe.
Les filtres portent les notions FLAM, sans commandes de retour Lunii ni
variantes de rangement non implémentées. La sensibilité de molette reste 1,0.

Ordre, visibilité, largeur des panneaux et ouverture de la vue d’ensemble
utilisent le même mécanisme de préférences que l’éditeur avancé, sous des
clés propres à FLAM. Les positions d’auteur restent sauvegardées dans le
projet ; zoom, sélection et disposition des panneaux ne changent pas ce contenu.

152 tests ciblés passent : FLAM, persistance, panneaux, préférences, commandes,
outils média, chrome de l’application et commandes du graphe d’origine.
ESLint ciblé, `npm run check:i18n` (zéro erreur et avertissement), compilation
et `git diff --check` passent. La vérification du rendu dans la WebView reste
à effectuer ; les tests de rendu statique ne prouvent pas l’apparence à l’écran.

## Régression de chargement de l’éditeur d’origine

L’utilisateur signale un écran vide. Le journal de la WebView situe l’erreur
dans `GraphSearchPanel`. Le rendu de la liste avec des nœuds, ajouté aux tests,
reproduit `ReferenceError: workspaceMode is not defined` : la généralisation
de la barre d’outils avait également remplacé, par erreur, le mode constant
des icônes de cette liste. L’erreur apparaissait après lecture du document,
alors que le montage initial à liste vide passait.

Le mode avancé des icônes est rétabli ; le mode paramétrable reste limité à
la barre d’actions commune. Le nouveau test passe après avoir échoué sur
cette erreur. Les 61 tests ciblant montage initial, liste chargée, chrome et
interactions FLAM passent ; ESLint avec `no-undef` sur la liste passe aussi.

Un second écran vide apparaît après utilisation d’une bascule. Le journal
situe cette erreur dans `Toolbar` : `presentCommon`, encore utilisé pour le
message de suspension, avait perdu son import lors de l’extraction des
commandes. Le test de fermeture/réouverture des deux panneaux, avec ce
message affiché, échoue sur cette référence puis passe après rétablissement
de l’import. Les 62 tests de montage, chrome et interactions passent. L’audit
ESLint de tous les fichiers source modifiés, avec `no-undef` et
`react/jsx-no-undef`, ne relève aucune autre référence indéfinie.

## Prises de liaison FLAM

L’utilisateur demande le raccordement direct entre les points des nœuds,
comme dans l’éditeur d’origine. Les scènes portent une arrivée, une sortie
par choix et une sortie creuse d’ajout ; les jets portent une sortie par plage.
Les fins n’ont pas de sortie. Les prises sont visibles au zoom normal et
restent accessibles sur le nœud survolé ou sélectionné au dézoom.

Le bouton de prise est partagé avec l’éditeur d’origine. Les gestes utilisent
son criblage par proximité et son déplacement de caméra aux bords, avec aperçu
du trait et de la cible. Le relâchement relit la position finale et refuse les
cibles incompatibles. Échap, annulation du pointeur, perte de focus, démontage
ou source devenue périmée ne modifient pas le document.

Une prise existante rebranche son choix ou sa plage sans toucher aux règles,
récompenses ni bornes. Un dépôt dans le vide propose la création d’un nœud
relié ; création, lien et placement sont atomiques et annulables ensemble.
Le clavier conserve une alternative par activation de la prise puis sélection
de destination.

146 tests ciblés passent, dont les gestes de pointeur avec le vrai moteur
Cytoscape, les coordonnées des extrémités après zoom, la relecture au dernier
instant, les refus et annulations, l’historique, les codecs, les formulaires
FLAM et la transmission inchangée des gestes de l’éditeur d’origine.
La compilation, ESLint ciblé avec contrôle des références indéfinies,
les traductions (zéro erreur et avertissement) et `git diff --check` passent.
Aucun essai visuel dans la WebView n’est revendiqué par ces tests.

## Affinage de l’affichage des liens

À partir de la capture utilisateur : la prise « + » est séparée sous la carte,
les sorties restent centrées sur le bord droit et les pastilles sont réduites
et rapprochées du contour. Un badge distingue départ, fin et jet sans répéter
ces mentions au centre de la carte. La sélection utilise un contour plus fin
et un halo discret.

Les liens ont des libellés courts sur fond arrondi, sans répétition de
« Sous condition » ; tirets et infobulle conservent cette information.
Les boucles restent dessinées mais ne montrent leur nom qu’au survol ou à
la sélection. Survoler ou focaliser une prise met son lien en évidence.
16 tests ciblés vérifient projection, états de rendu, prises, glissement,
coordonnées après zoom et formulaires. Compilation, ESLint et contrôle i18n
passent ; le rendu à l’écran reste à confirmer dans l’application.

La capture suivante montre une pointe au-dessus de « La clairière » et un
trait derrière la carte. Le sens et la direction des courbes automatiques
étaient incompatibles avec les prises de départ à droite et d’arrivée à
gauche. Les boucles empruntent désormais des couloirs successifs au-dessus
de la carte, avec une courbure plus large et orientée dans le bon sens.
Un test utilise la routine réelle de Cytoscape, puis échantillonne les deux
arcs : aucun point ne traverse le corps de la carte, les extrémités se
prolongent vers l’extérieur et les deux boucles restent séparées. Il échoue
avant la correction et passe après, sur cinq niveaux de zoom. Les 14 tests
ciblés de projection, prises et liaison, ESLint et la compilation passent.
