Status: ready-for-human
Type: task
Blocked by: 02

# 10 : Filtrer et organiser le graphe unifié

**À construire :** permettre à l’auteur de lire et de travailler sur le graphe unifié grâce aux filtres Tout, Récit et Consultation et au rangement automatique de gauche à droite, en conservant l’identité des fiches partagées et la distinction des liens.

**Bloqué par :** 02 — Créer un menu principal avec une fiche consultable.

**Références :** [spécification complète](../spec.md), [ticket parent](01-ecrans-personnalisables-graphe.md).

- [x] Les trois filtres affichent les éléments correspondant à leur périmètre sans supprimer de contenu ni modifier les destinations de l’aventure.
- [x] Le rangement automatique des éléments représentés produit une lecture horizontale de gauche à droite et conserve les relations entre récit et consultation.
- [x] Les liens narratifs et les liens de consultation restent visuellement distincts ; une fiche partagée reste un seul nœud lors du filtrage et du rangement.
- [x] Le comportement s’appuie sur la distinction commune entre récit et consultation et couvre les nouveaux gabarits dès leur intégration, sans exiger leur livraison préalable pour démontrer les filtres.
- [x] Les opérations de présentation du graphe respectent le cycle de projet existant ; les modifications enregistrables se retrouvent après réouverture et les changements de visibilité ne modifient pas la partie.
- [x] Les tests d’interaction et de projection existants vérifient les éléments visibles, les relations conservées et le rangement. Un projet rangé et filtré produit la même aventure jouable dans le vrai lecteur.

## Comments

Ce lot améliore un parcours d’auteur déjà jouable grâce au ticket 02. Les nœuds sont éditables et peuvent être reliés dès la livraison de chaque lot fonctionnel.

Réalisation locale terminée le 17 novembre 2026 ; voir la [validation du ticket 10](../validation-10.md). La démonstration complète et le contrôle sur appareil restent au ticket 11.
