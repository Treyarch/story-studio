Status: ready-for-agent
Type: task

# Construire les écrans FLAM personnalisables dans le graphe

## Problème

Le graphe ne représente que les scènes et jets, tandis que les rubriques sont
configurées à part et que le lecteur impose un rendu commun. L’auteur ne peut
pas construire les menus illustrés, grilles et fiches des références fournies,
ni choisir les couleurs de ses écrans, scènes comprises.

## Spécification

La [spécification complète](../spec.md) est la référence pour la réalisation :
problème, solution, récits utilisateur, décisions de réalisation et de test,
hors périmètre et onze photos de référence. Le périmètre et les frontières
de test sont confirmés par l’auteur.

## Résultat attendu

Créer dans le graphe une aventure FLAM originale avec cinq gabarits configurables,
un thème avec remplacements par écran et un aperçu. Construire des menus mixtes,
grilles d’inventaire ou de collections, fiches et fiche personnage, tout en
préservant la distinction entre consultation et progression narrative.
Générer l’aventure et valider sa présentation sur FLAM réelle.

## Critères d’acceptation

1. Scène, Menu, Grille, Fiche et Fiche personnage sont configurables dans le même graphe ; les jets existants restent disponibles, les liens narratifs et de consultation se distinguent, les filtres fonctionnent et le rangement automatique se lit de gauche à droite.
2. Le thème fournit fond, texte et sélection ; les remplacements par écran, y compris sur les scènes, se retrouvent dans l’aperçu et le lecteur généré.
3. Les menus et scènes proposent une illustration commune ou dépendant du choix sélectionné ; les grilles présentent quatre cases par page ; les fiches proposent les deux compositions convenues et la fiche personnage des informations textuelles conditionnelles.
4. Les grilles s’alimentent depuis l’inventaire ou les entrées d’auteur ; une fiche type réutilise les définitions des objets sans lien par objet ; conditions, états verrouillés, inventaire vide et contenus longs suivent la spécification.
5. Menu principal, sous-menus et fiches partagées conservent le chemin de retour réel et la scène narrative à reprendre. Consulter ne déclenche aucun effet ni jet ; une commande narrative vérifie ses conditions et applique ses effets.
6. Ouvrir le menu interrompt la narration, Reprendre relit le début de la scène conservée, l’audio de fiche se déclenche explicitement et s’arrête à sa sortie.
7. Édition, historique, sauvegarde, réouverture, médias, diagnostics et génération couvrent les nouveaux contenus et réglages. Aucune conversion ni migration des anciennes aventures FLAM n’est exigée ; les modes Lunii ne sont pas modifiés.
8. Le vrai lecteur passe les parcours du harnais existant depuis les données générées et le pack de production ; les tests d’interaction de l’éditeur couvrent les comportements d’auteur qui lui sont propres.
9. Une aventure de démonstration couvre toutes les compositions et les cas de navigation définis dans la spécification. Son rendu, ses commandes et son audio sont vérifiés sur FLAM réelle, avec résultats, firmware, pack et écarts consignés. Les seuls tests locaux ne permettent pas de déclarer cette validation accomplie.

## Comments

Le 16 novembre 2026, spécification publiée dans le suivi Markdown local de
Treyarch/story-studio à partir du cadrage confirmé et des onze photos fournies.
L’auteur a confirmé le recours prioritaire au harnais du vrai lecteur Lua
exécuté depuis le pack généré, complété par les tests d’interaction de l’éditeur
et la validation matérielle. Statut ready-for-agent attribué sans triage
supplémentaire. Aucun code applicatif ni aucune aventure n’ont été modifiés
ou supprimés par cette publication.

Le 17 novembre 2026, lots 02 à 10 réalisés localement et démonstration combinée
du lot 11 préparée ; voir la [validation locale du lot 11](../validation-11.md).
Le parent reste ouvert : les essais sur FLAM réelle, le firmware et leurs
résultats ne sont pas encore disponibles.
