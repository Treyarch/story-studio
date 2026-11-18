# Écrans FLAM personnalisables — cadrage confirmé

Ce document consigne les décisions de l’entretien à partir des onze photos
de l’aventure Donjons & Dragons fournies le 16 novembre 2026. Il décrit
le résultat recherché. Les décisions ci-dessous et leur synthèse d’ensemble
ont été confirmées par l’auteur le 16 novembre 2026. L’entretien de conception
est terminé. La [spécification de réalisation](../.scratch/flam-ecrans-personnalisables/spec.md)
décline ce cadrage en récits utilisateur, décisions et vérifications attendues.

## Décisions confirmées

- Chaque écran, scènes comprises, pourra avoir un fond choisi par l’auteur.
  Cette couleur sera également visible dans son aperçu dans le graphe.
- Les parcours de consultation seront construits dans le graphe selon
  l’[ADR 0002](adr/0002-parcours-consultation-graphe-flam.md).
- Les classes restent narratives et sans statistiques chiffrées. La fiche
  personnage pourra présenter des illustrations et des informations conditionnelles.

## Gabarits et contenu

La première version propose cinq gabarits configurables : Scène, Menu,
Grille, Fiche et Fiche personnage. Le placement libre des éléments d’écran
est réservé à une extension ultérieure.

Une grille contient quatre cases par page, disposées en 2 × 2, avec accès
aux pages supplémentaires. Elle est alimentée soit par l’inventaire,
soit par des entrées définies par l’auteur et éventuellement conditionnelles.
Une clé consommée disparaît de l’inventaire ; sa découverte peut rester
consultable dans les souvenirs si l’auteur utilise une condition de découverte.

Un menu peut mêler liens de consultation et commandes narratives, explicitement
distingués dans l’édition. Consulter une fiche conserve la scène en cours ;
choisir une destination narrative poursuit l’aventure.

Une commande narrative de menu peut porter les mêmes conditions et effets
qu’un choix de scène. Par exemple, Entrer dans la tour peut demander une clé,
la consommer et mener à une scène. Un lien de consultation reste sans effet.

## Apparence

Un thème commun définit les couleurs de fond, de texte et de sélection.
L’auteur peut remplacer ces couleurs écran par écran.

## Fiches et illustrations

Un objet est défini une seule fois : nom, image, description et audio.
La fiche d’objet réutilise ces données. Le graphe représente une grille
d’inventaire et sa fiche type ; les objets détenus déterminent les fiches
accessibles en partie, sans lien à dessiner pour chaque objet potentiellement
acquis. Les fiches de souvenirs peuvent utiliser des contenus définis par l’auteur.

- Menu et scène : liste de choix avec illustration commune, ou illustration
  changeant avec le choix sélectionné.
- Grille : image et libellé par case, avec sélection mise en évidence.
- Fiche : grande image à gauche et texte à droite, ou image occupant tout
  l’espace de contenu pour une page de carnet.
- Fiche personnage : portrait et informations textuelles, éventuellement conditionnelles.

Titre, images et audio sont facultatifs selon le contenu.

## Navigation et audio

L’auteur désigne un menu principal accessible avec Retour pendant le récit.
Il peut créer d’autres menus reliés entre eux. Depuis une fiche, Retour remonte
vers la grille puis son menu selon le chemin réellement parcouru, y compris
quand plusieurs parcours donnent accès à la même fiche. Reprendre retrouve
toujours la scène narrative conservée.

Ouvrir le menu interrompt la narration ; Reprendre relance la scène au début.
L’audio d’une fiche se lance uniquement par Écouter la description et s’arrête
en quittant la fiche. La reprise à la seconde exacte est hors périmètre.

Les listes et les textes longs des fiches défilent ; les grilles sont paginées
par quatre. Un inventaire vide présente un message explicite. L’auteur choisit
si une entrée conditionnelle indisponible est masquée ou visible comme verrouillée :
dans ce dernier cas, elle est visible mais sa destination reste inaccessible.

## Édition du graphe

Un même graphe représente le récit et les écrans de consultation. Les liens de
consultation et les liens narratifs sont visuellement distincts. Les filtres
Tout, Récit et Consultation permettent de limiter les éléments affichés.
Une fiche partagée reste un seul nœud, même si plusieurs menus y donnent accès.
Le rangement automatique se lit de gauche à droite.

L’éditeur montre un aperçu de l’écran sélectionné avec ses réglages de présentation.

## Anciennes aventures

Les anciennes aventures FLAM seront supprimées : leur compatibilité et leur
conversion sont hors périmètre. Les nouvelles aventures utilisent directement
le nouveau modèle. Cette décision concerne le chantier FLAM.

## Fidélité et validation

La cible est de reproduire les compositions et les interactions des photos
avec les médias propres à l’auteur. La reproduction exacte des polices
et illustrations officielles n’est pas demandée.

Une aventure de démonstration permettra de vérifier le résultat sur FLAM réelle :

- menu illustré mêlant consultation et commandes narratives ;
- illustration changeant avec le choix sélectionné ;
- inventaire de plus de quatre objets, avec pagination et ouverture de fiche ;
- fiche avec description audio déclenchée explicitement ;
- carnet dont l’image occupe tout l’espace de contenu ;
- fiche personnage illustrée et informations conditionnelles ;
- scènes présentant des couleurs de fond différentes.

Les parcours vérifieront aussi les retours vers une fiche partagée et vers le récit,
la reprise de narration au début de la scène, les contenus longs, l’inventaire vide,
les entrées verrouillées et la distinction entre consultation sans effet et commande
narrative portant conditions et effets.

## État de la réalisation

Ce cadrage étend l’[interface d’aventure actuelle](flam-interface-aventure.md).
Il nécessite des évolutions de l’éditeur, du document d’aventure et de sa validation,
ainsi que des gabarits du lecteur FLAM. Le présent entretien modifie uniquement
la documentation ; aucun de ces nouveaux comportements n’est encore réalisé.
