Status: resolved
Type: task
Blocked by: 01, 02

# Valider les parcours du panneau Réglages et mettre les guides à jour

## Objectif

Vérifier le résultat complet et réconcilier la documentation avec la
[spécification validée](../spec.md), sans élargir la refonte.

## Travail

- Exécuter les scénarios de validation de la spécification sur une aventure
  comprenant plusieurs catégories, ainsi que sur un ancien projet FLAM.
- Vérifier ouverture de projet, bascules, sélection, ajout, suppression,
  annuler/rétablir, champs médias et navigation depuis les diagnostics.
- Contrôler la conservation du défilement et la priorité du focus de correction.
- Vérifier le clavier, les groupes repliés, la largeur de 200 et 800 px,
  le redimensionnement, la fermeture et le déplacement du panneau.
- Vérifier l’absence de changement du graphe, de la liste et des autres modes,
  en particulier si un composant d’en-tête partagé a été adapté.
- Exécuter les tests FLAM concernés, les vérifications de traduction et la
  construction frontend appropriée. Corriger les régressions imputables au lot.
- Mettre à jour les passages des guides FLAM qui situent les réglages ou
  décrivent la sélection comme imposant l’ouverture de ses champs ; conserver
  intact le contrat de l’aperçu et le fonctionnement du lecteur FLAM.
- Renseigner `../validation.md` avec commandes, résultats et limites réelles,
  puis actualiser l’état de réalisation dans la spécification.

## Acceptation

- Tous les scénarios prioritaires de la spécification ont une preuve consignée.
- Les anciens projets conservent leurs réglages ; aucun champ ou bouton
  d’édition n’a été perdu lors de la séparation.
- Les guides expliquent Aventure et Sélection, la conservation de l’onglet
  lors d’une bascule manuelle, l’activation automatique des propriétés à la
  sélection et la navigation des diagnostics.
- Les vérifications échouées ou non exécutées sont explicitement indiquées ;
  aucun résultat simulé n’est présenté comme une validation visuelle.
- Aucun essai sur appareil, changement de lecteur ou publication GitHub
  n’est requis pour conclure ce lot d’interface.

## Comments

Les tests nécessaires aux lots 01 et 02 sont livrés avec ces lots. Ce ticket
assure la vérification intégrée et la documentation, pas le report de leur qualité.

## Answer

Les guides des écrans et de l’ancienne présentation décrivent désormais
les deux onglets et la navigation vers les corrections.
Les contrôles de comportement, de géométrie Chromium, de traduction, de lint
et de construction sont consignés dans le [bilan](../validation.md), avec
leurs limites. Aucun changement du lecteur ni essai sur appareil n’est requis.
