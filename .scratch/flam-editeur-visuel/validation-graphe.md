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
