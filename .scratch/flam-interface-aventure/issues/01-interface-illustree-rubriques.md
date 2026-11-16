Status: ready-for-human
Type: task

# Proposer une interface FLAM illustrée avec menu et rubriques d’aventure

## Problème

L’auteur souhaite rapprocher ses aventures personnelles des deux vidéos de
référence : menu illustré, progression, chapitres écoutés, fiche personnage,
affaires, carnet et souvenirs. Le graphe sait exprimer la logique narrative,
mais le lecteur généré reste textuel et ses écrans de consultation sont limités.

## Spécification

La [spécification complète](../spec.md) définit le problème, les parcours,
les décisions de réalisation, les contrôles et le hors périmètre. Elle est
la référence de ce ticket ; ses rubriques ne sont pas des scènes narratives.

## Résultat attendu

Depuis l’atelier FLAM, configurer sans Lua un menu illustré et ses rubriques,
définir les chapitres et jalons de progression, enregistrer et rouvrir le
projet, puis générer et installer une aventure originale jouable hors ligne.
Le graphe reste consacré aux scènes, choix et jets de dé.

## Critères d’acceptation

1. Les illustrations des scènes et du menu sont réellement affichées sur FLAM ; les listes longues défilent et leurs contenus restent lisibles.
2. Commencer/Reprendre, progression, chapitres écoutés, fiche personnage, inventaire, carnet et souvenirs suivent la configuration d’auteur et l’état de partie.
3. Consulter ou réécouter ne déplace pas la scène narrative sauvegardée, ne consomme aucun objet et ne rejoue aucun effet, récompense ou jet de dé.
4. Une écoute interrompue n’est pas enregistrée comme complète ; les réécoutes ne gonflent ni l’historique ni la progression. Deux branches alternatives peuvent atteindre cent pour cent sans explorer les branches exclusives.
5. Le retour au menu, à la bibliothèque et la reprise après extinction conservent la partie et ses découvertes ; Recommencer demande confirmation et réinitialise cette seule aventure.
6. Les anciens projets s’ouvrent avec des valeurs par défaut ; sauvegarde, réouverture, annulation, médias et diagnostics couvrent les nouveaux réglages. Une partie incompatible n’est jamais effacée silencieusement.
7. Le vrai pack généré passe le harnais de parcours avec services hôtes simulés, y compris les erreurs audio et de stockage. La chaîne de génération et de transfert conserve ses protections.
8. Un parcours matériel sur FLAM réelle confirme lisibilité, commandes, images, audio, consultation et reprise hors ligne après extinction. Le compte rendu identifie firmware, pack et écarts restants par rapport aux références.

## Validation

L’utilisateur a confirmé le niveau de vérification : parcours complet du pack
généré, puis rendu et commandes sur FLAM réelle. S’appuyer principalement sur
la frontière de test existante du vrai runtime Lua, complétée par les contrôles
de projet/génération et la validation matérielle décrits dans la spécification.

## Comments

Le 16 novembre 2026, spécification synthétisée à partir de la conversation,
des deux vidéos et du code existant. Aucun code applicatif modifié. Les
comportements proposés au-delà de ce qui est visible dans les vidéos sont
explicités dans les notes de la spécification.

Le 16 novembre 2026, réalisation locale et contrôles automatisés terminés.
Le statut `ready-for-human` correspond à la validation sur FLAM réelle, encore
nécessaire avant de déclarer les critères matériels satisfaits. Voir le
[parcours et les résultats locaux](../validation.md).
