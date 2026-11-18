# Validation du ticket 10 — Filtres et rangement du graphe

Réalisation et contrôles locaux du 17 novembre 2026.

## Livraison

La surface propose Tout, Récit et Consultation. Tout conserve tous les types
de nœuds. Récit montre les scènes et jets ainsi que les Menus portant des
commandes narratives, avec les liens qui font progresser le récit.
Consultation montre les Menus, Grilles, Fiches et Fiches personnage avec
leurs accès de consultation. La même fiche peut recevoir plusieurs liens
sans être dupliquée.

Les prises, les destinations proposées, la vue d’ensemble, le cadrage et
l’historique de navigation respectent le périmètre visible. Le filtre ne
supprime aucun élément du document, ne change aucune destination et ne
modifie aucune position. Il reste un état local de la surface, sans marquer
le projet modifié. Changer de périmètre annule un raccordement en préparation.

Les filtres de familles de liens distinguent désormais Consultation des
choix, conditions narratives et jets. Un lien de consultation conditionnel
reste pointillé ; un lien narratif conditionnel est en tirets. Les conditions
narratives n’effacent plus les liens de collection conditionnels.

Ranger travaille sur les éléments visibles, en colonnes de gauche à droite.
Les cycles sont regroupés dans une colonne ; leurs sorties vont à droite.
Le placement tient compte de la hauteur des cartes et conserve un seul nœud
par définition, même pour les fiches partagées. Les positions des cartes
masquées restent intactes. Le rangement passe par la commande de placement
commune, donc par l’historique, la sauvegarde et la réouverture du projet.

## Contrôles exécutés

- `node --test scripts/flam*.test.mjs` : 84 tests réussis.
- `cargo test --manifest-path src-tauri/Cargo.toml services::flam_pack::tests --lib` :
  26 tests réussis.
- ESLint ciblé sur les composants, le store et les scripts FLAM : réussi.
- `npm run check:i18n` : zéro erreur, zéro avertissement.
- `npm run build` : réussi, avec l’avertissement habituel de taille des bundles.
- `git diff --check` : réussi.

Les tests de projection utilisent une aventure réunissant scènes, jets, Menu
mixte, sous-menus cycliques, Grilles d’inventaire et de collection, Fiche type,
Fiche partagée et Fiche personnage. Ils observent les nœuds et liens conservés
par chaque filtre, les commandes narratives de Menu, les prises, les marques
de vue d’ensemble et la distinction visuelle des liens conditionnels.

Le test de rangement exécute le vrai moteur Cytoscape. Il vérifie la lecture
horizontale, les sorties de cycles, la fiche partagée unique, l’absence de
chevauchement, la stabilité d’un second rangement et les positions masquées.
Les interactions vérifient les trois commandes de filtre et l’absence de
commande d’édition à leur activation. Le parcours de projet vérifie l’état
modifié, annulation/rétablissement et réouverture des positions ; les données
compilées avant et après sont identiques.

`arrangedGraphFixture` applique les trois filtres et le rangement au projet,
puis vérifie que son document d’auteur est identique. Le vrai lecteur Lua
exécute ensuite son parcours personnage et retour au récit depuis les données
compilées en JavaScript, et depuis le pack natif préparé, généré, validé et
extrait. Les protections contre mutations de partie, sauvegardes, lectures
ou jets causés par une consultation restent actives.

## Limites

Les contrôles de disposition et de commandes sont locaux, sans validation
visuelle dans un navigateur. La démonstration complète et le contrôle du
lecteur sur FLAM physique restent au ticket 11.
