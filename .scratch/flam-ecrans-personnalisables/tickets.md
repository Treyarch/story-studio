# Tickets de réalisation des écrans FLAM personnalisables

Découpage approuvé par l’auteur après confirmation de la
[spécification](spec.md). Le [ticket 01](issues/01-ecrans-personnalisables-graphe.md)
reste le parent et n’a pas été modifié par la publication des lots.

Chaque lot fonctionnel inclut les modifications d’édition, de document,
de persistance, de génération et de lecteur nécessaires à son comportement,
ainsi que ses tests. Les vérifications privilégient les frontières existantes :
interactions de l’éditeur et vrai lecteur Lua exécuté depuis les données compilées
et le pack produit par Rust. Le dernier ticket couvre leur combinaison et
la validation sur FLAM réelle.

| Ticket | Livraison | Bloqué par |
| --- | --- | --- |
| [02](issues/02-menu-principal-fiche.md) | Menu principal, fiche simple et retour au récit | Aucun |
| [03](issues/03-sous-menus-commandes-narratives.md) | Sous-menus, fiche partagée et commandes narratives | 02 |
| [04](issues/04-theme-apercu.md) | Thème, remplacements de couleurs et aperçu | 02 |
| [05](issues/05-grille-inventaire-fiches-objet.md) | Inventaire en grille et fiches d’objet | 02 |
| [06](issues/06-collections-souvenirs-conditionnels.md) | Collections et souvenirs conditionnels | 05 |
| [07](issues/07-illustration-selection.md) | Illustration selon le choix sélectionné | 02 |
| [08](issues/08-fiches-audio-carnet-defilement.md) | Fiches avec audio, défilement et carnet pleine image | 02 |
| [09](issues/09-fiche-personnage.md) | Fiche personnage illustrée et conditionnelle | 02 |
| [10](issues/10-filtres-rangement-graphe.md) | Filtres et rangement gauche à droite | 02 |
| [11](issues/11-demonstration-validation-flam.md) | Démonstration complète et validation sur FLAM réelle | 03, 04, 06, 07, 08, 09, 10 |

Les tickets ont été publiés au statut `ready-for-agent`. Le ticket 02 est
réalisé localement et passé à `ready-for-human` ; voir sa [validation](validation-02.md).
Le ticket 03 est également réalisé et passé à `ready-for-human` ; voir sa
[validation](validation-03.md).
Le ticket 04 est réalisé localement et passé à `ready-for-human` ; voir sa
[validation](validation-04.md).
Le ticket 05 est réalisé localement et passé à `ready-for-human` ; voir sa
[validation](validation-05.md).
Le ticket 06 est réalisé localement et passé à `ready-for-human` ; voir sa
[validation](validation-06.md).
Le ticket 07 est réalisé localement et passé à `ready-for-human` ; voir sa
[validation](validation-07.md).
Le ticket 08 est réalisé localement et passé à `ready-for-human` ; voir sa
[validation](validation-08.md).
Le ticket 09 est réalisé localement et passé à `ready-for-human` ; voir sa
[validation](validation-09.md).
Le ticket 10 est réalisé localement et passé à `ready-for-human` ; voir sa
[validation](validation-10.md). Les dépendances
déterminent ceux qui peuvent être pris en charge : la frontière initiale est
le ticket 02 ; après lui, les tickets 03, 04, 05, 07, 08, 09 et 10 peuvent avancer.
Le ticket 06 attend le ticket 05. Le ticket 11 attend les branches indiquées ;
les tickets 02 et 05 sont déjà couverts par ces dépendances transitives.

Les lots développés indépendamment doivent respecter le contrat de présentation
commun lors de leur intégration. Les modes Lunii restent hors du chantier,
et aucune conversion ou suppression automatique d’anciennes aventures FLAM
n’est demandée par ces tickets.

Le ticket 11 possède sa démonstration et son pack vérifiés localement ; voir la
[validation](validation-11.md). Il reste **non terminé**, au statut `ready-for-human`,
pour les essais sur FLAM réelle et le relevé du firmware et des résultats. Le
ticket parent 01 reste ouvert tant que cette validation matérielle manque.

Le 18 novembre 2026, le pack du ticket 11 est installé et relu sur FLAM
(firmware 2.4.1-d5186dc0). Les observations de lecture sur appareil restent
à recueillir ; le ticket 11 et son parent restent ouverts.
