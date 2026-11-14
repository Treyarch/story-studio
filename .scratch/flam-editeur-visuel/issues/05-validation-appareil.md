Status: ready-for-human
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
