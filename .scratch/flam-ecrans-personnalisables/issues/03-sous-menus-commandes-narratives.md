Status: ready-for-human
Type: task
Blocked by: 02

# 03 : Construire des sous-menus et des menus mixtes

**À construire :** relier plusieurs menus, partager une fiche entre plusieurs accès et retrouver le chemin réellement emprunté. L’auteur peut mêler liens de consultation et commandes narratives avec conditions et effets, par exemple demander une clé, la consommer et entrer dans une scène.

**Bloqué par :** 02 — Créer un menu principal avec une fiche consultable.

**Références :** [spécification complète](../spec.md), [ticket parent](01-ecrans-personnalisables-graphe.md).

- [x] L’auteur peut créer et relier des sous-menus, puis proposer dans un même menu consultation et commandes permettant de commencer ou poursuivre le récit.
- [x] Les listes de menu dépassant l’espace visible défilent et permettent d’atteindre chaque entrée avec les commandes de l’appareil.
- [x] Une fiche accessible depuis plusieurs menus est représentée par un seul nœud ; chaque accès ouvre le même contenu.
- [x] Retour remonte le chemin effectivement parcouru pour chacun des accès à une fiche partagée, puis Reprendre retrouve la scène narrative conservée.
- [x] Une entrée narrative utilise les conditions, effets et destinations existants des choix de scène. Une condition non satisfaite empêche son exécution et une transaction impossible n’applique aucun effet partiel.
- [x] Une commande narrative valide applique les conséquences prévues et poursuit le récit vers sa destination ; une consultation reste sans effet sur l’état de partie.
- [x] L’inspecteur distingue clairement les deux types d’entrées et les diagnostics refusent un lien de consultation configuré comme une action narrative.
- [x] Les sous-menus, accès partagés et commandes sont éditables avec annulation/rétablissement et retrouvés après sauvegarde/réouverture.
- [x] Les tests d’interaction et le harnais du vrai lecteur depuis les deux parcours de génération couvrent les accès partagés, les retours, les conditions refusées et une commande consommant une clé.

## Comments

Le ticket 02 fournit le premier parcours de consultation. Les collections et l’inventaire ne sont pas nécessaires pour démontrer les commandes narratives : un objet existant et une fiche simple suffisent.


Le 16 novembre 2026, réalisation locale du lot 03 terminée. Sous-menus,
fiches partagées et commandes narratives réutilisent le document, l’historique,
les règles et le circuit de génération existants. Les contrôles d’interaction
et le même parcours du vrai lecteur depuis les données compilées et le pack
Rust réussissent. Voir le [compte rendu de validation](../validation-03.md).
Le statut `ready-for-human` signale la livraison disponible à examiner ;
la validation matérielle combinée demeure au ticket 11.
