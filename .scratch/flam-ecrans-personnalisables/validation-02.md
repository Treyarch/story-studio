# Validation du ticket 02 — Menu principal et fiche

Réalisation et contrôles locaux du 16 novembre 2026. Le ticket 01 reste le
parent ; les fonctionnalités des tickets 03 à 11 ne sont pas incluses.

## Parcours livré

Dans une aventure FLAM, ajouter un Menu et une Fiche depuis le graphe ou
la liste des écrans de consultation. Éditer leurs titres, textes et images
facultatives. Désigner le Menu dans « Menu principal ». Relier sa prise
d’ajout à une Fiche existante, ou ajouter un accès dans l’inspecteur et
choisir sa fiche. Les liens de consultation sont pointillés et les cartes
ont une bordure discontinue ; scènes et jets restent narratifs.

Le lecteur généré propose automatiquement Commencer/Reprendre au menu.
Retour pendant le récit interrompt la narration et ouvre ce menu ; une
fiche retrouve le menu par Retour. Reprendre relance le début de la scène
narrative conservée, sans appliquer de transition. La consultation répétée
ne modifie ni les objets, ni les récompenses, ni les événements, ni les jets.

Le document v1 porte `screens` et `mainMenuId`. Les liens de consultation
n’acceptent aucun effet ni destination narrative. Les références invalides
sont diagnostiquées et bloquent la génération ; les brouillons restent
sauvegardables. Les suppressions référencées sont protégées. Images, liens
et positions suivent l’historique et le fichier de projet, y compris après
déplacement du projet. Aucun changement des modes Lunii ni conversion
ou suppression d’aventure n’est nécessaire.

## Contrôles exécutés

- `node --test scripts/flam*.test.mjs` : 53 tests réussis ; ajout ensuite du
  parcours de glissement des prises de consultation dans
  `scripts/flamGraphLinks.test.mjs` : ses 9 tests réussissent, dont ce nouveau
  parcours (54 tests FLAM au total).
- `cargo test --manifest-path src-tauri/Cargo.toml services::flam_pack::tests --lib` :
  12 tests réussis, dont génération Rust, relecture et extraction du pack,
  puis exécution du vrai lecteur Lua et validation des références natives.
- `npm run build` : réussi ; avertissement de taille de certains bundles.
- ESLint ciblé sur les modules FLAM et tests modifiés : réussi.
- `npm run check:i18n` : zéro erreur et zéro avertissement, catalogues et
  métadonnées français, anglais et italien.

Le même parcours `scripts/check-flam-presentation.lua` reçoit la fixture
`scripts/flamScreensFixture.mjs` depuis le compilateur JavaScript et le pack
Rust de production. Il pilote le vrai lecteur par commandes joueur avec
les seuls services hôtes simulés. Il observe les textes, les images demandées,
les pistes audio, les lectures, le nombre de sauvegardes et les tirages.

Il couvre deux fiches avec et sans image, des consultations répétées avant
et après une consommation et un jet, une récompense répétable déjà accordée,
la reprise de la bonne piste, la réouverture et une narration interrompue
suivie d’événements audio périmés. La partie est comparée champ par champ ;
aucune nouvelle sauvegarde ni aucun tirage ne survient pendant ces allers-retours.

Les interactions d’éditeur couvrent création, contenu, lien, menu principal,
image, annulation/rétablissement, diagnostic localisé et réouverture d’un
brouillon. Le vrai glissement refuse les destinations mélangeant récit et
consultation. La sauvegarde sur disque temporaire confirme la relativisation
et la résolution des images après déplacement, ainsi que les placements.

## Limites du lot

Les sous-menus et commandes narratives appartiennent au ticket 03 ; thèmes,
aperçus, grilles et fiches enrichies sont livrés par les tickets suivants.
Aucun parcours sur FLAM réelle n’a été exécuté pour ce lot. Le ticket 11
porte la démonstration combinée et les résultats sur appareil ; les contrôles
locaux ne prouvent pas sa qualité visuelle ni sa validation matérielle.
