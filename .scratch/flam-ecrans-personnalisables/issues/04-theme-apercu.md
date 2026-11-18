Status: ready-for-human
Type: task
Blocked by: 02

# 04 : Personnaliser les couleurs et prévisualiser les écrans

**À construire :** définir un thème commun et remplacer ses couleurs écran par écran, scènes comprises. L’auteur retrouve l’apparence effective de l’écran sélectionné dans l’aperçu de l’éditeur et dans le lecteur FLAM généré.

**Bloqué par :** 02 — Créer un menu principal avec une fiche consultable.

**Références :** [spécification complète](../spec.md), [ticket parent](01-ecrans-personnalisables-graphe.md).

- [x] L’auteur peut régler les couleurs communes de fond, de texte et de sélection et les remplacer indépendamment pour un écran.
- [x] Les scènes narratives, le menu et la fiche utilisent les couleurs effectives ; le fond choisi est également visible dans leur aperçu dans le graphe.
- [x] Modifier le thème met à jour les couleurs héritées et conserve les remplacements définis pour un écran ; retirer un remplacement rétablit l’héritage du thème.
- [x] L’aperçu de l’écran sélectionné montre sa disposition et ses couleurs effectives, avec ses contenus et médias configurés, sans faire avancer une partie.
- [x] Les nouveaux gabarits pourront utiliser le même contrat de thème, de remplacements et d’aperçu ; leur prise en charge est complétée avec leur livraison.
- [x] Les réglages sont couverts par l’historique, la sauvegarde/réouverture et les diagnostics de valeurs invalides. La génération transmet les mêmes couleurs au vrai lecteur.
- [x] Les tests d’interaction couvrent l’héritage et les remplacements ; le harnais observe les couleurs réellement demandées par le lecteur dans les deux parcours de génération.

## Comments

Les assertions graphiques locales vérifient la transmission des réglages ; la qualité visuelle sur appareil est vérifiée au ticket 11. Les gabarits ajoutés indépendamment doivent adopter ce contrat lors de leur intégration.


Le 17 novembre 2026, réalisation locale du lot 04 terminée : thème commun,
remplacements indépendants par écran et scène, aperçu dans le graphe,
projection des couleurs sur les cartes, diagnostics, historique et persistance.
Le même parcours du vrai lecteur depuis les données compilées et le pack Rust
observe les couleurs effectivement appliquées aux objets LVGL. Les contrôles
automatisés réussissent ; voir le [compte rendu de validation](../validation-04.md).
Le statut `ready-for-human` signale la livraison disponible à examiner.
La validation de qualité visuelle sur FLAM réelle demeure au ticket 11.
