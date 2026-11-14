# Document d’aventure FLAM

Le [premier lot](../../../.scratch/flam-editeur-visuel/issues/01-document-aventure.md)
fournit le document et son raccord au cycle de projet ; il ne génère pas encore
d’aventure jouable. L’[ADR](../../../docs/adr/0001-document-aventure-flam.md)
explique le mode de projet distinct.

## Interface

- `createAdventureDocument({ title })` crée un brouillon vide, une identité
  d’aventure neuve et une compatibilité de partie initiale `saveVersion: 1`.
- `assertAdventureDocument(document)` vérifie strictement la forme, la version,
  les types de règles et l’unicité globale des identifiants. Il lève une
  `AdventureDocumentError` portant `code` et `path`. Il n’invente aucun champ.
- `diagnoseAdventureDocument(document)` retourne des diagnostics de contenu
  `{ code, path, severity, params }`. Les chemins sont des pointeurs JSON dans
  le document. Une structure invalide lève ; une référence manquante, quantité
  invalide ou plage de dé incorrecte produit un diagnostic `error`.
- `editAdventureDefinition(document, { collection, id, patch })` ajoute ou
  modifie une définition par ses champs ; `patch: null` la supprime si aucune
  référence ne subsiste. Les champs `name`, `title` ou `label` sont renommables,
  l’identifiant ne l’est pas. Une définition ajoutée doit porter tous ses champs.
- `replaceAdventureDocument(previous, next)` vérifie la structure et refuse
  un changement d’identité, de compatibilité de partie ou une suppression
  encore référencée. Il retourne un clone et ne modifie aucun argument.
- `createFlamProject({ document, projectName, storage })` enveloppe le document
  dans un projet `.mbah`. Sans argument, il crée un brouillon et son stockage.
- `withFlamDocument(project, document)` produit un projet modifié via les mêmes
  règles. L’appelant l’installe par `store.setProject` pour bénéficier de
  l’historique ordinaire, sans créer de seconde pile d’annulation.

## Représentation

Le document porte `version`, `id`, `saveVersion`, `title`, `startSceneId` et les
collections `scenes`, `choices`, `classes`, `items`, `events`, `rewards`, `rolls`.
La [fixture originale](../../../scripts/fixtures/flam-adventure.json) illustre
les deux classes, la clé consommable, la porte mémorisée, une récompense unique
et les vingt issues possibles du dé réparties entre deux fins.

Les choix sont référencés par les scènes. Ils mènent soit à une destination,
soit à un jet dont les issues portent les destinations. Les conditions sont
une conjonction ; les effets expriment `chooseClass`, `giveItem`, `consumeItem`
ou `setEvent`. Une récompense regroupe ses effets et l’option `repeatable`.
Les quantités doivent être des entiers positifs pour la génération, mais une
quantité négative ou fractionnaire reste enregistrable comme brouillon.

Les scènes portent des chemins médias `audio` et `image`, chacun nullable.
Le parcours commun des références sait les relativiser, les déplacer et les
protéger contre une suppression comme médias inutilisés. Les textes et les
identifiants ne sont pas traités comme des chemins.

Les diagnostics `CONDITIONAL_EXITS` sont des avertissements demandant un essai
de parcours. Ils ne démontrent pas une impasse, ni une absence d’impasse.
Le module n’exécute pas les règles et ne valide aucune sauvegarde d’appareil.

## Vérifications

```sh
node --test scripts/flamAdventure.test.mjs scripts/flamAdventurePersistence.test.mjs
```

Ces tests passent par le module, les codecs réels, le store sous double
exécution stricte et les fonctions de sauvegarde sur disque temporaire réel.
Seuls React, les dialogues et le transport de fichiers Tauri sont simulés.
