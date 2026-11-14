Status: resolved

# Valider un dé narratif et la conservation de son résultat sur FLAM

## Objectif

Résultat : validation matérielle confirmée par l’utilisateur après le parcours
de conservation du nombre et de la rencontre après extinction sur sa FLAM 2.4.1.

Prochain jalon du cadrage validé : un jet de un à vingt déclenché par l’enfant,
qui choisit une péripétie permettant toujours de poursuivre. Aucun score,
bonus, seuil de réussite ni échec. Le résultat déjà obtenu doit être conservé
à la revisite, au retour bibliothèque et après extinction.

## Parcours

Le prototype « Le dé des lucioles » conserve le coffre et la porte du jalon
précédent. Après le passage, l’enfant lance son dé. Les valeurs un à dix
appellent les lucioles ; onze à vingt, un renard. Les deux rencontres mènent
au village. Le résultat numérique est visible et sauvegardé avant présentation.
Recommencer explicitement ouvre une nouvelle partie où un nouveau jet est possible.

## Décisions de réalisation

- Nouvelle identité d’aventure et sauvegarde de version deux : préserver les
  prototypes matériels déjà validés, sans migration implicite de leurs parties.
- Tirage pseudoaléatoire natif Lua ; aucune promesse de sécurité, d’entropie ou
  de résultat différent à chaque nouvelle partie. Deux jets peuvent être égaux.
- Un tirage proposé n’est pas affiché avant confirmation du stockage. Une
  nouvelle tentative d’écriture conserve le même candidat ; une écriture
  incertaine impose la réconciliation déjà validée au jalon précédent.
- Le résultat sauvegardé ne relance pas le générateur aléatoire lors d’une reprise.
- Les commandes, Audio B, coffre unique et consommation restent fonctionnels.

## Vérification

Même point d’entrée convenu : aventure complète dans le harnais Lua, avec hasard
fourni par l’hôte de test. Couvrir les résultats un, dix, onze et vingt, les deux
péripéties, les clics doublés et le refus d’écriture avant affichage. Interdire
tout nouveau tirage après sauvegarde lors des reprises du même module et d’une
nouvelle instance. Préserver les tests de transfert et les contrôles audio.

Validation physique obligatoire : obtenir un nombre, le noter, revisiter puis
éteindre complètement, rallumer et retrouver exactement ce nombre et la même
rencontre. Le ticket ne sera résolu qu’après cette confirmation utilisateur.

## Périmètre

Pas de classes, d’éditeur visuel, d’animations de dé ou de refonte de stockage.
Travail sur la branche suivie du fork Treyarch/story-studio ; aucun push vers
le dépôt amont et aucune publication de ticket GitHub.
