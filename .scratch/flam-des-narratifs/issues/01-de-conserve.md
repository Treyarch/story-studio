Status: ready-for-human
Type: task

# Valider le dé narratif conservé après reprise

Spécification : [dé narratif](../spec.md).

Le code du prototype doit conserver le résultat du jet et sa péripétie après
revisite, retour bibliothèque et recréation du runtime. Les deux rencontres
permettent de poursuivre. Le matériel reste à vérifier après extinction.

## Comments

- Suite JavaScript complète exécutée sur l’arbre partagé : 8 711 tests réussis
  sur 8 716. Cinq échecs dans catalogueEntryModel, catalogueFormatSurface,
  check-i18n (deux cas) et i18nHomeReview. Ces surfaces ne sont pas modifiées par
  le jalon des dés ; des changements d’import FLAM sont en cours en parallèle.

- [Revue Standards et Spec](../review.md) sans constat. Harnais Lua et quatre
  tests de transfert réussis ; pack, sources embarquées et six narrations vérifiés.
- Prototype installé par relecture sur la FLAM 2.4.1, sous une troisième identité.
  Les fichiers contrôlés des autres histoires et sauvegardes sont inchangés.
  Confirmation du nombre après extinction encore attendue.

- Jalons précédents validés par l’utilisateur ; suite réalisée dans le fork.
- Contrôles au même point d’entrée Lua, hasard simulé uniquement à la frontière
  d’hôte. Aucun changement aux fichiers de l’import local travaillé séparément.
