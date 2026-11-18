# Séparer les réglages de l’aventure et de la sélection FLAM

État : conception validée par l’auteur le 18 novembre 2026 ; réalisation terminée.
Les preuves et limites sont consignées dans le [bilan de validation](validation.md).
Dépôt de référence : `Treyarch/story-studio`. Suivi local, sans publication GitHub.

## Références et priorité

Cette spécification traduit la [conception validée](../../docs/flam-panneau-reglages-conception.md)
en critères de réalisation. Le [glossaire](../../GLOSSARY.md) distingue les
scènes narratives des écrans de consultation. Les deux restent éditables dans
le graphe, conformément à l’[ADR 0002](../../docs/adr/0002-parcours-consultation-graphe-flam.md).

Le [guide des écrans](../../docs/flam-ecrans-guide.md) décrit les parcours
d’édition. Pour le panneau Réglages, sélectionner rouvre le panneau et active
automatiquement l’onglet des propriétés de sa cible. Le fonctionnement de
l’aperçu n’est pas modifié.

## Problème et résultat attendu

Le panneau Réglages juxtapose aujourd’hui des champs qui modifient toute
l’aventure et d’autres qui modifient uniquement l’élément sélectionné. L’auteur
doit pouvoir identifier immédiatement cette portée et passer volontairement
de l’une à l’autre dans le même panneau.

Deux onglets **Aventure** et **Sélection** sont placés dans la barre de titre
du panneau Réglages FLAM. L’onglet Sélection est nommé selon le type de
l’élément sélectionné (Scène, Menu, Fiche, Grille, Fiche personnage, Classe,
Objet, Événement, Récompense, Jet de dé ou Choix). Sans élément disponible,
son libellé reste Sélection. Aucun changement de comportement ou de commande
n’est demandé au graphe, à la liste des éléments ni aux autres panneaux.

## Répartition du contenu

| Contenu existant | Destination |
| --- | --- |
| Titre de l’aventure | Aventure |
| Scène de départ | Aventure |
| Choix du menu principal | Aventure |
| Couleurs générales de l’aventure | Aventure |
| Présentation de l’aventure des anciens projets | Aventure, avec sa condition actuelle de visibilité |
| Tous les diagnostics | Aventure, section « Problèmes de l’aventure » |
| Nom de la catégorie et commandes d’ajout | Sélection, au-dessus des propriétés |
| Type et nom de l’élément sélectionné | Sélection |
| Propriétés, contenus, médias et liens de l’élément | Sélection |
| Couleurs propres à une scène ou un écran | Sélection |
| Suppression de l’élément | Sélection |

Chaque champ d’édition a un seul emplacement, selon l’entité qu’il modifie.
Choisir le menu principal et éditer le contenu de ce menu sont deux opérations
distinctes, dans Aventure puis Sélection. Les avertissements déjà propres à
un champ, notamment la cohérence texte/audio, restent utiles dans ce champ.

La répartition couvre toutes les catégories actuelles : écrans de consultation,
scènes, classes, objets, événements, récompenses, jets de dé et choix. Conserver
les capacités et restrictions actuelles des commandes d’ajout pour chaque
catégorie ; ne pas inventer de nouveaux boutons ni déplacer les commandes
vers le graphe. Les formulaires des scènes anciennes restent accessibles.

## Contrat d’interaction

### Onglets et cycle de vie

- Chaque ouverture d’un projet commence sur Aventure. Le passage à un autre
  projet ou la réouverture réinitialise cet état de session.
- Pendant la session, une bascule volontaire conserve la sélection et la
  position de défilement propre à chaque onglet.
- Fermer puis rouvrir le panneau conserve son onglet et ses défilements.
- Changer de sélection, y compris depuis la liste, active automatiquement
  les propriétés et actualise le libellé de leur onglet selon le type du nœud.
  Un panneau fermé est rouvert.
- Les chemins existants de création et de sélection restent inchangés : une
  création depuis Sélection permet de régler l’élément sélectionné selon le
  comportement existant. Elle ne déplace aucune commande du graphe.
- Après suppression ou changement de catégorie, conserver les règles actuelles
  de sélection de remplacement. Ne pas introduire de désélection au clic sur
  le fond du graphe.
- Si aucun élément n’est disponible dans la catégorie, Sélection reste
  accessible avec « Aucun élément sélectionné » et les commandes d’ajout
  existantes, sans formulaire vide ni commande visant un élément absent.
- L’état des onglets appartient à l’interface pendant la session. Il ne modifie
  ni le document de l’aventure, ni son état sauvegardé, ni son historique.

### Correction des problèmes

La section Problèmes de l’aventure rassemble les diagnostics existants sans
changer leurs règles, leur sévérité ou leur effet sur la génération.

Cliquer sur un diagnostic est une demande explicite de correction :

1. Rouvrir le panneau si nécessaire.
2. Activer Aventure pour un champ global ou Sélection pour une propriété
   d’élément ; dans ce dernier cas, sélectionner l’élément concerné.
3. Attendre que le contenu cible soit disponible, ouvrir ses groupes repliés,
   puis faire défiler et focaliser le champ.

Cette navigation prime sur la restauration habituelle du défilement de
l’onglet cible. Un diagnostic global active Aventure et doit fonctionner même si le
panneau était fermé. Conserver le repli de localisation existant vers un groupe
parent lorsqu’aucun champ exact ne correspond au chemin du diagnostic.

### Intégration dans l’en-tête

Les onglets doivent être identifiables, utilisables au clavier et exposer
leur état actif aux technologies d’assistance. Un onglet masqué ne laisse pas
ses champs dans le parcours clavier. Les libellés suivent l’internationalisation
existante.

Conserver la fermeture, le redimensionnement et le déplacement du panneau.
Un clic sur un onglet ne commence pas un déplacement. Vérifier l’en-tête à
la largeur minimale actuelle de 200 px et à la largeur habituelle de 800 px :
les deux onglets et la fermeture restent accessibles. Les adaptations de code
partagé nécessaires restent compatibles avec les autres modes, sans en changer
l’interface ni les interactions.

## Points de raccord à examiner

- `src/components/FlamWorkspace/FlamWorkspace.jsx` : rendu de l’inspecteur,
  sélection, création, diagnostics et localisation des champs.
- `src/components/FlamWorkspace/FlamWorkspace.css` : présentation propre au panneau.
- `src/workspace/GraphWorkspacePanels.jsx` : emplacement des commandes de
  l’en-tête et interaction avec sa poignée ; réutiliser les possibilités
  existantes avant d’étendre le composant partagé.
- `src/workspace/useAdvancedWorkspaceViewState.js` : conventions de visibilité
  et de préférences ; ne pas y persister le nouvel état au-delà de la session.
- `src/locales/` : libellés et vérification des traductions.

Ces repères ne prescrivent pas un découpage interne. Une simple réorganisation
visuelle ne doit pas réinitialiser les données en cours d’édition, perdre un
résultat média asynchrone ou appliquer une modification à une autre sélection.

## Validation attendue

Les tests doivent vérifier les comportements observables, notamment :

- séparation des champs, boutons d’ajout et diagnostics, sans doublon de formulaire ;
- sélection depuis Aventure : ouverture automatique des propriétés sur la bonne
  cible et libellé correspondant au type, avec repli Sélection en catégorie vide ;
- fermeture/réouverture et défilements indépendants, y compris après une correction ;
- diagnostics globaux et locaux depuis les deux onglets, panneau ouvert ou fermé,
  avec champ initialement dans un groupe replié ;
- création, suppression du dernier élément d’une catégorie, annuler/rétablir,
  et absence de mutation de l’aventure lors d’une simple bascule ;
- changement de projet et réinitialisation sur Aventure ;
- compatibilité des anciens projets, des médias et des autres modes.

S’appuyer sur les harnais existants : `scripts/flamWorkspacePanels.test.mjs`,
`scripts/flamWorkspaceViewState.test.mjs` et `scripts/flamEditorInteraction.test.mjs`.
Compléter avec des interactions rendues si les assertions existantes ne prouvent
pas le défilement, le focus ou le cycle de vie. Les contrôles de structure seuls
ne prouvent pas ces comportements.

Vérifier aussi les onglets au clavier, la largeur minimale, la fermeture et
la poignée de déplacement. Consigner les commandes exécutées, leurs résultats
et les éventuels cas restant à vérifier dans `validation.md`. Ce lot d’interface
n’appelle pas de validation sur appareil FLAM.

## Tickets et ordre

| Ticket | Livrable | Dépendances |
| --- | --- | --- |
| [01](issues/01-separer-contenus-onglets.md) | Onglets et répartition complète du contenu | — |
| [02](issues/02-etat-navigation-diagnostics.md) | État de session, défilement et accès aux corrections | 01 |
| [03](issues/03-validation-documentation.md) | Validation des parcours et guides réconciliés | 01, 02 |

Les trois tickets sont réalisés ; leurs dépendances décrivent l’ordre des lots.
Le bilan de validation indique les vérifications effectivement exécutées.

## Hors périmètre

Refonte du graphe ou des autres panneaux, déplacement des commandes d’ajout,
nouveaux types de nœuds, modification du modèle d’aventure, du lecteur ou du
format de sauvegarde, nouveau système de diagnostics, modification des modes
Libre et Avancé, publication GitHub.
