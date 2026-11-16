Status: resolved
Type: task
Blocked by: 04

# Valider une aventure créée visuellement sur la FLAM réelle

## Objectif

Terminer le jalon par une preuve matérielle du
[parcours complet](../spec.md), après les contrôles locaux des tickets 01 à 04.
Le test humain n’est à réaliser qu’une fois leurs livrables disponibles.

## Parcours

1. Créer l’aventure depuis Story Studio sans modifier de JSON ni de Lua.
2. Enregistrer, fermer, rouvrir, générer et installer sous une identité neuve.
3. Choisir une classe, récupérer la clé et vérifier sa quantité dans l’inventaire.
4. Quitter, reprendre, puis éteindre complètement et reprendre hors ligne.
5. Consommer la clé, vérifier porte ouverte et coffre vidé après extinction.
6. Vérifier le choix propre à la classe et le traitement du choix inaccessible.
7. Lancer le dé ; après revisite et extinction, retrouver le même résultat.
8. Atteindre une fin, recommencer explicitement et parcourir l’autre classe.
9. Vérifier les autres histoires et les prototypes déjà présents sur l’appareil.

## Acceptation

Consigner firmware exact, identité et version du contenu, résultats locaux,
parcours réellement effectués et limites. Une validation du harnais n’est pas
une confirmation matérielle. Une anomalie de reprise empêche de clôturer le
jalon, même si l’aventure se lit correctement avant extinction.

## Préparation

La [fiche de validation](../validation-05.md) contient le parcours détaillé et
les résultats à compléter. Le 15 novembre 2026, l’appareil connecté annonce
le firmware `2.4.1-d5186dc0` et les trois tests ciblés du runtime passent.
Le parcours physique et l’installation depuis l’interface restent à effectuer.

## Comments

Le 16 novembre 2026, l'utilisateur confirme également la conservation de la
péripétie après retour à la rencontre et nouveau tirage, puis après extinction
complète et reprise, dans la copie dédiée. Le parcours matériel guidé est validé.

Le 16 novembre 2026, installation depuis l'éditeur confirmée après sélection
du volume FLAM. L'utilisateur valide ensuite deux parcours avec extinction
complète : conservation de Pisteur et de la clé sans nouvelle récompense du
coffre, puis consommation de la clé et conservation de la porte ouverte et
du coffre vide. Il confirme ensuite les choix propres aux deux classes,
les fins et le nouveau départ rétablissant l'état initial. La conservation
du résultat du dé reste en attente. Lecture et reprise d'une autre histoire
confirmées ensuite ; copie de validation avec revisite du dé préparée, sous
une identité indépendante. Voir la
[fiche de validation](../validation-05.md).

Le 15 novembre 2026, l’utilisateur confirme le fonctionnement général sur
appareil et les combinaisons. Aucune narration n’avait été ajoutée, donc
l’absence de son est attendue. Voir la [fiche](../validation-05.md) pour les
limites de ce retour et les améliorations d’interface signalées. La reprise
après extinction hors ligne n’est pas explicitement confirmée.

## Answer

Validation matérielle guidée terminée sur FLAM `2.4.1-d5186dc0` : installation,
classe et inventaire persistants, récompense unique, consommation de clé,
porte ouverte persistante, conditions des deux classes, fins et nouveau départ.
La copie dédiée valide le résultat du dé après revisite et extinction.
Lecture et reprise d'une autre histoire confirmées. Les limites de couverture
(narration absente, autres prototypes non revérifiés individuellement,
renommage/réouverture et ergonomie non détaillés) restent consignées dans le bilan.
