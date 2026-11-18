# Construire les écrans FLAM personnalisables dans le graphe

## Problème

L’auteur ne peut pas composer dans le graphe des parcours d’écrans équivalents
à ceux des histoires officielles Donjons & Dragons montrées en référence :
menu illustré, inventaire en grille 2 × 2, fiche d’objet avec description audio,
souvenirs, carnet pleine image et fiche personnage. Le graphe ne représente
actuellement que les scènes et les jets ; les rubriques se configurent à part.
Le lecteur impose un gabarit à trois lignes, de petites illustrations et un
fond commun. Ajouter des données d’objet ne suffit donc pas à obtenir le rendu
recherché ni à construire visuellement sa navigation.

L’auteur veut davantage de types de nœuds configurables, choisir le fond de chaque
écran, scènes comprises, et vérifier sa présentation dans l’éditeur avant de jouer
l’aventure sur FLAM.

## Solution

Proposer cinq gabarits configurables : Scène, Menu, Grille, Fiche et Fiche personnage.
Les scènes, jets et écrans de consultation figurent dans un même graphe, avec
liens narratifs et liens de consultation distincts, filtres de visibilité et
rangement automatique de gauche à droite. Les cinq gabarits concernent les écrans ;
ils ne remplacent pas les jets de dé existants.

Un thème commun fournit les couleurs de fond, de texte et de sélection, avec
remplacements possibles pour chaque écran. L’aperçu de l’écran sélectionné permet
de voir les couleurs, les illustrations et la disposition choisie. Les menus et
scènes peuvent changer d’illustration selon le choix sélectionné. Les grilles
présentent quatre contenus par page et ouvrent des fiches alimentées par les objets
ou les entrées de l’auteur.

Un menu principal donne accès au récit et aux parcours de consultation. Consulter
ne modifie pas l’état de partie ; une commande narrative peut porter des conditions
et des effets. Le retour suit le chemin emprunté, puis Reprendre retrouve la scène
narrative conservée et relance sa narration au début.

## Récits utilisateur

1. En tant qu’auteur, je veux créer une nouvelle aventure personnelle avec les nouveaux gabarits, afin de construire directement l’expérience visuelle recherchée.
2. En tant qu’auteur, je veux ajouter un nœud Scène, afin de présenter une situation narrative et ses choix.
3. En tant qu’auteur, je veux ajouter un nœud Menu, afin de proposer des accès vers le récit et les contenus consultables.
4. En tant qu’auteur, je veux ajouter un nœud Grille, afin de présenter visuellement des objets ou des découvertes.
5. En tant qu’auteur, je veux ajouter un nœud Fiche, afin de détailler un objet, un souvenir ou une page de carnet.
6. En tant qu’auteur, je veux ajouter un nœud Fiche personnage, afin de présenter un portrait et des informations sur le personnage.
7. En tant qu’auteur, je veux conserver les jets de dé narratifs dans le graphe, afin de continuer à proposer des péripéties aléatoires.
8. En tant qu’auteur, je veux relier les écrans de consultation et le récit dans un même graphe, afin de comprendre toute la navigation de mon aventure.
9. En tant qu’auteur, je veux distinguer visuellement les liens narratifs des liens de consultation, afin de savoir lesquels font avancer la partie.
10. En tant qu’auteur, je veux filtrer le graphe sur Tout, Récit ou Consultation, afin de travailler sur le parcours qui m’intéresse.
11. En tant qu’auteur, je veux ranger automatiquement le graphe de gauche à droite, afin de lire ses parcours horizontalement.
12. En tant qu’auteur, je veux relier plusieurs accès à une même fiche, afin de partager un contenu sans dupliquer son nœud.
13. En tant qu’auteur, je veux définir les couleurs communes de fond, de texte et de sélection, afin de donner une apparence cohérente à mon aventure.
14. En tant qu’auteur, je veux remplacer ces couleurs sur un écran particulier, afin d’adapter son ambiance et sa lisibilité.
15. En tant qu’auteur, je veux choisir le fond d’une scène narrative, afin de personnaliser aussi les écrans du récit.
16. En tant qu’auteur, je veux retrouver le fond choisi dans l’aperçu du graphe, afin d’identifier la présentation de mes écrans.
17. En tant qu’auteur, je veux voir l’aperçu de l’écran sélectionné avec ses réglages, afin de vérifier sa composition avant la génération.
18. En tant qu’auteur, je veux choisir une illustration commune pour une scène ou un menu, afin de l’accompagner d’une image stable.
19. En tant qu’auteur, je veux associer des illustrations aux choix d’une scène ou d’un menu, afin que l’image change avec la sélection.
20. En tant qu’auteur, je veux configurer une grille alimentée par l’inventaire, afin qu’elle présente les objets effectivement détenus.
21. En tant qu’auteur, je veux configurer une grille avec mes propres entrées, afin de créer notamment une collection de souvenirs.
22. En tant qu’auteur, je veux conditionner les entrées de mes collections, afin de révéler les contenus selon les découvertes de la partie.
23. En tant qu’auteur, je veux choisir entre masquer une entrée indisponible et l’afficher verrouillée, afin de contrôler ce que le joueur découvre à l’avance.
24. En tant qu’auteur, je veux définir un objet une seule fois avec son nom, son image, sa description et son audio, afin de réutiliser les mêmes informations dans sa fiche.
25. En tant qu’auteur, je veux relier la grille d’inventaire à une fiche type, afin de ne pas dessiner un lien pour chaque objet potentiellement acquis.
26. En tant qu’auteur, je veux alimenter les fiches de souvenirs par mes propres contenus, afin de décrire des découvertes indépendantes de la possession d’un objet.
27. En tant qu’auteur, je veux choisir une fiche avec grande image à gauche et texte à droite, afin de présenter un objet comme sur les références.
28. En tant qu’auteur, je veux choisir une fiche dont l’image occupe tout l’espace de contenu, afin de présenter une page de carnet.
29. En tant qu’auteur, je veux renseigner des informations conditionnelles sur la fiche personnage, afin qu’elle reflète le personnage choisi et ses découvertes sans statistiques chiffrées.
30. En tant qu’auteur, je veux pouvoir omettre titre, image ou audio selon le contenu, afin de ne pas fournir des médias inutiles à certains écrans.
31. En tant qu’auteur, je veux désigner un menu principal et créer des sous-menus reliés, afin d’organiser les accès de l’aventure.
32. En tant qu’auteur, je veux mélanger consultation et commandes narratives dans un menu, afin de proposer Reprendre, Tes affaires et Ta fiche personnage au même endroit.
33. En tant qu’auteur, je veux appliquer des conditions et des effets aux commandes narratives des menus, afin de réutiliser les règles déjà disponibles pour les choix de scène.
34. En tant qu’auteur, je veux enregistrer mes nouveaux écrans, liens et réglages avec le projet, afin de les retrouver après réouverture.
35. En tant qu’auteur, je veux annuler et rétablir ces modifications dans l’historique existant, afin de travailler sur la navigation et le rendu sans perdre mes réglages.
36. En tant qu’auteur, je veux retrouver mes médias après sauvegarde et déplacement du projet, afin de générer une aventure contenant les illustrations et audios prévus.
37. En tant qu’auteur, je veux obtenir des diagnostics localisés pour les références et réglages invalides, afin de corriger mon aventure avant génération.
38. En tant que joueur, je veux ouvrir le menu principal avec Retour pendant le récit, afin de consulter mes informations sans perdre la scène à reprendre.
39. En tant que joueur, je veux parcourir les choix d’un menu et voir l’illustration de la sélection, afin de reconnaître ce que je m’apprête à ouvrir.
40. En tant que joueur, je veux voir les contenus d’une grille sur deux lignes et deux colonnes, afin de reconnaître les objets et leurs libellés.
41. En tant que joueur, je veux accéder aux pages suivantes d’une grille de plus de quatre contenus, afin de consulter tous mes objets ou souvenirs.
42. En tant que joueur, je veux voir clairement la case sélectionnée, afin de savoir quelle fiche s’ouvrira à la validation.
43. En tant que joueur, je veux ouvrir la fiche de l’objet sélectionné dans l’inventaire, afin de lire sa description et voir son illustration.
44. En tant que joueur, je veux un message explicite quand mon inventaire est vide, afin de comprendre l’absence de cases.
45. En tant que joueur, je veux qu’une entrée verrouillée reste visible mais inaccessible, afin de percevoir l’existence d’un contenu indisponible sans pouvoir l’ouvrir.
46. En tant que joueur, je veux que listes et textes longs défilent, afin de pouvoir lire tout le contenu sur l’écran de FLAM.
47. En tant que joueur, je veux consulter mes fiches sans consommer d’objet ni déclencher d’effet ou de jet, afin d’explorer librement les informations acquises.
48. En tant que joueur, je veux qu’un objet consommé disparaisse de mes affaires mais que sa découverte puisse rester dans mes souvenirs, afin de distinguer possession actuelle et découverte passée.
49. En tant que joueur, je veux lancer explicitement Écouter la description sur une fiche avec audio, afin de choisir quand l’écouter.
50. En tant que joueur, je veux que l’audio d’une fiche s’arrête quand je la quitte, afin de ne pas l’entendre sur l’écran suivant.
51. En tant que joueur, je veux que Retour retrouve l’écran par lequel je suis arrivé, même pour une fiche partagée, afin de remonter naturellement mon parcours.
52. En tant que joueur, je veux que Reprendre retrouve la scène narrative conservée et la relise depuis son début, afin de poursuivre mon aventure après consultation.
53. En tant que joueur, je veux qu’une commande narrative vérifie ses conditions et applique ses effets lorsqu’elle poursuit le récit, afin que mes décisions aient les conséquences prévues.
54. En tant qu’auteur, je veux valider une aventure de démonstration sur FLAM réelle, afin de vérifier le rendu, les commandes, l’audio et le retour au récit sur l’appareil cible.

## Décisions de réalisation

- **Graphe unifié, navigation distincte.** Étendre l’atelier et la projection du graphe pour représenter les écrans de consultation en plus des scènes et jets. Distinguer les liens narratifs et les liens de consultation ; une consultation ne devient pas une scène narrative. Conserver un seul nœud pour une fiche partagée et proposer les filtres Tout, Récit et Consultation. Le rangement automatique est horizontal, de gauche à droite.
- **Gabarits prédéfinis configurables.** Fournir Scène, Menu, Grille, Fiche et Fiche personnage. Leurs variantes couvrent les compositions convenues ; l’auteur ne place pas librement les éléments par coordonnées. Le menu et la scène proposent une illustration commune ou une illustration dépendant du choix sélectionné. La fiche propose image à gauche et texte à droite, ou image occupant tout l’espace de contenu. La fiche personnage associe portrait et informations textuelles éventuellement conditionnelles.
- **Modèle d’auteur explicite.** Étendre le document FLAM et ses validations côté éditeur et côté génération pour exprimer les écrans, gabarits, liens, sources de contenu, médias et réglages de présentation. Conserver le mode de projet FLAM distinct et la séparation entre document d’auteur et état de partie. Les numéros précis de version du document et du schéma restent un choix de réalisation ; aucune migration des anciennes aventures ou parties n’est demandée.
- **Thème et remplacements par écran.** Définir les couleurs communes de fond, de texte et de sélection. Un écran peut remplacer les couleurs héritées, y compris une scène narrative. Refléter les couleurs effectives et la disposition choisie dans l’aperçu de l’écran sélectionné. Le rendu du lecteur doit utiliser ces réglages, et pas seulement les cartes du graphe.
- **Sources de grilles.** Une grille utilise soit l’inventaire, selon les quantités détenues, soit des entrées d’auteur éventuellement conditionnelles. L’inventaire n’affiche que les objets dont la quantité est positive. Une page comporte quatre cases en 2 × 2, avec image et libellé par case et sélection mise en évidence. Les pages supplémentaires restent accessibles. Un inventaire vide présente un message explicite.
- **Objet et fiche type.** Conserver une définition unique de chaque objet, avec nom et médias descriptifs facultatifs. Une grille d’inventaire ouvre la fiche type avec les données de l’objet sélectionné ; elle n’exige pas la création d’un nœud et d’un lien par objet. Les fiches de souvenirs peuvent utiliser des contenus d’auteur sans représenter une possession actuelle.
- **Conditions de consultation.** Réutiliser les conditions de l’état de partie pour filtrer les entrées et informations. Selon le réglage d’auteur, une entrée indisponible est masquée ou visible comme verrouillée ; la destination d’une entrée verrouillée est inaccessible. Une condition de découverte permet de conserver un souvenir indépendamment de la consommation ultérieure de l’objet.
- **Commandes de menu.** Un menu peut mêler accès de consultation et commandes narratives. Les commandes narratives réutilisent les conditions, effets et destinations du récit : par exemple, vérifier la possession d’une clé, la consommer et atteindre une scène. Les liens de consultation n’appliquent aucun effet. La validation et l’édition doivent rendre cette différence explicite et ne pas permettre qu’un simple accès à une fiche soit traité comme une action narrative.
- **Reprise et retour.** L’auteur désigne un menu principal accessible avec Retour pendant le récit et peut relier d’autres menus. Conserver séparément la scène narrative à reprendre et le chemin de consultation. Retour remonte le chemin réellement emprunté, y compris lorsque la fiche a plusieurs accès. Reprendre retrouve la scène narrative conservée ; une véritable commande narrative peut changer la destination du récit.
- **Audio.** Ouvrir le menu interrompt la narration. Reprendre relit la scène depuis son début, sans rejouer ses effets par le seul fait de la reprise. L’audio d’une fiche ne démarre que sur Écouter la description et s’arrête en quittant la fiche. Préserver les protections existantes du cycle audio et de la persistance lors des transitions.
- **Contenus longs et facultatifs.** Les listes et les textes longs des fiches défilent, tandis que les grilles sont paginées par quatre. Titre, images et audio sont facultatifs selon le contenu. Les classes restent narratives et sans statistiques chiffrées.
- **Cycle de projet et génération.** Faire passer écrans, liens, thème, remplacements et médias par le cycle existant d’édition, d’historique, de sauvegarde et de réouverture. Réutiliser la préparation des médias et le circuit de génération du pack. Étendre les diagnostics structurels et de contenu, avec accès aux réglages à corriger. Conserver les protections existantes de génération et de transfert ; la nouvelle présentation ne justifie pas un second moteur de règles dans l’éditeur.
- **Anciennes aventures.** Les anciennes aventures FLAM seront supprimées par l’auteur : aucune compatibilité d’ouverture, conversion ou migration de partie n’est requise pour elles. Les nouvelles aventures utilisent le nouveau modèle. Cette simplification est limitée au chantier FLAM et ne demande pas de changer les modes de projet Lunii.

## Décisions de test

L’auteur a confirmé les frontières suivantes pendant la préparation de cette
spécification. Privilégier les comportements observables et les parcours réels ;
éviter les tests reproduisant la structure interne du code.

- **Frontière principale : pack généré et vrai lecteur.** Étendre le harnais existant qui exécute le vrai lecteur Lua, en pilotant les commandes du joueur et en observant les écrans, l’audio et la partie sauvegardée. Réutiliser le parcours commun déjà exécuté depuis les données produites par le compilateur de l’éditeur et depuis un pack de production produit par Rust. Simuler les services hôtes nécessaires ; exécuter les vraies règles et la vraie navigation. Ne pas créer un moteur de test parallèle qui réimplémenterait les règles.
- **Parcours principaux.** Vérifier un menu mixte, un sous-menu, une fiche partagée accessible par plusieurs chemins, le retour dans chaque chemin et la reprise de la scène conservée. Vérifier qu’une consultation répétée ne rejoue ni effets, ni récompenses, ni jet et ne consomme rien. Vérifier à l’inverse qu’une commande narrative de menu vérifie ses conditions et applique ses effets comme un choix de scène.
- **Contenu dynamique et limites.** Couvrir plus de quatre objets, le changement de page et l’ouverture de la bonne fiche, l’inventaire vide, les entrées masquées et verrouillées, les textes et listes longs, les informations conditionnelles de personnage, ainsi que la distinction entre objet consommé et souvenir découvert. Observer les données présentées au joueur et les destinations effectivement accessibles.
- **Rendu et audio observables.** Vérifier les couleurs héritées et remplacées sur plusieurs types d’écrans, les positions des quatre cases, le changement d’illustration avec la sélection, les variantes de fiche et les contenus facultatifs. Vérifier qu’un audio de fiche exige une commande explicite, s’arrête à la sortie et que Reprendre relit le début de la bonne scène. Les assertions sur les appels graphiques ne suffisent pas à prouver la qualité visuelle sur appareil.
- **Complément limité à l’éditeur.** Réutiliser les tests d’interaction existants des formulaires, de l’atelier et du graphe pour ajouter, configurer et relier les gabarits, distinguer les liens, changer les filtres, partager une fiche, éditer le thème et voir l’aperçu. Vérifier les effets sur le projet et l’historique, puis sauvegarder et rouvrir le document avec ses médias. Utiliser les contrôles de diagnostic et de génération existants pour les nouveaux champs et références invalides. Ajouter des tests plus bas uniquement si un comportement important ne peut pas être couvert à ces frontières.
- **Antécédents du dépôt.** Les parcours du menu illustré testent déjà le vrai lecteur avec consultation indépendante, conditions et progression. Le générateur Rust exécute déjà le même harnais depuis les fichiers extraits du pack de production. Les tests d’interaction de l’atelier couvrent déjà formulaires, règles, médias, diagnostics et annulation/rétablissement ; les contrôles de persistance couvrent la réouverture. Étendre ces pratiques plutôt que multiplier les nouveaux points d’entrée de test.
- **Validation matérielle.** Préparer une aventure de démonstration originale comportant les compositions décrites ci-dessous et exécuter les parcours sur FLAM réelle. Comparer les compositions, la lisibilité, le défilement, la sélection et les commandes aux photos. Documenter le pack et le firmware utilisés, les résultats et les écarts. La validation matérielle fait partie du résultat attendu ; un harnais local réussi ne suffit pas à la déclarer accomplie.

La démonstration couvre au minimum : menu illustré mêlant consultation et récit,
illustration changeant avec la sélection, inventaire de plus de quatre objets,
fiche avec audio, carnet pleine image, fiche personnage et scènes de fonds
différents. Elle couvre aussi le retour d’une fiche partagée, la reprise narrative,
les contenus longs, l’inventaire vide, les entrées indisponibles et une commande
narrative conditionnelle consommant un objet.

## Hors périmètre

- Placement libre de chaque texte, image ou bouton et création arbitraire de nouveaux gabarits par l’auteur.
- Statistiques chiffrées de personnage, système de combat ou modification du sens narratif des classes et des jets de dé.
- Reprise de la narration à la seconde exacte.
- Compatibilité, conversion et migration des anciennes aventures FLAM et de leurs parties.
- Fonctionnalité nouvelle de suppression automatique en masse : la suppression prévue des anciennes aventures n’est pas exécutée par la rédaction de cette spécification.
- Reproduction exacte des polices ou des illustrations officielles ; le résultat utilise les médias propres à l’auteur.
- Refonte des modes de projet Lunii ou du protocole d’installation sur l’appareil.

## Notes complémentaires

Le périmètre a été confirmé au terme de l’entretien, puis les frontières de test
ont été confirmées lors de la synthèse. Le ticket associé est prêt pour réalisation,
sans nouvelle phase de triage. Aucun code applicatif ni aucune suppression
d’aventure n’ont été réalisés pendant cette préparation.

La construction des parcours de consultation dans le graphe révise le cadrage
antérieur qui réservait le graphe au scénario. Elle conserve la distinction
entre consultation et progression narrative. Le mode de projet FLAM reste distinct.

Références de conception :

- [Glossaire du domaine](../../GLOSSARY.md).
- [ADR 0001 — mode de projet FLAM distinct](../../docs/adr/0001-document-aventure-flam.md).
- [ADR 0002 — parcours de consultation dans le graphe](../../docs/adr/0002-parcours-consultation-graphe-flam.md).
- [Cadrage confirmé de l’entretien](../../docs/flam-ecrans-personnalisables.md).
- [Interface d’aventure actuelle](../../docs/flam-interface-aventure.md).

Les onze photos fournies par l’auteur sont conservées avec cette spécification.
Elles servent de références de composition et d’interaction, pas de médias à
embarquer dans l’aventure de démonstration :

1. [Menu principal : reprise, progression et rubriques](references/01-menu-principal.jpg).
2. [Liste des chapitres illustrée](references/02-chapitres.jpg).
3. [Fiche personnage, haut de page](references/03-personnage-haut.jpg).
4. [Fiche personnage, défilement](references/04-personnage-suite.jpg).
5. [Inventaire en grille](references/05-inventaire.jpg).
6. [Fiche d’objet avec description audio](references/06-fiche-objet.jpg).
7. [Carnet pleine image](references/07-carnet.jpg).
8. [Souvenirs en grille](references/08-souvenirs.jpg).
9. [Fiche de souvenir avec description audio](references/09-fiche-souvenir.jpg).
10. [Choix narratifs, première sélection illustrée](references/10-choix-fuite.jpg).
11. [Choix narratifs, autre sélection illustrée](references/11-choix-attaque.jpg).

Les jauges chiffrées visibles sur les photos de personnage ne constituent pas
une exigence : les classes restent sans statistiques, conformément à la décision
explicite de l’auteur.
