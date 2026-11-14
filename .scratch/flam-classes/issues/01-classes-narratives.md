Status: resolved
Type: task

# Valider deux classes narratives conservées après reprise

Spécification : [classes narratives](../spec.md).

## Critères d’acceptation

- Choisir Pisteur ou Ami des animaux au départ, avec narration explicative.
- Consulter sa classe dans l’inventaire et la retrouver après reprise.
- Ouvrir un choix propre à sa classe ; expliquer et désactiver l’autre.
- Atteindre le dé et la fin avec chacune, sans impasse involontaire.
- Sauvegarder le choix avant sa conséquence et signaler tout refus.
- Recommencer explicitement permet de changer de classe.
- Préserver les prototypes précédents, leurs sauvegardes et les autres histoires.

## Comments

- Étape suivante demandée par l’utilisateur après validation matérielle du dé.
- Deux classes et un sentier conditionnel réalisés dans le prototype natif.
  Le harnais Lua couvre chaque classe, les reprises, refus et classes invalides ;
  les contrôles des jalons précédents restent présents.
- La clôture était conditionnée à la confirmation utilisateur après extinction réelle.

- Pack installé et relu sur la FLAM `2.4.1-d5186dc0` sous une quatrième identité.
  Taille et date des 3 451 fichiers existants hors liste/cache inchangées ;
  contenu de 2 862 petits fichiers, scripts et métadonnées identique.
  La liste et le cache sont sauvegardés localement par l’installateur.
- [Bilan de vérification](../validation.md). Validation humaine demandée selon
  le [parcours matériel](../../../scripts/prototypes/flam-native/README.md).

- Validation utilisateur après le parcours matériel demandé : « ca marche tres
  bien, parfait ». Le jalon est résolu sur la FLAM 2.4.1 testée.

## Answer

Choix de classe, possibilités narratives propres à Pisteur et Ami des animaux,
reprise après extinction et nouveau départ validés par l’utilisateur sur sa
FLAM. L’éditeur visuel reste le jalon suivant.
