# Contrôle matériel — L’atelier des lucioles

État au 18 novembre 2026 : pack installé et relu sur la FLAM. Les parcours
de lecture ci-dessous restent non exécutés.
Ne cocher un résultat qu’après observation sur l’appareil. Les résultats locaux
sont séparés dans `../validation-11.md`.

## Identifier l’essai

- Projet : `exports/flam-ecrans-personnalisables/atelier-des-lucioles/L’atelier des lucioles.mbah`.
- Aventure : `4f67c0b8-d1c9-4d51-9a46-9d290de13f11`, version de partie 1.
- Pack et empreintes : `pack.json` dans ce dossier, repris dans le compte rendu.
- Firmware effectivement lu sur FLAM : **2.4.1-d5186dc0**, le 18 novembre 2026.
- Date, modèle d’appareil et personne effectuant l’essai : **à renseigner**.
- Reçu d’installation : `/home/mathieu/.local/share/com.hugs11.story-studio/flam-installations/71d4a6e9-16ee-4944-92c1-2d1dee47c24a/installation.json`.
- Photos ou observations jointes : **à renseigner**.

Le pack est déjà installé et vérifié sur le volume FLAM le 18 novembre 2026.
Pour une installation ultérieure, utiliser Installer sur la FLAM après vérification du volume affiché.
Éjecter l’appareil avec le système avant de le débrancher et de lancer l’aventure.
Ne pas remplacer ou supprimer d’histoire existante pour ce contrôle. Si cette
identité est déjà installée, consigner le cas avant de préparer une autre identité.

## Parcours à exécuter

| Étape | Commandes | Résultat attendu | Résultat réel |
| --- | --- | --- | --- |
| 1 | Commencer ; pointer les deux talents sans valider | Illustration différente par choix ; aucun récit ou audio déclenché par la molette | Non exécuté |
| 2 | Devenir Pisteur ; écouter la cour ; Retour | Narration interrompue à Retour ; Menu principal illustré, fond et sélection lisibles | Non exécuté |
| 3 | Parcourir tous les accès du Menu sans valider | Liste longue accessible ; illustration de l’accès sélectionné, repli commun pour les commandes automatiques | Non exécuté |
| 4 | Tes affaires ; Retour | Message Inventaire vide ; retour au Menu | Non exécuté |
| 5 | Tes souvenirs ; Page suivante ; pointer puis valider L’atelier secret | Entrée visible mais verrouillée, impossible à ouvrir ; La clé découverte et La lumière retrouvée absentes | Non exécuté |
| 6 | Retour ; Le message partagé ; Texte suivant jusqu’au bout | Grande image à gauche et texte à droite ; accents lisibles ; dernière phrase « Dernier repère : la lanterne bleue. » accessible | Non exécuté |
| 7 | Écouter la description ; arrêter, relancer, puis Retour avant la fin | Aucune lecture à l’ouverture ; lecture sur commande, arrêt manuel et à la sortie ; aucun audio sur l’écran suivant | Non exécuté |
| 8 | Les archives ; Message des archives ; Retour ; Retour | Même Fiche ; retour aux archives, puis au Menu principal | Non exécuté |
| 9 | Lire le carnet ; Lire la description ; Voir l’illustration ; Retour | Titre vide ; carte dans les 296 × 140 pixels du contenu, proportions conservées ; texte et image alternent sans superposition | Non exécuté |
| 10 | Ton personnage ; parcourir le texte ; Retour | Portrait et talent Pisteur ; autre talent et découverte de l’atelier absents ; tout le texte reste accessible | Non exécuté |
| 11 | Reprendre ; Prendre les six objets ; Retour ; Tes affaires | Reprise au début de la cour ; six objets accordés une seule fois ; quatre cases sur la première page | Non exécuté |
| 12 | Page suivante ; Plume ; Retour ; Page précédente ; Clé de cuivre | Deux cases sur la deuxième page ; bonne Fiche puis retour à la même page ; Clé avec texte long et audio facultatif réutilisés | Non exécuté |
| 13 | Écouter la description de clé ; Retour pendant la lecture ; Retour | Arrêt immédiat ; retour à la Grille puis au Menu, aucun effet ni objet consommé par la consultation | Non exécuté |
| 14 | Tes souvenirs ; Page suivante ; La clé découverte ; Retour ; Retour | Souvenir nouvellement visible ; Fiche partagée ; retour à la page de collection | Non exécuté |
| 15 | Ouvrir l’atelier ; Retour | Commande narrative : clé consommée et scène Atelier ouverte, fond vert distinct ; commande désormais indisponible | Non exécuté |
| 16 | Tes affaires ; Page suivante ; Retour ; Tes souvenirs ; Page suivante | Clé absente, cinq autres objets en deux pages ; souvenir de clé conservé ; atelier secret déverrouillé | Non exécuté |
| 17 | Ton personnage ; lire jusqu’à la découverte ; Retour ; Reprendre | Information Atelier maintenant visible ; reprise au début de l’atelier sans nouvelle consommation | Non exécuté |
| 18 | Déposer les cinq objets ; Retour ; Tes affaires ; Retour | Inventaire vide à nouveau ; souvenirs conservés | Non exécuté |
| 19 | Reprendre ; Lire les traces ; Lancer le dé des lueurs | Narration, dé narratif puis fin dorée ou bleue ; le résultat indique une péripétie, sans statistique | Non exécuté |
| 20 | Retour ; Tes souvenirs ; Page suivante ; La lumière retrouvée | Dernier souvenir révélé ; consultation sans changement de fin ni de résultat | Non exécuté |
| 21 | Retour au Menu ; Bibliothèque ; rouvrir ; Reprendre | Partie conservée ; même fin et narration depuis son début ; aucun objet réaccordé | Non exécuté |
| 22 | Recommencer et confirmer ; Devenir Ami des animaux ; refaire acquisition et ouverture ; Ton personnage ; Reprendre ; Écouter les lucioles | Autre talent et autre choix narratif disponibles ; découvertes précédentes réinitialisées par le nouveau départ | Non exécuté |

## Comparer les compositions

Les photos officielles restent des références, sans être intégrées aux médias.
Leur dossier est `../references/`.

| Références | Contrôle | Résultat réel |
| --- | --- | --- |
| 01, 02 | Menu, sous-menu, sélection et lisibilité des longues listes | Non exécuté |
| 03, 04 | Portrait, informations et défilement ; absence volontaire de jauges chiffrées | Non exécuté |
| 05 | Grille 2 × 2, sélection, pagination et libellés | Non exécuté |
| 06, 09 | Grande illustration et texte, audio explicite, arrêt à la sortie | Non exécuté |
| 07 | Carnet pleine zone de contenu, sans titre imposé | Non exécuté |
| 08 | Collection, entrées masquées/verrouillées et souvenir après consommation | Non exécuté |
| 10, 11 | Illustration liée au choix pointé avant validation | Non exécuté |

Pour chaque écart, noter écran, commande, attendu, observé, reproductibilité et
photo éventuelle. Ne pas remplacer « Non exécuté » par « réussi » à partir des
seuls tests Lua. Aucune reprise à la seconde exacte, statistique chiffrée,
position libre ou migration d’ancienne partie n’est attendue.
