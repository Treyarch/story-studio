# Revue de l’interface illustrée FLAM

Comparaison demandée : commit de départ `c4ea6e8` jusqu’à `f0bc7f2`.
Deux agents indépendants ont relu les conventions et la spécification ; les
correctifs ci-dessous ont ensuite été appliqués directement et contrôlés.
La validation matérielle reste ouverte dans le [parcours dédié](validation.md).

## Standards

- **P2 — Changelog absent** : CONTRIBUTING impose une entrée sous Unreleased
  pour les évolutions visibles. L’entrée française est ajoutée, en précisant
  que la validation du rendu sur appareil reste à effectuer.
- **Heuristique non bloquante — Duplicated Code** : le nommage des médias était
  reproduit lors de la génération et de la relecture du pack. Une fonction
  commune fournit maintenant le nom attendu ; les contrôles des octets et du
  manifeste restent distincts.
- Les nouveaux modules Lua sont embarqués par le générateur Rust. Aucun conflit
  avec l’ADR 0001 ni ajout d’état de partie au document d’auteur relevé.

## Spec

- **P2 — Pages de texte potentiellement tronquées** : vingt glyphes par ligne ne
  garantissaient pas la hauteur réelle après repliement dans 202 pixels. Les
  pages comportent maintenant deux lignes d’au plus douze glyphes, avec coupure
  aux mots lorsque possible, et restent entièrement parcourables.
- **P2 — Objectif impossible par classes exclusives** : le simple nombre de
  jalons ne bornait pas le nombre atteignable avec une seule classe. Les
  diagnostics et le générateur Rust bornent maintenant l’objectif par classe
  et refusent un jalon exigeant simultanément plusieurs classes. Un test de
  génération reproduit le refus d’un objectif nécessitant deux classes.
- **P3 — Orientation partielle** : le titre de l’aventure disparaissait dans les
  rubriques. Une ligne dédiée le conserve ; les fiches détaillées conservent
  aussi le nom de leur rubrique dans leur en-tête défilant.
- Aucun comportement supplémentaire non demandé relevé, ni autre défaut concret
  confirmé dans les transitions, la réécoute, les refus d’écriture, la
  persistance, les médias ou le cycle d’auteur.

Bilan : Standards, une violation et une heuristique corrigées ; Spec, trois
constats corrigés. La vérification du rendu, des commandes et de la reprise
sur FLAM réelle reste requise et n’est pas remplacée par ces revues.
