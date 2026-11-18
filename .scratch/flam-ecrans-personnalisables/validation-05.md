# Validation du ticket 05 — Grille d’inventaire et fiche type

Réalisation et contrôles locaux du 17 novembre 2026. La validation de rendu
sur FLAM réelle reste portée par le ticket 11.

## Livraison

L’auteur ajoute une Grille au graphe et la relie au Menu. Il ajoute une Fiche,
choisit son contenu « Objet sélectionné dans la grille », puis la relie à la
prise de fiche type de la Grille ou la sélectionne dans l’inspecteur. Il
renseigne noms, descriptions et images dans Objets, sans copie par fiche.
Un seul nœud et un seul lien de fiche type suffisent pour tous les objets.

Le document exprime `type: "grid"`, `source: "inventory"`, `detailScreenId`
et, sur la fiche type, `contentSource: "item"`. La Grille ne porte pas de
commandes narratives. Une fiche type exige le contexte d’objet transmis par
la Grille et ne peut être ouverte directement par un accès de Menu. Les
références absentes ou incompatibles bloquent la génération ; les brouillons
restent sauvegardables et les définitions encore utilisées sont protégées.

Le lecteur filtre les quantités strictement positives et présente quatre
cases par page, en 2 × 2, avec nom et image facultative. La case sélectionnée
est mise en évidence. La molette atteint les cases puis les commandes de
pagination et Retour, visibles en bas lorsqu’elles sont pointées, avec le
numéro de page. La dernière page peut être partiellement remplie.

La fiche reçoit le nom, l’image et la description de l’objet sélectionné.
Retour retrouve la page et la case de la grille, puis le menu d’accès ;
Reprendre retrouve la scène conservée. La consultation ne consomme rien,
ne déclenche aucun effet ou jet et ne sauvegarde aucune transaction.
L’ouverture suivante reflète les acquisitions et consommations du récit.
Un inventaire vide présente un message explicite.

Le thème, les remplacements, l’historique, les médias et la persistance sont
réutilisés. Les aperçus de Grille et de fiche type présentent les définitions
d’objet de l’auteur, sans simuler un état de partie. Modifier une définition
modifie aussi le contenu de la fiche consultée et de son aperçu.

## Contrôles exécutés

- `node --test scripts/flam*.test.mjs` : 65 tests réussis.
- `cargo test --manifest-path src-tauri/Cargo.toml services::flam_pack::tests --lib` :
  17 tests réussis, dont parcours du pack de grille et rejet des références
  invalides à la frontière native.
- `npm run build` : réussi ; avertissement habituel de taille de bundles.
- ESLint ciblé sur les modules FLAM et tests modifiés : réussi.
- `npm run check:i18n` : zéro erreur, zéro avertissement.

Le même parcours du vrai lecteur Lua reçoit `inventoryGridFixture` depuis
le compilateur JavaScript et depuis le pack de production généré, validé et
extrait par Rust. Seuls les services hôtes sont simulés. Le harnais observe
les commandes joueur, le stockage, les textes, les images, les positions et
couleurs des cases, les lectures audio et la scène reprise.

Le parcours vérifie un inventaire vide, l’acquisition de six objets, une
première page de quatre cases et une seconde de deux, les images et noms
aux quatre positions, la bonne fiche sur chaque page, l’image facultative,
le retour à la seconde page avec sa sélection, les commandes de pagination,
le retour au Menu et la reprise. Il compare toute la partie et le nombre de
sauvegardes avant et après consultation/reprise. Il vérifie ensuite le dépôt
des six objets, la nouvelle acquisition d’une clé, sa consommation et la
nouvelle consultation vide, y compris après réouverture du lecteur.

Les interactions d’éditeur construisent la Grille, créent une fiche type,
les relient, annulent et rétablissent le lien, éditent une définition d’objet,
inspectent les aperçus et rouvrent le projet. Elles vérifient qu’aucun nœud
ni lien par objet n’est nécessaire. Les prises refusent une fiche ordinaire
comme cible de Grille et une fiche type comme cible directe de Menu. Les
contrôles sur disque conservent les références de Grille et de fiche type,
les couleurs, les placements et les médias après déplacement du projet.

## Limites

Ce lot livre la source Inventaire. Les collections et souvenirs d’auteur
arrivent au ticket 06. La fiche type utilise encore la composition simple ;
son audio et les compositions enrichies appartiennent au ticket 08.
Les assertions graphiques locales ne prouvent pas la lisibilité ni le rendu
sur écran physique : aucune validation matérielle n’est déclarée ici.
