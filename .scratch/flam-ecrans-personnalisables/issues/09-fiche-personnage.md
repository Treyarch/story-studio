Status: ready-for-human
Type: task
Blocked by: 02

# 09 : Créer une fiche personnage illustrée et conditionnelle

**À construire :** créer dans le graphe une fiche personnage avec portrait et informations textuelles éventuellement conditionnelles. Le joueur consulte les informations correspondant à son personnage et à ses découvertes, sans statistiques chiffrées.

**Bloqué par :** 02 — Créer un menu principal avec une fiche consultable.

**Références :** [spécification complète](../spec.md), [ticket parent](01-ecrans-personnalisables-graphe.md).

- [x] L’auteur peut ajouter une Fiche personnage, la relier au menu et configurer son portrait ainsi que ses informations textuelles.
- [x] Les informations peuvent dépendre des conditions existantes de l’état de partie, notamment de la classe ou des découvertes.
- [x] Le lecteur affiche le portrait et les informations accessibles ; les contenus longs défilent et les médias facultatifs ne bloquent pas la consultation.
- [x] Les classes conservent leur sens narratif sans statistiques chiffrées ; les jauges des photos de référence ne deviennent pas des mécaniques de jeu.
- [x] Consulter puis revenir suit la navigation de consultation existante, sans effet ni jet et sans modifier la scène à reprendre.
- [x] Portrait, contenus, conditions et liens passent par l’historique, la sauvegarde/réouverture, les médias et les diagnostics ; le gabarit adopte le contrat commun de thème et d’aperçu lorsqu’il est disponible.
- [x] Les tests d’interaction et le vrai lecteur depuis les deux parcours de génération vérifient les informations conditionnelles, le contenu long et le retour au récit.

## Comments

Les conditions de partie et la navigation de consultation fournissent les capacités nécessaires. La fiche personnage ne dépend pas de la livraison des collections.

Réalisation locale terminée le 17 novembre 2026 ; voir la [validation du ticket 09](../validation-09.md). Le contrôle sur FLAM physique reste au ticket 11.
