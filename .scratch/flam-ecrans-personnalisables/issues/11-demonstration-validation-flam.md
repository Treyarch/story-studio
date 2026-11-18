Status: ready-for-human
Type: task
Blocked by: 03, 04, 06, 07, 08, 09, 10

# 11 : Valider l’aventure de démonstration sur FLAM réelle

**À construire :** assembler une aventure personnelle originale couvrant les compositions et cas limites convenus, vérifier leur fonctionnement ensemble et consigner leur rendu ainsi que leurs commandes sur FLAM réelle. Les médias de la démonstration sont propres à l’auteur ; les photos officielles servent uniquement de références.

**Bloqué par :** 03 — Sous-menus et menus mixtes ; 04 — Couleurs et aperçu ; 06 — Collections et souvenirs conditionnels ; 07 — Illustration selon la sélection ; 08 — Fiches enrichies ; 09 — Fiche personnage ; 10 — Filtres et rangement. Les tickets 02 et 05 sont des prérequis transitifs.

**Références :** [spécification complète et onze photos](../spec.md), [ticket parent](01-ecrans-personnalisables-graphe.md).

- [x] La démonstration est créée ou modifiable depuis l’éditeur, puis sauvegardée, rouverte et générée par le circuit de production avec ses médias.
- [x] Elle comprend menu principal illustré, sous-menu et commandes narratives, illustration changeant avec la sélection, inventaire de plus de quatre objets, collection de souvenirs et fiche partagée accessible par plusieurs chemins.
- [x] Elle comprend une fiche descriptive avec audio explicite, un carnet pleine image, une fiche personnage conditionnelle et plusieurs scènes aux fonds différents, utilisant thème et remplacements par écran.
- [x] Elle couvre inventaire vide, pagination, listes et descriptions longues, entrées masquées et verrouillées, objet consommé et souvenir conservé, ainsi qu’une commande narrative conditionnelle consommant un objet.
- [x] Les contrats de présentation et d’aperçu couvrent tous les gabarits livrés. Les filtres et le rangement permettent de travailler sur la démonstration sans modifier son comportement joué.
- [x] Les parcours combinés passent dans le harnais existant du vrai lecteur, depuis les données compilées et le pack de production Rust. Les effets, l’audio et la partie observés respectent la distinction entre consultation et récit.
- [ ] Sur FLAM réelle, le parcours confirme les compositions convenues, les couleurs, la lisibilité, les images, le défilement, la pagination, la sélection et les commandes ; les retours et la reprise au début de la scène sont vérifiés, ainsi que le déclenchement et l’arrêt de l’audio des fiches.
- [ ] Le compte rendu identifie le pack et le firmware, les parcours réellement exécutés, leurs résultats et les écarts visuels ou fonctionnels. La validation matérielle n’est jamais déclarée accomplie sur la seule base des tests locaux.
- [x] Les documents d’usage décrivent les nouveaux parcours et réglages réellement livrés. Les limites convenues restent respectées : pas de statistiques chiffrées, de placement libre, de migration d’anciennes aventures ni de reprise audio à la seconde exacte.

## Comments

Chaque lot précédent possède déjà ses propres vérifications. Ce dernier lot vérifie leur combinaison et le rendu physique. Si l’appareil n’est pas accessible, préparer la démonstration et le parcours matériel, puis signaler explicitement la validation encore nécessaire ; le ticket ne peut pas être déclaré terminé sans les résultats sur appareil.

Le 17 novembre 2026, démonstration, projet portable, médias et pack de production préparés ; les parcours combinés passent localement. Voir la [validation locale et les empreintes du pack](../validation-11.md) et le [protocole matériel](../demo/parcours-materiel.md). Aucun appareil FLAM monté ; firmware non lu, aucune installation ni validation physique exécutée. Le ticket reste non terminé au statut `ready-for-human` pour les essais matériels et leur compte rendu.

Le 18 novembre 2026, FLAM branchée : firmware **2.4.1-d5186dc0** relevé, pack installé avec le service de production et ses 62 fichiers vérifiés sur le volume. Listes précédentes conservées. Voir la [preuve d’installation](../demo/installation-verifiee.json). Les parcours de lecture physique restent à exécuter et le ticket reste ouvert.
