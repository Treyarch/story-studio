Status: ready-for-human
Type: task
Blocked by: 02

# 07 : Changer l’illustration avec le choix sélectionné

**À construire :** permettre de choisir, pour une scène ou un menu, entre une illustration commune et des illustrations associées aux choix. Le joueur voit l’image changer en parcourant les choix, comme dans les références fournies.

**Bloqué par :** 02 — Créer un menu principal avec une fiche consultable.

**Références :** [spécification complète](../spec.md), [ticket parent](01-ecrans-personnalisables-graphe.md).

- [x] L’auteur peut choisir le mode d’illustration d’une scène ou d’un menu, associer une image commune ou renseigner les images des choix.
- [x] Le lecteur conserve l’image commune dans le premier mode et affiche celle du choix sélectionné dans le second ; changer de sélection ne déclenche aucune destination ni effet.
- [x] Les images restent associées aux bons choix après édition et lors du défilement d’une liste longue ; un choix sans image facultative reste utilisable.
- [x] L’aperçu de l’écran permet de voir l’illustration correspondant à la sélection présentée. Les réglages s’intègrent au thème et à l’aperçu communs lorsqu’ils sont disponibles.
- [x] Modes et médias sont couverts par l’historique, la sauvegarde/réouverture, la préparation des médias, leur déplacement avec le projet et la génération du pack.
- [x] Les tests d’interaction et le vrai lecteur depuis les deux parcours de génération observent les changements d’image sur scènes et menus, avec et sans image facultative.

## Comments

Ce lot peut avancer dès que le premier menu du ticket 02 existe. La validation des compositions sur l’écran physique fait partie du ticket 11.


Le 17 novembre 2026, réalisation locale du lot 07 terminée : modes commun
et sélection sur scènes et Menus, images attachées aux identités, aperçu,
historique et cycle de médias communs. Les interactions d’éditeur et le
même parcours du vrai lecteur depuis les données compilées et le pack Rust
réussissent. Voir le [compte rendu de validation](../validation-07.md).
Le statut `ready-for-human` signale la livraison disponible à examiner ;
la validation du rendu sur FLAM physique reste au ticket 11.
