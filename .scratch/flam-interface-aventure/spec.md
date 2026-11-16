# Rapprocher les aventures personnelles FLAM des interfaces de référence

## Problem Statement

L’auteur souhaite créer sans Lua une aventure personnelle dont l’expérience
sur FLAM se rapproche au plus près des deux vidéos fournies : un menu
illustré, une reprise visible, une liste de chapitres écoutés, une fiche
personnage, les affaires du personnage, un carnet et des souvenirs.

Le graphe FLAM actuel permet de créer les scènes, choix, conditions, effets,
récompenses et jets de dé. Le lecteur généré possède une sauvegarde, une
reprise et un inventaire textuel, mais sa présentation est fixe. Les images
de scènes sont préparées dans le pack sans être affichées. Il manque les
rubriques personnalisables, l’historique d’écoute et une navigation de
consultation indépendante du parcours narratif.

Représenter ces rubriques par de simples scènes détournerait le scénario :
consulter son carnet ou réécouter un chapitre pourrait déplacer la scène à
reprendre ou réappliquer des effets. L’auteur a besoin de configurer cette
expérience sans multiplier artificiellement les nœuds du graphe.

## Solution

Conserver le graphe pour écrire le scénario et ajouter dans l’atelier FLAM
les réglages du menu et des rubriques de l’aventure. Le pack généré fournit
un lecteur illustré, navigable à la molette et aux boutons, utilisable hors
ligne sur l’appareil réel.

Le menu propose, selon la configuration et l’état de partie : Commencer ou
Reprendre avec progression, Chapitres écoutés, Fiche personnage, Affaires,
Carnet et Souvenirs. Les libellés, l’ordre, les illustrations et les contenus
sont configurables. Les rubriques facultatives peuvent être retirées.
Recommencer reste une action distincte avec confirmation ; quitter vers la
bibliothèque reste possible.

La présentation cible reprend les caractéristiques observables : titre de
l’aventure, liste verticale défilante, sélection clairement indiquée,
illustration liée à la rubrique sélectionnée et liste de chapitres avec
repères et vignettes. Le texte, les choix et l’illustration des scènes sont
également rendus pendant le parcours. Les écrans détaillés des rubriques
non ouvertes dans les vidéos suivent cette même présentation cohérente.

La consultation et la réécoute sont indépendantes des transitions narratives.
Le joueur retrouve sa scène en cours et son état de partie inchangés après
fermeture d’une rubrique, réécoute, retour à la bibliothèque ou extinction.
La reprise de narration reste au début de la scène, conformément au cadrage
existant ; la reprise à la seconde exacte n’est pas ajoutée.

## User Stories

1. En tant qu’auteur, je veux conserver le graphe des scènes et des choix, afin de continuer à écrire mon scénario avec les outils existants.
2. En tant qu’auteur, je veux configurer le menu de l’aventure dans des réglages dédiés, afin de ne pas dessiner les écrans de consultation comme des scènes narratives.
3. En tant qu’auteur, je veux choisir les rubriques présentes, afin d’adapter le menu aux besoins de mon aventure.
4. En tant qu’auteur, je veux renommer et ordonner les rubriques, afin de proposer notamment « Tes affaires » ou « Ton carnet de reporter ».
5. En tant qu’auteur, je veux associer une illustration à chaque rubrique, afin que la sélection à la molette change aussi son repère visuel.
6. En tant qu’auteur, je veux définir une présentation d’accueil illustrée, afin de donner une identité à mon aventure avant de commencer ou reprendre.
7. En tant qu’auteur, je veux utiliser les médias et les outils audio existants, afin de préparer le contenu sans modifier le pack manuellement.
8. En tant qu’auteur, je veux voir l’illustration associée à une scène sur la FLAM, afin que le média configuré soit réellement utilisé pendant le jeu.
9. En tant qu’auteur, je veux regrouper les scènes en chapitres nommés et ordonnés, afin de proposer une liste compréhensible des passages écoutés.
10. En tant qu’auteur, je veux illustrer les chapitres et choisir leurs passages réécoutables, afin d’offrir des repères visuels et une réécoute cohérente.
11. En tant qu’auteur, je veux distinguer un chapitre commencé d’un chapitre écouté, afin de ne pas présenter comme terminé un passage interrompu.
12. En tant qu’auteur, je veux définir les jalons et l’objectif de progression, afin que le pourcentage garde un sens avec des branches alternatives.
13. En tant qu’auteur, je veux personnaliser la fiche personnage avec du texte et des illustrations conditionnels, afin de refléter la classe et les événements de la partie.
14. En tant qu’auteur, je veux présenter les objets avec un nom, une illustration et une description, afin de rendre l’inventaire compréhensible.
15. En tant qu’auteur, je veux configurer des entrées de carnet débloquées par les conditions existantes, afin de conserver les informations découvertes.
16. En tant qu’auteur, je veux configurer des souvenirs illustrés débloqués par les conditions existantes, afin de donner au joueur une trace de ses découvertes.
17. En tant qu’auteur, je veux choisir si une entrée verrouillée est masquée ou signalée comme indisponible, afin de préserver les surprises sans rendre les rubriques ambiguës.
18. En tant qu’auteur, je veux enregistrer, rouvrir, annuler et rétablir mes réglages de menu et de rubriques, afin de travailler avec les mêmes garanties que pour le scénario.
19. En tant qu’auteur, je veux retrouver les références après renommage et recevoir des diagnostics pour les références manquantes, afin de corriger mon aventure avant sa génération.
20. En tant qu’auteur, je veux ouvrir mes anciens projets FLAM avec une configuration par défaut utilisable, afin de poursuivre leur édition sans recréer tout le contenu.
21. En tant qu’auteur, je veux générer et installer cette présentation avec le circuit existant, afin de tester une aventure créée entièrement dans Story Studio.
22. En tant que joueur, je veux voir « Commencer » en l’absence de partie et « Reprendre » lorsqu’une partie existe, afin de comprendre immédiatement l’action proposée.
23. En tant que joueur, je veux voir une progression liée à mon parcours enregistré, afin de savoir où j’en suis dans l’aventure.
24. En tant que joueur, je veux parcourir le menu à la molette avec une sélection et une illustration lisibles, afin de choisir facilement une rubrique.
25. En tant que joueur, je veux faire défiler une liste plus longue que l’écran, afin d’accéder à toutes les rubriques et à tous les chapitres.
26. En tant que joueur, je veux retrouver le titre de l’aventure et celui de la rubrique, afin de rester orienté pendant la consultation.
27. En tant que joueur, je veux consulter les chapitres effectivement écoutés, afin de retrouver les passages déjà découverts sans révéler les branches inconnues.
28. En tant que joueur, je veux réécouter un passage autorisé depuis cette liste, afin de me rappeler l’histoire sans modifier mon parcours.
29. En tant que joueur, je veux interrompre une réécoute et revenir à la liste, afin de reprendre la consultation sans attendre la fin de l’audio.
30. En tant que joueur, je veux consulter ma fiche personnage, afin de retrouver ma classe et les informations narratives qui me concernent.
31. En tant que joueur, je veux consulter mes affaires avec leurs quantités courantes, afin de savoir ce que mon personnage possède encore.
32. En tant que joueur, je veux lire les informations débloquées dans mon carnet, afin de retrouver les indices utiles à mon aventure.
33. En tant que joueur, je veux consulter mes souvenirs débloqués, afin de retrouver les découvertes et récompenses de ma partie.
34. En tant que joueur, je veux comprendre qu’une rubrique est vide ou qu’une entrée est indisponible, afin de ne pas confondre cet état avec une panne.
35. En tant que joueur, je veux revenir au menu puis à ma scène en cours, afin de consulter mes informations sans perdre ma place dans le scénario.
36. En tant que joueur, je veux que la consultation et la réécoute ne consomment aucun objet, n’accordent aucune récompense et ne relancent aucun jet, afin de conserver un état de partie cohérent.
37. En tant que joueur, je veux retrouver ma progression, mes chapitres écoutés et mes rubriques débloquées après extinction, afin de poursuivre hors ligne.
38. En tant que joueur, je veux que Recommencer demande confirmation et réinitialise toute cette partie, afin de pouvoir découvrir un autre parcours sans conserver les découvertes précédentes.
39. En tant que joueur, je veux pouvoir annuler un nouveau départ, afin de garder ma partie sans modification.
40. En tant que joueur, je veux pouvoir quitter vers la bibliothèque et rouvrir l’aventure, afin de retrouver un menu actif et une reprise correcte.
41. En tant que joueur, je veux pouvoir continuer lorsque l’audio facultatif ou une illustration ne peut pas être lu, afin qu’un problème de présentation ne bloque pas le scénario.
42. En tant que joueur, je veux une erreur explicite lorsqu’une sauvegarde ne peut pas être confirmée, afin de ne pas croire à tort que ma progression a été conservée.
43. En tant qu’auteur, je veux valider le parcours complet sur une FLAM réelle avec des contenus originaux, afin de vérifier la lisibilité, les commandes, l’audio et la persistance au-delà des tests simulés.

## Implementation Decisions

- Conserver le document d’aventure FLAM et son runtime distincts des packs à index, conformément à l’ADR 0001. Le graphe reste une projection du scénario, sans devenir le système de mise en page du lecteur. Toute représentation de scénario produite pendant la réalisation sera horizontale, de gauche à droite.
- Étendre le document d’auteur avec une configuration déclarative de présentation, des chapitres et leurs passages, des jalons de progression, ainsi que les définitions des rubriques et de leurs entrées. Réutiliser les identités et conditions du domaine. Une illustration, un texte ou un audio restent facultatifs selon le type d’entrée ; aucun script auteur n’est requis.
- Garder un nombre limité de types de rubriques : chapitres écoutés, fiche personnage, inventaire et collections de contenus conditionnels pour carnet et souvenirs. Utiliser des gabarits communs de rendu plutôt qu’un éditeur de placement libre. Les réglages exposent des choix utiles à l’auteur : ordre, libellés, médias et visibilité.
- Faire évoluer ensemble validation, diagnostics, édition, références médias, sauvegarde du projet et génération JavaScript/Rust. Les réglages appartiennent au document exporté ; seuls les placements du graphe restent des préférences d’auteur. Les références restent stables lors d’un renommage et les suppressions référencées sont protégées.
- Rendre les anciens documents lisibles avec des valeurs par défaut explicites et une conversion déterministe si la version de document change. Conserver l’indépendance entre version du fichier, version du document et compatibilité de partie. Ne pas introduire de migration silencieuse des parties installées ; une incompatibilité reste explicite et ne doit jamais effacer automatiquement une partie.
- Étendre le lecteur généré avec un état de navigation de consultation distinct de l’état de partie. Ouvrir une rubrique ou lancer une réécoute ne passe pas par une transition de scénario. La scène narrative à reprendre reste inchangée ; quitter une consultation permet de retrouver le menu et de reprendre cette scène.
- Pendant la narration, prévoir une commande de retour au menu de l’aventure ; depuis une rubrique, retour vers son parent, puis vers le menu. Depuis le menu, une commande explicite permet de quitter vers la bibliothèque. Vérifier la correspondance des boutons sur l’appareil avant de figer leurs indications. Empêcher les superpositions de pistes et ignorer les callbacks d’une lecture arrêtée.
- Maintenir la reprise au début de la scène en cours, y compris après une consultation ou une extinction. La réécoute ne propose pas les choix narratifs du passage archivé et ne remplace pas la narration à reprendre. Le réglage existant de non-répétition audio d’un choix revenant à la même scène reste applicable aux transitions narratives.
- Utiliser la présentation 320 × 240 existante comme contrainte de rendu. Prévoir des zones lisibles pour titre, contenu, illustration et sélection ; le défilement doit rendre tout contenu accessible sans chevauchement ni texte définitivement tronqué. Une absence de média conserve une présentation exploitable. Les indications système de batterie ou Bluetooth relèvent du firmware : leur reproduction n’est pas un critère de cette évolution.
- Afficher effectivement les images de scènes déjà présentes dans le modèle, ainsi que les illustrations d’accueil, de rubriques, de chapitres et d’entrées. Faire passer tous ces médias par la préparation, le contrôle et l’installation existants ; aucune dépendance à un chemin de la machine d’auteur ne subsiste dans le pack.
- Définir explicitement les passages rattachés à un chapitre et leur ordre d’auteur. Un passage audio n’est marqué écouté qu’après une fin normale de lecture et confirmation de l’enregistrement. Un arrêt prématuré ou un choix de continuer sans audio ne vaut pas écoute complète. Pour un passage sans audio, utiliser un critère narratif explicite de découverte, sans lui attribuer une écoute fictive.
- Conserver par partie l’historique des passages écoutés et l’état des jalons, avec des identités stables. Dédupliquer les réécoutes ; présenter les chapitres dans l’ordre de l’auteur et ne révéler que les passages autorisés et découverts. Un chapitre commencé peut apparaître comme tel, sans être annoncé entièrement écouté.
- Calculer la progression depuis des jalons d’avancement configurés et un objectif positif explicite. Le pourcentage est borné entre zéro et cent, conservé et ne croît pas lors d’une simple réécoute. Les branches alternatives doivent pouvoir atteindre l’objectif sans imposer l’écoute des branches exclusives ; ne pas diviser naïvement les scènes visitées par toutes les scènes du graphe. Les diagnostics signalent une configuration incohérente et l’exemple vérifie deux branches menant à cent pour cent.
- Construire la fiche depuis la classe et des entrées narratives conditionnelles ; ne pas imposer de statistiques ou de nouveau système de personnage. L’inventaire présente les quantités réelles, avec un état vide explicite. Les objets à quantité nulle ne sont pas présentés comme possédés. La consultation n’utilise ni ne consomme d’objet ; les actions de consommation restent des choix narratifs explicites.
- Construire carnet et souvenirs depuis des entrées identifiées, ordonnées et conditionnées par l’état de partie existant. Une entrée déverrouillée peut avoir un texte, une illustration et un audio facultatif. Sa consultation ne déclenche aucun effet. La mémorisation durable d’une découverte utilise un événement acquis, plutôt qu’une condition temporaire telle que la possession d’un objet consommable.
- Conserver les protections existantes de sauvegarde : calcul d’un candidat, écriture et relecture avant présentation d’un nouvel état acquis, refus sans conséquence non confirmée et réconciliation en cas d’incertitude. Cela couvre aussi les fins d’écoute et les jalons. Réinitialiser l’ensemble des découvertes uniquement après confirmation d’un nouveau départ ; préserver les autres aventures.
- Intégrer les réglages dans l’atelier FLAM, avec les commandes ordinaires d’annulation, sauvegarde, médias et diagnostics. Traduire les nouvelles commandes en français, anglais et italien selon les conventions existantes ; le contenu rédigé par l’auteur conserve sa langue.
- Étendre les modules existants de document, édition, génération, rendu et persistance. Préférer une frontière publique de test de parcours exécutant le vrai pack généré à des tests séparés pour chaque composant visuel. Aucun second moteur de règles JavaScript n’est introduit.

## Testing Decisions

- Niveau de vérification confirmé par l’utilisateur : parcours complet du pack généré, puis rendu et commandes sur FLAM réelle. Les tests observent les écrans, lectures audio, actions accessibles et états conservés, sans dépendre de fonctions privées, du nombre de widgets ou de leur implémentation.
- Frontière principale existante : génération depuis le document d’auteur puis exécution du vrai point d’entrée Lua avec seulement les services hôtes simulés. Étendre le harnais du runtime déjà utilisé pour les parcours avec et sans narration, les classes, inventaires, récompenses, jets, réouvertures et erreurs de stockage. Vérifier aussi le pack produit par le générateur Rust avec ce même parcours.
- Préparer une aventure originale avec plus de rubriques et de chapitres que ne peut en afficher un écran, deux classes, deux branches alternatives, un objet consommable, une récompense unique, un jet mémorisé, des entrées conditionnelles et des médias facultatifs. Inclure textes longs, accents, rubriques vides et contenus verrouillés.
- Parcours principal : commencer, choisir une classe, écouter un passage, obtenir un objet et débloquer une entrée, ouvrir chaque rubrique, défiler dans les listes, réécouter un passage, interrompre la réécoute puis reprendre le scénario. Vérifier les illustrations demandées à l’hôte, la sélection, les textes accessibles et l’absence de révélation de passages inconnus.
- Comparer l’état narratif avant et après chaque consultation et réécoute : même scène à reprendre, même classe, mêmes quantités, mêmes événements, récompenses et résultats de jets. Vérifier qu’une réécoute déjà enregistrée ne change ni l’historique ni la progression. Distinguer les nouveaux acquis légitimes d’écoute des effets narratifs.
- Vérifier les limites d’écoute : fin normale, interruption, échec audio, poursuite sans audio, callback périmé et passage sans piste. Vérifier le traitement explicite de l’écriture d’un nouvel acquis refusée ou incertaine, sans annoncer à tort qu’il est conservé.
- Recréer le module Lua en conservant son stockage et vérifier reprise, historique, progression et rubriques débloquées. Tester aussi le retour bibliothèque sans nouvel appel au point d’entrée, une partie incompatible, l’annulation de Recommencer et un nouveau départ confirmé réinitialisant cette seule aventure.
- Réutiliser les tests d’intégration de projet et d’édition pour ouvrir un ancien document, modifier les réglages, annuler/rétablir, enregistrer et rouvrir ; contrôler les nouvelles références, la préservation des médias et les diagnostics bloquant une génération invalide. Ces contrôles complètent la frontière principale là où le runtime ne voit pas le cycle d’auteur.
- Réutiliser les contrôles de génération et de transfert pour les nouveaux médias, les références absentes et la conservation des autres histoires. Exécuter les régressions pertinentes des modes Libre et Avancé sans étendre leur comportement.
- Validation matérielle indispensable : créer et rouvrir le projet dans l’éditeur sans modifier JSON/Lua, générer et installer sous une identité neuve, parcourir toutes les rubriques et les listes longues à la molette, vérifier les images, les retours, l’audio et la lisibilité sur écran. Comparer les vues obtenues aux caractéristiques observables des vidéos, en consignant les écarts au lieu d’annoncer une fidélité non vérifiée.
- Sur FLAM réelle, interrompre une narration pour consulter, réécouter puis reprendre ; quitter et rouvrir, éteindre complètement, reprendre hors ligne, puis recommencer et essayer l’autre branche. Vérifier la conservation des acquis, l’absence de doublons et l’atteinte cohérente de cent pour cent. Consigner firmware, identité/version du pack, résultats et limites. Le harnais ne prouve ni le rendu physique ni la reprise après extinction.

## Out of Scope

- Reproduction des textes, illustrations, voix ou scripts des aventures achetées ; les vidéos servent de références d’expérience pour des créations originales.
- Modification de la bibliothèque, de son écran de chargement ou de l’interface système FLAM visible au début de la première vidéo.
- Identité pixel par pixel avec une interface commerciale et reproduction des indicateurs système ; les écarts de disposition nécessaires doivent être documentés.
- Éditeur universel d’interface, placement libre de widgets, Lua écrit par l’auteur, animations et mini-jeux.
- Combat, statistiques chiffrées, points de vie, score, équipement ou poids d’inventaire, nouvelles mécaniques de réussite ou d’échec.
- Reprise audio à la seconde exacte, plusieurs parties par aventure, synchronisation et migration d’une partie déjà installée vers un nouveau schéma.
- Installation remplaçant une aventure déjà jouée et modification des contenus commerciaux ou des prototypes validés.
- Conversion du graphe Lunii à index vers FLAM, second moteur de simulation des règles et preuve exhaustive de l’absence d’impasse pour tous les états.

## Further Notes

- Demande du 16 novembre 2026 : « j’aimerais effectivement me rapprocher au plus proche de ces possibilités », à la suite de l’analyse des deux vidéos.
- Références : `PXL_20261116_170627514.TS-720p.mp4` (menu de l’aventure) et `PXL_20261116_171058051.TS-720p.mp4` (chapitres écoutés). Les pièces jointes de la conversation sont les références visuelles ; les chemins temporaires d’extraction ne constituent pas des livrables.
- Les vidéos montrent la navigation du menu et la liste des chapitres, mais pas le détail des fiches, du carnet ou des souvenirs, ni une action de réécoute. Les détails de ces rubriques, les règles de progression et la réécoute sont des propositions fonctionnelles de cette spécification, pas des faits établis sur l’aventure de référence.
- La proximité recherchée concerne à la fois le rendu, la navigation et la conservation de la partie. Un menu dessiné sans les garanties de consultation, d’historique et de reprise ne satisfait pas cette spécification.
- La frontière de test a été soumise à l’utilisateur, qui a confirmé : « Oui, parcours complet et FLAM réelle ». Aucune validation supplémentaire dans l’éditeur n’est ajoutée comme exigence d’aperçu fidèle.
- Le cadrage existant et l’ADR 0001 restent applicables. L’extension ne remet pas en cause le mode FLAM distinct et ne prétend pas migrer les parties ; toute évolution incompatible des contrats devra être documentée lors de la réalisation.
- Ticket de réalisation : [01 — Interface illustrée et rubriques d’aventure](issues/01-interface-illustree-rubriques.md). Le suivi est local ; aucune publication GitHub n’est demandée.
