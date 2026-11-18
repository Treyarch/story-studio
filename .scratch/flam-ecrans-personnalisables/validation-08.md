# Validation du ticket 08 — Fiches enrichies

Réalisation et contrôles locaux du 17 novembre 2026. La validation sur FLAM
physique reste au ticket 11.

## Livraison

Les Fiches proposent une composition descriptive avec grande illustration
à gauche et texte à droite, et une composition Carnet avec illustration
occupant tout l’espace de contenu. Sans image, le texte prend toute la largeur.
Le carnet peut aussi porter une description : une commande alterne image et
texte. Titre vide, image absente et audio absent sont acceptés.

Les descriptions longues sont découpées sans casser les caractères UTF-8.
Texte précédent et Texte suivant déplacent une fenêtre de sept lignes, avec
bornes et indicateur de position. L’image conserve ses proportions dans le
rectangle disponible, y compris lorsqu’une même source change de composition.

L’audio ne démarre qu’avec Écouter la description. Il peut être arrêté depuis
la fiche ; Retour l’arrête avant d’afficher le parent. Fin naturelle et erreur
conservent la fiche et son défilement, avec possibilité de relancer l’écoute.
Les protections contre les événements périmés, les arrêts prématurés et les
durées indisponibles sont conservées. L’écoute d’une fiche ne marque pas une
scène narrative comme entendue.

Les fiches d’auteur et celles ouvertes depuis une collection utilisent le
même rendu. Une fiche type d’inventaire réutilise directement nom, description,
image et audio de l’objet, sans recopier ses médias sur l’écran. Aucun de ces
parcours ne rejoue les effets, ne modifie la partie ou ne sauvegarde une
consultation. Reprendre relit la scène conservée depuis son début.

L’inspecteur expose composition et audio facultatif avec les champs médias
existants. L’aperçu reprend thème, image, défilement et bascule du carnet ; il
ne lit pas d’audio. Réglages et médias utilisent l’historique, la sauvegarde,
la réouverture, la préparation et les diagnostics communs. Les validations
JavaScript et Rust refusent les compositions inconnues et les champs de fiche
sur un autre type d’écran.

## Contrôles exécutés

- `node --test scripts/flam*.test.mjs` : 75 tests réussis.
- `cargo test --manifest-path src-tauri/Cargo.toml services::flam_pack::tests --lib` :
  23 tests réussis.
- ESLint ciblé sur les composants, le store et les scripts FLAM : réussi.
- `npm run check:i18n` : zéro erreur, zéro avertissement.
- `npm run build` : réussi, avec l’avertissement habituel de taille des bundles.

Le même harnais exécute le vrai lecteur Lua avec `richDetailsFixture`, depuis
les données compilées en JavaScript puis depuis le pack natif préparé avec
images et audio réels, généré, validé et extrait. Les dimensions LIF sont lues
pour vérifier les positions et le zoom des illustrations.

Il parcourt intégralement une description longue, vérifie accents et dernier
texte, bornes et conservation du défilement après écoute. Il couvre lecture
explicite, arrêt manuel, fin naturelle, sortie pendant la lecture, événement
périmé après sortie, échec de chargement et arrêt prématuré. La scène conservée
n’est pas marquée entendue par la fiche ; sa reprise et sa propre écoute
conservent leur fonctionnement. Carnet à titre vide, alternance texte/image,
fiche entièrement vide, objet avec audio propre et fiche partagée depuis une
collection sont également exécutés, sans sauvegarde ni mutation de partie.

Les interactions d’éditeur couvrent composition, aperçu, texte long, import
et suppression audio, annulation, réouverture et fiche type d’objet. Le test
de persistance vérifie composition et médias après déplacement du projet.

## Limites

La disposition, les sources images et les commandes sont vérifiées au travers
du harnais LVGL local. Leur lisibilité et leur rendu exact sur l’appareil
physique restent à confirmer au ticket 11.
