Status: ready-for-human
Type: task
Blocked by: 02

# 05 : Consulter l’inventaire en grille avec fiches d’objet

**À construire :** configurer une grille d’inventaire en 2 × 2, parcourir ses pages et consulter les fiches des objets détenus. Une fiche type réutilise les données d’objet ; l’auteur ne crée ni nœud ni lien par objet potentiellement acquis.

**Bloqué par :** 02 — Créer un menu principal avec une fiche consultable.

**Références :** [spécification complète](../spec.md), [ticket parent](01-ecrans-personnalisables-graphe.md).

- [x] L’auteur ajoute une Grille alimentée par l’inventaire, la relie au menu et lui associe une fiche type dans le graphe.
- [x] Le lecteur présente uniquement les objets de quantité positive, par pages de quatre cases disposées sur deux lignes et deux colonnes, avec image et libellé par case et sélection clairement indiquée.
- [x] Un inventaire de plus de quatre objets donne accès à toutes ses pages et chaque sélection ouvre la fiche du bon objet, y compris sur une page partiellement remplie.
- [x] La fiche réutilise le nom, l’image et la description définis pour l’objet, sans duplication de ses données ; les médias facultatifs ne bloquent pas la consultation.
- [x] Consulter ne consomme rien et ne change pas la progression narrative. Retour retrouve la grille puis le menu d’accès et Reprendre retrouve la scène conservée.
- [x] Un inventaire vide affiche un message explicite. Après acquisition ou consommation par le récit, la grille reflète les quantités actuelles lors de sa consultation.
- [x] La grille et sa référence de fiche type passent par l’édition, l’historique, la sauvegarde/réouverture, les médias et la validation avant génération ; elles utilisent le contrat commun de présentation lorsqu’il est disponible.
- [x] Les tests d’interaction et le vrai lecteur depuis les données compilées et le pack Rust couvrent pagination, inventaire vide, données réutilisées et changements de possession.

## Comments

Ce lot fournit la première grille complète. Les collections d’auteur réutilisent ensuite cette navigation. L’audio des fiches et leurs variantes avancées sont couverts par le ticket 08.


Le 17 novembre 2026, réalisation locale du lot 05 terminée : grille
2 × 2 paginée, fiche type avec données d’objet réutilisées, retours conservés,
inventaire vide et actualisation des possessions, thème et aperçu communs.
Les tests d’interaction et le même parcours du vrai lecteur depuis les données
compilées et le pack Rust réussissent. Voir le [compte rendu de validation](../validation-05.md).
Le statut `ready-for-human` signale la livraison disponible à examiner ;
la validation sur FLAM réelle demeure au ticket 11. Audio et compositions
avancées de fiche restent au ticket 08.
