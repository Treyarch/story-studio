# Validation du ticket 03 — Sous-menus et menus mixtes

Réalisation et contrôles locaux du 16 novembre 2026, dans le prolongement du
[ticket 02](validation-02.md). Aucun parcours sur appareil n’est revendiqué ;
la validation matérielle combinée reste au ticket 11.

## Résultat livré

Un Menu peut ouvrir un autre Menu ou une Fiche. Plusieurs accès conservent
un seul nœud de fiche partagé. Retour remonte le chemin réellement emprunté,
y compris Menu principal → A → B → Fiche ou Menu principal → B → Fiche.
La sélection du sous-menu est retrouvée au retour. La scène narrative à
reprendre reste indépendante de cette pile de navigation, conservée en mémoire.
Les longues listes utilisent le défilement existant du lecteur.

« Ajouter une commande narrative » dans l’inspecteur crée un choix et son
rattachement au menu de façon atomique pour l’historique. L’auteur configure
le formulaire existant des choix : conditions, effets, récompense, scène ou
jet de destination, comportement indisponible. Le graphe projette ces liens
narratifs avec leurs prises propres, tandis que les accès de consultation
restent pointillés. Une destination narrative peut être rebranchée sans
perdre les règles. Les suppressions préservent les choix encore partagés.

Le document conserve la collection `choices` comme source unique de règles.
Les entrées de consultation portent `id`, `label`, `screenId` (et peuvent
préciser `type: "consultation"`). Les commandes portent `id`,
`type: "narrative"`, `choiceId`. Les validations JavaScript et Rust refusent
les références absentes et les mélanges de champs entre ces contrats.
Tous ces contenus passent par le même projet, historique et codec.

Le moteur Lua commun vérifie l’appartenance du choix à sa scène ou au lien
de menu qui l’invoque, puis prépare ses effets et récompenses sur une copie.
Une condition refusée ou un effet impossible ne laisse aucune modification
partielle. Une commande valide sauvegarde et confirme sa transaction avant
de poursuivre le récit ; une nouvelle tentative après échec de sauvegarde
réévalue cette même commande dans son contexte de menu. Consultation et
Reprendre n’exécutent aucune transition narrative.

## Vérifications

- Suite `node --test scripts/flam*.test.mjs` : 57 tests réussis, puis ajout
  du parcours de prises des menus mixtes et exécution des 10 tests de
  `scripts/flamGraphLinks.test.mjs`, tous réussis : 58 tests FLAM au total.
- `cargo test --manifest-path src-tauri/Cargo.toml services::flam_pack::tests --lib` :
  13 tests réussis, y compris le pack de menus mixtes et ses données natives.
- `npm run build` : réussi, avec l’avertissement de taille de bundles existant.
- ESLint ciblé des modules FLAM et des tests modifiés : réussi.
- `npm run check:i18n` : zéro erreur, zéro avertissement.

Le même harnais `scripts/check-flam-presentation.lua` utilise
`mixedMenusFixture` depuis les données compilées JavaScript et le pack de
production généré, validé et extrait par Rust. Seuls les services hôtes sont
simulés ; les commandes joueur exécutent le vrai lecteur et ses vraies règles.
Le parcours vérifie :

- un départ narratif depuis le menu avant toute partie sauvegardée ;
- une entrée au-delà des trois lignes visibles ;
- deux sous-menus et la même fiche ouverte par trois chemins ;
- le retour par chaque chemin et la reprise de la scène conservée ;
- une commande cachée, une condition refusée et une transaction impossible
  qui accorderait un jeton avant de demander deux clés ;
- une commande consommant une clé, avec échec de sauvegarde puis nouvelle
  tentative, sans consommation avant confirmation ni effet partiel ;
- la nouvelle scène narrative et l’événement mémorisé après exécution ;
- un jet partagé entre menu et récit, mémorisé sans nouveau tirage ;
- des consultations et reprises comparant toute la partie et le nombre de
  sauvegardes, ainsi que la réouverture du lecteur.

Les interactions réelles de formulaire couvrent création d’un sous-menu,
fiche partagée, ajout et suppression atomiques de commande, édition des
conditions et effets dans les formulaires communs, projection des deux types
de liens, annulation/rétablissement et réouverture du document. Les prises
du graphe relient les sous-menus et commandes, refusent les destinations
incompatibles et annulent un raccord si sa source est devenue périmée.

Les contrôles des tickets précédents restent réussis. Thème, aperçu, grilles,
compositions avancées et validation sur FLAM physique ne font pas partie de ce lot.
