# Validation du ticket 06 — Collections et souvenirs conditionnels

Réalisation et contrôles locaux du 17 novembre 2026. Aucune validation de
rendu sur FLAM réelle n’est revendiquée ; elle reste au ticket 11.

## Livraison

Une Grille peut utiliser les entrées de l’auteur en lieu et place de
l’inventaire. Chaque entrée possède libellé, image facultative, référence
à une Fiche d’auteur, conditions et traitement d’indisponibilité. Le formulaire
propose Masquer l’entrée ou Afficher verrouillée. Les mêmes conditions que
le récit sont disponibles ; aucun effet n’est admis dans les entrées.

Les entrées sont reliées à leurs fiches par l’inspecteur ou les prises du
graphe. Rebrancher une fiche conserve conditions, vignette et réglage de
verrouillage. Les fiches peuvent être partagées ; une fiche type d’objet ne
constitue pas une destination valide pour une entrée d’auteur.

Le lecteur évalue les conditions sans transition narrative. Il retire les
entrées masquées avant la pagination 2 × 2 et garde les entrées verrouillées
visibles avec `[x]`, en refusant leur ouverture. Une collection dont toutes
les entrées sont masquées affiche un message explicite. Pages, sélection et
retours réutilisent la navigation de Grille livrée au ticket 05.

Une découverte peut être mémorisée par un événement du récit au moment de
l’acquisition. Une entrée conditionnée par cet événement reste accessible
après consommation ; une entrée conditionnée par la quantité d’objet disparaît
avec la possession. Aucune découverte n’est ajoutée par la consultation.

Le document exprime `source: "collection"`, `detailScreenId: null`, et
`entries` avec `id`, `label`, `image`, `screenId`, `conditions`, `unavailable`.
Les références, quantités et identifiants sont validés côté éditeur et natif ;
les médias suivent les chemins communs de préparation et de déplacement.
Les résultats médias différés retrouvent l’entrée par son identité, sans
remplacer un ancien tableau de contenus après une modification concurrente.
Les palettes et aperçus communs sont réutilisés, sans simulation de partie.

## Contrôles exécutés

- `node --test scripts/flam*.test.mjs` : 69 tests réussis ; après clarification
  du sélecteur d’indisponibilité, les 9 tests d’interaction d’éditeur sont
  également repassés avec succès.
- `cargo test --manifest-path src-tauri/Cargo.toml services::flam_pack::tests --lib` :
  19 tests réussis, dont pack de collection et validation des entrées natives.
- `npm run build` : réussi, avec l’avertissement habituel de taille de bundles.
- ESLint ciblé sur les modules FLAM et tests modifiés : réussi.
- `npm run check:i18n` : zéro erreur, zéro avertissement.

Le même parcours du vrai lecteur Lua utilise `collectionsFixture` depuis les
données compilées JavaScript et depuis le pack de production Rust généré,
validé puis extrait. Il observe les commandes, textes, pages, destinations,
audio et sauvegardes, avec les seuls services hôtes simulés.

Le parcours couvre plus de quatre entrées, dont une verrouillée et plusieurs
masquées selon classe, possession ou découverte. Il vérifie les listes de
cases avant acquisition, après acquisition et après consommation, ainsi que
la dernière page partielle. Il tente d’ouvrir une entrée verrouillée, puis
vérifie l’ouverture de cette même entrée après satisfaction de sa condition.
Il couvre aussi une collection entièrement masquée, des fiches partagées,
les retours et reprises, et la réouverture du lecteur.

La clé consommée disparaît de l’inventaire et de l’entrée de possession,
tandis que le souvenir de sa découverte reste consultable. Les comparaisons
portent sur tous les champs de partie et le nombre de sauvegardes ; un tirage
inattendu pendant ce parcours fait échouer le harnais. Les consultations
répétées ne lancent aucun audio ni transaction narrative.

Les interactions d’auteur couvrent création de la collection, libellé,
vignette, conditions d’événement puis d’objet, choix d’indisponibilité,
raccordement à une fiche, historique, aperçu, réouverture et diagnostic
localisé de quantité invalide. Le changement de source est annulable en
restaurant entrées et médias. Les contrôles sur disque confirment le retour
des références, conditions, réglages et images après déplacement du projet.
Les prises refusent une fiche type et une source devenue périmée.

## Limites

Les entrées utilisent des Fiches simples d’auteur. Audio, compositions
enrichies, carnet et défilement avancé des fiches restent au ticket 08.
L’aperçu ne prédit pas l’état d’une partie : il montre les définitions de
l’auteur. Les contrôles locaux ne prouvent pas la lisibilité ni le rendu
physique de l’aventure combinée.
