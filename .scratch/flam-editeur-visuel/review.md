# Revue et validation du document FLAM

Portée : ticket 01, « Définir et sauvegarder le document d’aventure FLAM ».
Référence de départ : `fd65962220f69b9fe78c70d0fca7ee4f0482263c`.
Deux revues indépendantes ont été réalisées sur les modifications préparées
avant commit. Les tickets 02 à 05 restent hors de cette réalisation.

## Standards

Une violation mineure relevée : les deux listes anglaises nouvelles ne
respectaient pas la virgule finale prescrite par `TRANSLATING.md`.
Correction appliquée. La seconde passe de traduction confirme le sens et
le contexte des sept clés nouvelles ou actualisées en anglais et en italien.

Une heuristique de duplication relevée : la liste des collections était
recopiée entre validation structurelle et diagnostics. Elle est désormais
partagée dans le module de document.

## Spec

Zéro écart confirmé. Structure stricte et versions inconnues, diagnostics de
brouillon, références stables et suppression protégée, identités distinctes,
historique, sauvegarde, médias et reprise de session sont couverts.
L’écran minimal d’ouverture et les garde-fous empêchent les commandes
incompatibles ; ils ne livrent pas l’éditeur visuel ni l’export jouable.

## Contrôles

- Boucles rouge puis vert au module de document et aux codecs réels, comme
  prévu par le ticket. Six tests FLAM passent, dont le vrai store sous double
  exécution stricte et un parcours de sauvegarde sur disque temporaire réel.
- Vingt-six tests ciblés passent après adaptation des anciennes attentes
  d’internationalisation et de version future au nouveau schéma 5.
- Suite complète : `node --test --test-concurrency=4 scripts/*.test.mjs` ;
  8 723 tests, 8 722 réussis, un échec préexistant.
- Cet échec est `scripts/i18nHomeReview.test.mjs:34` : le test attend seulement
  création/nettoyage de session, mais observe aussi deux `plugin:log|log`.
  Reproduit à l’identique sur les sources du commit de départ extraites dans
  un dossier temporaire, avec les mêmes dépendances. Le test n’est pas modifié
  dans ce lot. Le premier passage global à concurrence par défaut avait aussi
  un échec transitoire de fichier `i18nHome.test.mjs`, absent en relance ciblée
  et lors du passage global limité à quatre fichiers simultanés.
- `npm run lint`, `npm run check:i18n`, `npm run check:blank-lines`,
  `npm run build` et `git diff --check` réussissent. Le dépôt JavaScript ne
  définit pas de commande de vérification TypeScript. Le build avertit sur
  la taille de certains chunks, sans erreur de compilation.

Un exemple `.mbah` est généré localement sous
`exports/flam-editeur-visuel/les-compagnons.mbah` et relu par le codec de
production. Il sert à ouvrir et conserver le document, sans génération FLAM.

Aucun code Rust ni prototype Lua n’est modifié. Aucune validation sur appareil
n’est revendiquée pour ce lot ; elle reste au ticket 05.

Bilan : Standards, une violation corrigée et une heuristique traitée ; Spec,
zéro écart confirmé. Aucun point bloquant de revue ne reste ouvert.
