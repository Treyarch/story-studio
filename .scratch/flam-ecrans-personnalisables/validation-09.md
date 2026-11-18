# Validation du ticket 09 — Fiche personnage

Réalisation et contrôles locaux du 17 novembre 2026. La validation sur FLAM
physique reste au ticket 11.

## Livraison

L’atelier et le graphe proposent Ajouter une fiche personnage. Cet écran porte
un portrait facultatif, un titre, une description commune et des informations
textuelles conditionnelles. Il se relie aux Menus et peut être partagé entre
plusieurs parcours de consultation.

Chaque information utilise l’éditeur de conditions existant : classe, objet
possédé ou événement acquis. Les conditions d’un bloc se combinent avec ET ;
sans condition, il est toujours visible. Les classes restent narratives et
aucune statistique chiffrée ou jauge de personnage n’est introduite.

Le lecteur filtre les informations avec le moteur de règles commun à l’ouverture
de la fiche. Il réutilise la grande illustration à gauche et le texte à droite,
avec défilement ligne par ligne des contenus longs. Sans portrait, le texte
occupe toute la largeur. Titre vide et fiche entièrement vide sont acceptés.
Retour retrouve le Menu d’origine ; la consultation ne déclenche ni effet,
ni jet, ni sauvegarde, et Reprendre relit la scène conservée depuis son début.

Le document représente ce gabarit par `type: "character"`, et ses blocs par
`information: [{ id, text, conditions }]`. Les identifiants sont uniques dans
le document. Les références et quantités utilisent les diagnostics existants ;
les informations sur un autre gabarit sont refusées, ainsi que les effets
ou champs inconnus. La frontière native effectue les mêmes validations.

L’aperçu reprend le thème et le portrait avec le défilement. Il indique que tous
les blocs sont montrés à l’auteur, sans simuler les conditions de partie.
L’édition utilise l’historique commun et les portraits suivent la médiathèque,
la sauvegarde, le déplacement du projet et la préparation native des images.

## Contrôles exécutés

- `node --test scripts/flam*.test.mjs` : 78 tests réussis.
- `cargo test --manifest-path src-tauri/Cargo.toml services::flam_pack::tests --lib` :
  25 tests réussis.
- ESLint ciblé sur les composants, le store et les scripts FLAM : réussi.
- `npm run check:i18n` : zéro erreur, zéro avertissement.
- `npm run build` : réussi, avec l’avertissement habituel de taille des bundles.

Le même harnais exécute le vrai lecteur avec `characterSheetFixture`, depuis
les données compilées en JavaScript et depuis le pack de production Rust
préparé, généré, validé puis extrait. Il observe portrait, couleurs, fenêtre de
lecture, informations affichées, commandes, audio et partie sauvegardée.

Le parcours ouvre la fiche avant choix d’une classe, puis avec chacune des deux
classes. Il vérifie les informations de possession et de découverte avant
acquisition, après acquisition et après consommation de la clé. Un bloc exigeant
classe et découverte reste masqué tant que les deux conditions ne sont pas
satisfaites. Les textes longs restent accessibles jusqu’à la dernière ligne,
accents compris. Une fiche sans média ni texte reste accessible. Un second
Menu ouvre la même fiche et Retour retrouve ce Menu. Toute consultation doit
conserver tous les champs de partie, le nombre de sauvegardes et de lectures ;
un tirage inattendu fait échouer le parcours.

Le test d’interaction crée et relie le gabarit, importe le portrait, édite et
supprime un bloc, configure ses conditions, vérifie le diagnostic d’une référence
incomplète et la protection des références, puis annule et rétablit. Il parcourt
le texte de l’aperçu et vérifie la réouverture du document. Le test sur disque
retrouve portrait et conditions après déplacement du projet. Les tests négatifs
JavaScript et Rust couvrent références, types, doublons d’identité, quantités
invalides, portée des informations et rejet des effets/statistiques.

## Limites

Le harnais local vérifie les sources, positions et comportements LVGL. La
lisibilité et le rendu exact du portrait et du texte sur appareil physique
restent à confirmer au ticket 11.
