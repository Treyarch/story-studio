# Séparation des réglages de l’aventure et de la sélection FLAM

Conception et synthèse validées par l’auteur le 18 novembre 2026.
La [spécification et les tickets locaux](../.scratch/flam-panneau-reglages/spec.md)
décrivent la réalisation attendue.

Le comportement de sélection et le libellé du second onglet sont révisés à la
demande de l’auteur après la première réalisation.

## Décisions confirmées

- Le périmètre est l’éditeur FLAM uniquement.
- Le panneau distingue les réglages généraux de l’aventure des propriétés de
  l’élément sélectionné, avec deux onglets dans sa barre de titre :
  **Aventure** et un onglet de propriétés nommé selon le type sélectionné
  (**Scène**, **Menu**, **Objet**, etc.), ou **Sélection** sans élément disponible.
- Sélectionner un élément dans le graphe ou la liste active automatiquement
  l’onglet de propriétés et actualise son libellé avec le type de l’élément.
- Le contenu de **Sélection** indique le type et le nom de l’élément concerné.
- **Aventure** contient le titre de l’aventure, la scène de départ, le choix
  du menu principal et les couleurs générales. **Sélection** contient les
  propriétés, couleurs propres, médias, liens et suppression de l’élément.
  Un champ n’apparaît que dans l’onglet correspondant à ce qu’il modifie.
- La refonte se limite au panneau **Réglages** actuel. Les commandes d’ajout
  restent dans ce panneau ; le graphe et les autres panneaux ne sont pas modifiés.
- Les diagnostics sont regroupés dans une section **Problèmes de l’aventure**
  de l’onglet **Aventure**. Cliquer sur un diagnostic ouvre l’onglet de sa
  cible et le champ à corriger, y compris Aventure pour un problème global.
- Les commandes d’ajout restent dans **Sélection**, au-dessus des propriétés,
  avec le nom de leur catégorie (écrans de consultation, scènes, etc.).
- Cliquer sur un élément rouvre le panneau fermé sur ses propriétés.
  La sélection est conservée entre les onglets. Après suppression, le repli
  actuel vers un autre élément disponible est conservé.
- Chaque ouverture de projet commence sur **Aventure**. Pendant la session,
  le panneau conserve l’onglet actif et le défilement propre à chaque onglet,
  y compris lorsqu’il est fermé puis rouvert. Cet état d’interface n’est pas
  enregistré dans le document de l’aventure.
- Si aucun élément n’est disponible dans la catégorie courante, **Sélection**
  reste accessible et affiche **Aucun élément sélectionné**, avec les commandes
  d’ajout et sans formulaire vide. Les règles actuelles de sélection et le
  comportement du graphe sont conservés.

## Validation

Tous les points de l’entretien sont résolus et la synthèse est validée.
La mise en œuvre est réalisée. Le [bilan de vérification](../.scratch/flam-panneau-reglages/validation.md)
distingue les tests de comportement, le contrôle de géométrie dans Chromium
et les limites de la validation.

## Références

- [Guide des écrans](flam-ecrans-guide.md) : sélection, propriétés et réglages
  généraux dans le panneau FLAM.
- [Parcours de consultation dans le graphe](adr/0002-parcours-consultation-graphe-flam.md) :
  les écrans de consultation sont des éléments du graphe, avec leurs propriétés.
