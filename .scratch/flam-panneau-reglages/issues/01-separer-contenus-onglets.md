Status: resolved
Type: task
Blocked by: —

# Séparer le contenu de Réglages FLAM en deux onglets

## Objectif

Distinguer les réglages de l’aventure de ceux de la sélection, dans le panneau
existant, selon la [spécification](../spec.md).

## Travail

- Ajouter Aventure et Sélection dans la barre de titre du panneau Réglages FLAM.
- Appliquer toute la table de répartition de la spécification, sans supprimer
  les réglages de présentation des anciens projets ni leurs conditions d’affichage.
- Garder les commandes d’ajout et le nom de catégorie dans Sélection, avant
  le type, le nom et les propriétés de l’élément ; conserver les restrictions
  actuelles de chaque catégorie.
- Afficher « Aucun élément sélectionné » lorsque la catégorie est vide, avec
  ses commandes existantes et sans formulaire visant un élément absent.
- Regrouper les diagnostics dans Problèmes de l’aventure, dans Aventure.
- Préserver fermeture, largeur et déplacement du panneau ; empêcher qu’un
  clic sur un onglet amorce un déplacement.
- Fournir la sémantique d’onglets, l’accès clavier et les traductions selon
  les conventions du dépôt. Isoler les champs masqués du parcours clavier.
- Couvrir la répartition et les catégories avec les vérifications pertinentes
  du harnais de panneaux existant.

## Acceptation

- Titre d’aventure, départ, menu principal et couleurs générales sont uniquement
  dans Aventure ; propriétés et suppression de l’élément sont dans Sélection.
- Choisir le menu principal et modifier son contenu ont des emplacements distincts.
- Toutes les catégories actuelles et les anciens formulaires restent éditables.
- Les commandes d’ajout restent dans Réglages et le graphe est inchangé.
- Les deux onglets et la fermeture sont accessibles à 200 et 800 px de largeur.
- Les autres panneaux et modes conservent leur interface et leurs commandes.

## Vérification

Compléter le harnais de panneaux pour les comportements de ce lot et consigner
les commandes exécutées. Vérifier les traductions et la navigation clavier.
L’état de session et la navigation vers les diagnostics sont achevés au ticket 02.

## Comments

Conception validée par l’auteur le 18 novembre 2026.

## Answer

Les onglets sont ajoutés dans l’en-tête existant, sans modification du composant
partagé. Les champs globaux et les diagnostics sont dans Aventure ; les commandes
d’ajout, l’identité et les formulaires sont dans Sélection. Le cas vide, les
anciens projets et les traductions FR/EN/IT sont conservés. La géométrie de
l’en-tête est vérifiée dans Chromium à 200 et 800 px.
Voir le [bilan de validation](../validation.md).
