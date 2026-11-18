Status: ready-for-human
Type: task
Blocked by: 02

# 08 : Enrichir les fiches avec audio, défilement et carnet pleine image

**À construire :** proposer une fiche à grande image à gauche et texte à droite, ou une image occupant tout l’espace de contenu pour un carnet. Le joueur peut lire une description longue et déclencher explicitement son audio ; quitter la fiche arrête cette lecture.

**Bloqué par :** 02 — Créer un menu principal avec une fiche consultable.

**Références :** [spécification complète](../spec.md), [ticket parent](01-ecrans-personnalisables-graphe.md).

- [x] L’auteur peut choisir les deux compositions convenues, renseigner les médias et omettre titre, image ou audio selon le contenu.
- [x] La variante de carnet affiche l’image dans tout l’espace de contenu ; la variante descriptive affiche la grande illustration à gauche et le texte à droite.
- [x] Une description dépassant l’espace visible défile et reste entièrement lisible avec les commandes de l’appareil.
- [x] Un audio de fiche ne se lance pas à l’ouverture ; Écouter la description le déclenche explicitement. Quitter la fiche l’arrête sans lecture persistante sur l’écran suivant.
- [x] Lire, écouter ou quitter une fiche ne rejoue pas les effets du récit, et Reprendre relit toujours le début de la scène narrative conservée.
- [x] Les compositions et comportements s’appliquent aux fiches d’auteur et aux fiches alimentées par les grilles dès leur intégration, en réutilisant les données et médias d’objet sans duplication.
- [x] Réglages et médias sont couverts par l’historique, la sauvegarde/réouverture, la préparation et les diagnostics. La fiche utilise le contrat commun de thème et d’aperçu lorsqu’il est disponible.
- [x] Les tests d’interaction et le harnais du vrai lecteur depuis les deux parcours de génération couvrent variantes, contenus facultatifs, texte long et cycle audio, en conservant les protections existantes contre les événements audio périmés.

## Comments

Une fiche simple suffit pour réaliser ce lot indépendamment des grilles ; la démonstration finale vérifie aussi leur combinaison. La reprise à la seconde exacte reste hors périmètre.

Réalisation locale terminée le 17 novembre 2026 ; voir la [validation du ticket 08](../validation-08.md). Les contrôles sur FLAM physique restent au ticket 11.
