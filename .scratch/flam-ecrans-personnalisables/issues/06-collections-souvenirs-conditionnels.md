Status: ready-for-human
Type: task
Blocked by: 05

# 06 : Créer des collections et souvenirs conditionnels

**À construire :** alimenter une grille avec des entrées et fiches définies par l’auteur, éventuellement conditionnelles, pour présenter notamment des souvenirs indépendants des possessions actuelles.

**Bloqué par :** 05 — Consulter l’inventaire en grille avec fiches d’objet.

**Références :** [spécification complète](../spec.md), [ticket parent](01-ecrans-personnalisables-graphe.md).

- [x] L’auteur peut choisir une source composée de ses propres entrées plutôt que l’inventaire, renseigner leurs libellés et images et relier leurs fiches.
- [x] Les entrées utilisent les conditions existantes de l’état de partie. L’auteur choisit de masquer une entrée indisponible ou de la montrer verrouillée.
- [x] Une entrée verrouillée reste visible comme indisponible et ne permet pas d’ouvrir sa destination ; une entrée masquée n’apparaît pas dans la grille.
- [x] Une découverte mémorisée permet de conserver un souvenir après consommation de l’objet associé, alors que l’inventaire ne présente plus cet objet.
- [x] Les collections réutilisent la grille 2 × 2 paginée, la sélection et les retours, y compris avec plus de quatre entrées et des entrées rendues indisponibles par les conditions.
- [x] Consulter une collection ou une fiche ne déclenche aucun effet ni jet et conserve la scène narrative à reprendre.
- [x] Entrées, conditions, médias et références de fiches passent par l’historique, la sauvegarde/réouverture et les diagnostics ; leur présentation utilise le contrat commun de thème et d’aperçu lorsqu’il est disponible.
- [x] Les tests d’interaction et le harnais du vrai lecteur depuis les deux parcours de génération vérifient les entrées masquées/verrouillées et la distinction entre possession actuelle et découverte passée.

## Comments

La navigation de grille est fournie par le ticket 05. Les conditions et les effets nécessaires à la démonstration existent déjà dans le récit ; les commandes narratives de menu ne bloquent donc pas ce lot.


Le 17 novembre 2026, réalisation locale du lot 06 terminée : collections
d’auteur, entrées et fiches conditionnelles, masquage et verrouillage,
pagination commune et découverte conservée indépendamment de la possession.
Édition, historique, médias, diagnostics, sauvegarde et aperçu sont couverts.
Le même parcours du vrai lecteur depuis les données compilées et le pack Rust
réussit ; voir le [compte rendu de validation](../validation-06.md).
Le statut `ready-for-human` signale la livraison disponible à examiner.
La validation sur FLAM réelle demeure au ticket 11.
