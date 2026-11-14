Status: ready-for-agent

# Importer les histoires FLAM dans la bibliothèque locale

## Spécification

La [spécification de référence](../spec.md) décrit le problème, les 29 scénarios utilisateur, les décisions d’implémentation, les tests et les exclusions. Le comportement et le périmètre de test sont confirmés par l’utilisateur.

## Résultat attendu

Permettre de copier une sélection d’histoires ou toute la bibliothèque FLAM, histoires masquées comprises, dans la bibliothèque locale. Conserver les dossiers et fichiers d’origine inchangés, sans ZIP, avec les métadonnées à côté de chaque dossier. Les copies restent consultables après déconnexion et nouveau scan, sans lecture ni édition.

## Critères d’acceptation

- La sélection individuelle, multiple et « Copier tout » incluent correctement les histoires masquées.
- Chaque histoire conserve tous ses fichiers d’origine, notamment key, sans modification de l’appareil.
- Les métadonnées voisines préservent le titre disponible, l’UUID et le statut masqué d’origine et permettent la redécouverte au scan.
- Les copies FLAM déjà présentes sont ignorées par UUID, indépendamment de l’appareil source et de la version ; aucun contenu local n’est écrasé.
- L’annulation et la déconnexion conservent les imports terminés sans publier de copie partielle.
- Un échec isolé permet de poursuivre le lot tant que FLAM reste connecté ; le bilan distingue réussites, doublons ignorés, échecs et histoires non traitées.
- La lecture, l’édition et les écritures vers FLAM restent indisponibles.
- Les tests vérifient principalement le parcours depuis un FLAM synthétique jusqu’au catalogue et au nouveau scan. Les tests existants du panneau et de la file d’opérations complètent la sélection, « Copier tout », l’annulation et le bilan.

## Comments

Le périmètre de test a été explicitement validé par l’utilisateur. Ticket publié dans le suivi Markdown local, sans publication GitHub.

### Réalisation

Fonctionnalité implémentée : acquisition brute vers des dossiers locaux, métadonnées voisines, reconnaissance au scan, sélection et copie complète, doublons, annulation et bilan. La conservation et la consultation restent distinctes de la lecture ou de l’édition.

Les tests et les deux axes de revue sont consignés dans le [bilan de réalisation](../review.md). La suite Rust complète passe ; deux échecs JavaScript hors fonctionnalité sont documentés. Le statut de triage est conservé ; la réalisation est terminée.

### Correction des informations sans cache appareil

Le panneau affichait les 14 histoires sans titre après invalidation du cache par l’installateur expérimental. La lecture FLAM dépendait exclusivement de ce fichier facultatif.

Le panneau et l’import utilisent désormais les copies connues, les titres mémorisés sur l’ordinateur et la base officielle locale lorsque le cache manque. Les titres connus sont conservés dans les données de l’application ; l’installateur expérimental y enregistre aussi son titre avant d’invalider le cache. Les couvertures officielles reprennent le mécanisme et l’autorisation réseau existants sans ouvrir le pilote Lunii.

Les 14 titres de l’appareil ont été retrouvés depuis les sauvegardes et manifestes locaux et conservés sur l’ordinateur. Le test matériel en lecture seule retrouve les 14 titres et confirme que la liste sur FLAM est inchangée.
