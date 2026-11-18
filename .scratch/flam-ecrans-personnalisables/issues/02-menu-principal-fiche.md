Status: ready-for-human
Type: task
Blocked by: None

# 02 : Créer un menu principal avec une fiche consultable

**À construire :** permettre à l’auteur de créer et relier dans le graphe un menu principal et une fiche simple avec texte et image, puis de les consulter dans le pack généré. Pendant le récit, Retour ouvre ce menu ; consulter puis revenir ne change pas la scène à reprendre et ne rejoue aucun effet. Ce premier parcours établit le modèle commun des écrans et leur navigation, dans le mode de projet FLAM distinct.

**Bloqué par :** aucun ; peut commencer immédiatement.

**Références :** [spécification complète](../spec.md), [ticket parent](01-ecrans-personnalisables-graphe.md).

- [x] Une nouvelle aventure permet d’ajouter, nommer et relier un Menu et une Fiche simple, puis de désigner le menu principal. Les scènes et jets restent disponibles dans le même graphe.
- [x] Les liens de consultation se distinguent des liens narratifs ; la fiche reste un écran de consultation et ne devient pas une scène du récit.
- [x] Le pack généré affiche le menu et ouvre la fiche avec son texte et son image facultative. La navigation fonctionne aussi sans image.
- [x] Retour pendant le récit interrompt la narration et ouvre le menu principal. Depuis la fiche, Retour retrouve ce menu ; Reprendre relit depuis le début la scène narrative conservée.
- [x] Une consultation répétée et une reprise ne rejouent ni effet, ni récompense, ni jet et ne consomment aucun objet ; la partie narrative reste conservée.
- [x] Les nouveaux écrans, liens et médias passent par l’historique, la sauvegarde et la réouverture. Des références invalides produisent des diagnostics exploitables avant génération.
- [x] Les tests d’interaction existants couvrent ce parcours d’auteur ; le harnais exécute le vrai lecteur depuis les données compilées et un pack produit par Rust, en observant écrans, audio et partie sauvegardée.
- [x] La réalisation ne nécessite aucune conversion d’ancienne aventure et ne modifie pas les modes de projet Lunii. Les adaptations partagées nécessaires sont limitées à ce premier parcours démontrable.

## Comments

Découpage et dépendances approuvés par l’auteur. Les variantes avancées de fiche, les sous-menus et les commandes narratives de menu sont livrés par les tickets suivants.


Le 16 novembre 2026, réalisation du lot 02 terminée localement : écrans Menu et
Fiche dans le graphe, accès de consultation, désignation du menu principal,
lecteur et génération de production, historique, fichiers, médias et diagnostics.
Les tests d’interaction et le même parcours du vrai lecteur depuis le compilateur
JavaScript et le pack Rust réussissent. Voir le [compte rendu de validation](../validation-02.md).
Le statut `ready-for-human` signale la livraison disponible à examiner ; la
validation matérielle combinée reste portée par le ticket 11 et n’est pas
revendiquée ici. Le ticket 01 demeure le parent, sans élargissement de ce lot.
