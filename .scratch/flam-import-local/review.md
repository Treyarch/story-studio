# Revue de l’import FLAM

Périmètre : commit de réalisation de l’import depuis FLAM, comparé à son parent. Les commits parallèles du prototype narratif sont exclus du bilan de cette fonctionnalité.

## Standards

Aucune violation avérée des conventions documentées. Messages de commit français, entrée Unreleased, documentation et catalogues des trois langues actualisés.

Une remarque facultative de maintenance : les règles d’éligibilité et l’exception FLAM restent répétées entre le menu, la fiche et le plan d’import. Les réunir davantage dans une présentation commune pourrait réduire le risque de divergence. Ce jugement de duplication ne constitue pas une violation documentée et ne bloque pas la réalisation.

## Spec

Aucun écart confirmé : aucune exigence manquante, aucune dérive de périmètre et aucune exigence identifiée comme mal implémentée. La revue couvre la conservation brute, les métadonnées voisines, la redécouverte, la séparation des identités, la publication sans écrasement, les interruptions, le bilan et le maintien des refus d’écriture sur FLAM.

Bilan : Standards, zéro violation et une remarque facultative de maintenance ; Spec, zéro constat.

## Vérifications

- Six tests Rust d’acquisition FLAM : réussis. Ils couvrent la copie inchangée, les métadonnées et un catalogue neuf après déconnexion, les doublons entre appareils et versions, les collisions, l’annulation, la déconnexion, la relance, les formats Lua et à index, la séparation des autres formats et le refus d’un espace de travail situé sur l’appareil.
- 136 tests JavaScript liés au catalogue, au panneau et à la file : réussis après adaptation des attentes de formats à l’ajout de Copie FLAM.
- Suite Rust complète, toutes cibles : 2 331 réussis, zéro échec, 57 ignorés.
- Clippy, toutes cibles : réussi.
- Lint, vérification des traductions et compilation de production : réussis.
- Suite JavaScript complète : 8 717 tests, 8 713 réussis et quatre échecs au premier passage. Les deux attentes de formats ont été corrigées et revérifiées dans les 136 tests ciblés. Deux échecs hors fonctionnalité restent : le test de cycle de vie des traductions reçoit des appels plugin:log supplémentaires (reproduit isolément) ; le test d’admission au démarrage ne peut ouvrir le port Vite 1421 déjà occupé. Aucun processus existant n’a été arrêté pour libérer ce port.

Aucun test sur un appareil FLAM physique n’a été effectué pour cette réalisation.

# Correction des informations absentes

## Diagnostic

Le défaut a été reproduit sur le FLAM monté : les 14 histoires étaient listées mais le test échouait sur l’absence de titres. Le cache facultatif de l’appareil était absent. L’installateur expérimental l’invalide après installation ; la lecture du panneau ne prévoyait aucun repli.

Les titres ont été retrouvés dans les sauvegardes du cache et les manifestes des prototypes, puis enregistrés uniquement dans les données locales de l’application. Les données personnelles ne sont pas ajoutées au dépôt.

## Standards

La revue indépendante ne relève aucune violation documentée ni remarque de conception suffisamment étayée pour justifier un signalement.

## Spec

La revue indépendante ne relève aucun écart confirmé. La conservation et la résolution locales des titres, leur utilisation à l’import et la reprise des couvertures existantes respectent la demande corrective et l’interdiction d’écriture sur FLAM.

Bilan de la correction : zéro constat sur chaque axe.

## Vérifications de la correction

- Suite Rust complète : 2 334 tests réussis, aucun échec, 57 ignorés.
- Tests Rust ciblés : 13 réussis, aucun échec ; test matériel ignoré par défaut.
- Test explicite sur FLAM monté : 14 titres résolus, fichiers conteneurs présents et liste sur l’appareil inchangée.
- Tests JavaScript du panneau et de la file : 122 réussis.
- Tests Python de l’installateur : cinq réussis, dont la conservation locale du titre avant invalidation du cache.
- Les 14 titres et 11 couvertures officielles sont présents sur l’ordinateur ; le cache de l’appareil reste absent.
- Formatage Rust et vérification du diff : réussis.
- Clippy toutes cibles : réussi avec deux tâches de compilation simultanées après l’interruption système du premier essai.
