# Validation du ticket 07 — Illustration selon la sélection

Réalisation et contrôles locaux du 17 novembre 2026. La comparaison des
compositions sur FLAM physique reste au ticket 11.

## Livraison

Les scènes et les Menus proposent les modes Illustration commune et Selon
le choix sélectionné. Le premier garde l’image de l’écran pendant la
navigation. Le second affiche l’image du choix pointé, avec repli sur l’image
commune si elle existe. Sans image de choix ni image commune, l’illustration
est masquée. Pendant la narration, la scène affiche son image commune.

Le document porte `illustrationMode` (`common` par défaut, ou `selection`).
Les choix de scène portent une `image` facultative ; les accès et commandes
de Menu portent leur image dans `links`, indépendamment d’une éventuelle
utilisation du même choix dans une scène. Les images restent attachées aux
identités lors d’un changement d’ordre ou du filtrage des choix visibles.

L’inspecteur utilise les champs médias existants et l’aperçu reprend le
mode et l’image de sa sélection locale. Thème et remplacements sont conservés.
La préparation et le cycle de fichier parcourent les nouveaux médias.
Les imports différés retrouvent le choix ou le couple menu/accès dans le
projet vivant, sans écraser les autres modifications ni recréer une cible
supprimée. Les modes et affectations passent par l’historique commun.

Le lecteur décrit les images avec les options sans modifier la partie.
Changer de sélection ne déclenche aucune destination, sauvegarde, lecture
audio ou règle narrative. La validation conserve le fonctionnement normal
du choix. Les gabarits Grille et Fiche restent hors du mode d’illustration
par sélection, leurs images étant déjà gérées par leur propre composition.

## Contrôles exécutés

- `node --test scripts/flam*.test.mjs` : 72 tests réussis.
- `cargo test --manifest-path src-tauri/Cargo.toml services::flam_pack::tests --lib` :
  21 tests réussis, dont pack d’illustrations sélectionnées et validation native.
- `npm run build` : réussi, avec l’avertissement habituel de taille de bundles.
- ESLint ciblé sur les modules FLAM et tests modifiés : réussi.
- `npm run check:i18n` : zéro erreur, zéro avertissement.

Le même harnais Lua utilise `selectionIllustrationsFixture` depuis le
compilateur JavaScript et depuis le pack de production Rust généré, validé
puis extrait. Pour ce pack, les fichiers images préparés ont des couleurs
RGB565 distinctes afin de ne pas confondre deux illustrations dans les
observations. L’oracle vérifie la source réellement affectée au widget
principal de l’illustration.

Le parcours couvre un Menu principal en mode sélection avec liste longue,
un sous-menu en mode commun et un autre en mode sélection sans image
commune. Il vérifie les images d’accès et de commande narrative, le repli
commun d’un choix sans image et l’effacement de l’image précédente en
l’absence de repli. Il couvre aussi une scène en mode commun et une autre
en mode sélection avec plus de trois choix, un choix masqué placé avant
les autres et un ordre de choix modifié dans le document d’auteur.

Les mouvements de sélection sont observés sans validation : tous les champs
de partie, les sauvegardes et les lectures restent inchangés et un tirage
inattendu fait échouer le harnais. Les consultations, retours, reprises et
réouvertures retrouvent le mode attendu. La validation d’un véritable choix
reste capable d’accorder la récompense prévue.

Les interactions d’éditeur vérifient choix du mode, affectation et suppression
d’image, aperçu de plusieurs sélections, conservation des images après
réorganisation, annulation et réouverture. Une importation de Menu terminée
après renommage de l’accès conserve son nouveau libellé ; après suppression,
elle ne recrée rien et ne rajoute aucune étape d’historique. Un identifiant
d’accès homonyme d’un écran ne détourne pas l’affectation média.

Les contrôles sur disque vérifient modes et images des choix de scène, accès
et commandes de Menu après sauvegarde et déplacement du projet. Les nouveaux
médias sont protégés comme médias utilisés et la génération valide leurs
types et références via les frontières existantes.

## Limites

Les commandes automatiques de Menu sans image propre utilisent l’illustration
commune. Les tests locaux vérifient les sources et le comportement ; ils ne
prouvent pas la lisibilité ou le rendu exact sur l’écran physique. Cette
validation matérielle reste nécessaire au ticket 11.
