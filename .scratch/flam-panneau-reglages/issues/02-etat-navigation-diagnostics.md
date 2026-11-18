Status: resolved
Type: task
Blocked by: 01

# Conserver l’état des onglets et ouvrir les champs signalés

## Objectif

Assurer une navigation prévisible entre Aventure et Sélection, y compris depuis
un diagnostic, selon le [contrat d’interaction](../spec.md#contrat-dinteraction).

## Travail

- Démarrer sur Aventure à chaque ouverture ou changement de projet.
- Conserver l’onglet actif et le défilement propre à chaque onglet pendant
  la session, y compris à travers la fermeture du panneau.
- Actualiser la sélection, activer ses propriétés, nommer l’onglet selon le type
  et rouvrir le panneau fermé ; conserver les replis actuels après suppression.
- Garder l’état d’interface indépendant du document, de l’historique et des
  préférences persistées au-delà de la session.
- Pour un diagnostic, ouvrir le panneau et l’onglet de la cible, sélectionner
  l’élément si nécessaire, ouvrir les groupes et focaliser le champ après rendu.
- Faire primer le défilement vers le diagnostic sur la restauration de position ;
  conserver le repli vers un groupe parent si aucun champ exact n’est trouvé.
- Préserver les modifications de champs et les affectations de médias lors
  d’une bascule, sans déplacer une opération vers un autre élément ou projet.
- Ajouter les vérifications comportementales ciblées de ces parcours.

## Acceptation

- Depuis Aventure, cliquer sur un nœud active ses propriétés ; le libellé de
  l’onglet et son contenu correspondent au dernier élément choisi.
- Sélectionner depuis la liste ou le graphe rouvre Réglages fermé sur son
  onglet de propriétés. Aucune règle de sélection du graphe n’est modifiée.
- Chaque onglet retrouve son défilement après bascule et fermeture/réouverture.
- Un diagnostic global ou local atteint son champ depuis chacun des onglets,
  y compris panneau fermé ou groupe cible replié.
- Revenir à un projet commence sur Aventure ; aucune bascule ne rend l’aventure
  modifiée et aucune opération annuler/rétablir n’est ajoutée pour un onglet.
- Créer, supprimer puis annuler/rétablir conserve les comportements métier
  actuels et affiche correctement le cas sans élément disponible.

## Vérification

S’appuyer sur les harnais d’état et d’interaction existants. Prouver focus,
défilement et cycle de vie par des interactions rendues si nécessaire, plutôt
que par la seule présence de fonctions dans le code. Consigner les résultats.

## Comments

Révision demandée par l’auteur après réalisation : la sélection ordinaire active
désormais automatiquement les propriétés. L’onglet porte le type du nœud ;
un diagnostic global conserve sa navigation vers Aventure.

## Answer

L’état vit dans l’atelier, indépendant du document et de l’historique. Les
contenus restent montés pendant les bascules ; les défilements sont conservés
par onglet et restaurés après réouverture du panneau. L’atelier déjà indexé
par projectEpoch réinitialise la session au changement de projet.
Les diagnostics choisissent leur onglet avant l’ouverture des groupes, le
défilement et le focus. Les tests montés couvrent le clavier, la fermeture,
le changement de projet et la priorité du défilement vers une correction.
Voir le [bilan de validation](../validation.md).
