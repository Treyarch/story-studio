Status: resolved
Type: task

# Définir et sauvegarder le document d’aventure FLAM

## Objectif

Premier lot de la [spécification](../spec.md) : représenter une aventure
personnelle sans dépendre des champs codés en dur des lucioles.

## Réalisation

- Vérifier les portes de format, normalisation, signatures de travail,
  historique, sauvegarde des médias et reprise de session avant de choisir
  l’intégration du document au projet. Consigner le choix retenu dans un ADR.
- Définir les identifiants stables, départ, scènes, fins, choix, classes,
  objets, événements, récompenses, conditions, effets et jets narratifs.
- Distinguer fichier structurellement invalide et brouillon incomplet mais
  enregistrable ; produire des diagnostics localisés pour la génération.
- Préserver les références lors d’un renommage. Refuser une suppression
  référencée avec un diagnostic explicite dans ce premier lot.
- Distinguer identité du travail local, identité de l’aventure livrée,
  version du document et compatibilité de l’état de partie.

## Acceptation

Un exemple original exprimant les mécaniques validées se sérialise et se
recharge sans perte. Une version inconnue est refusée sans réécriture.
Renommage, annulation et rétablissement conservent les références. Une quantité
ou plage de dé invalide est signalée ; un brouillon se sauvegarde. Les projets
Libre et Avancé conservent leur comportement de lecture/écriture et de reprise.

Tester par l’interface du module et les vrais codecs de projet, avec une
fixture d’aventure couvrant les règles, plutôt que copier leurs traitements
dans les assertions. Ce ticket ne livre ni interface FLAM ni export jouable.

## Résultat

Document de version 1 intégré au mode `flam` de schéma `.mbah` 5, selon
l’[ADR retenu](../../../docs/adr/0001-document-aventure-flam.md). Structure
stricte, diagnostics de contenu, modifications immuables et suppressions
référencées protégées sont implémentés. Le cycle de projet conserve document,
historique et médias, y compris après déplacement et reprise de session.

Les contrôles ciblés passent ; la suite globale compte 8 722 succès et un
échec préexistant, reproduit sur le commit de départ. Voir la
[revue et validation](../review.md). Aucun essai sur appareil n’est revendiqué.
