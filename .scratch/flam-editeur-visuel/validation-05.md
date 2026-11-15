# Validation matérielle du parcours visuel

État : fonctionnement sur appareil confirmé par l’utilisateur ; détails de
persistance et de couverture à compléter.

## Préparation du 15 novembre 2026

- Révision de départ : `c88ac88`.
- Volume détecté : `/run/media/mathieu/FLAM`.
- Firmware lu dans les métadonnées de l’appareil : `2.4.1-d5186dc0`.
- `node --test scripts/flamRuntime.test.mjs` : 3 tests réussis,
  dont les parcours du runtime généré avec et sans narration.
- Aucune installation ni écriture sur l’appareil durant cette préparation.

## Parcours à effectuer

1. Dans Story Studio, créer une « Aventure FLAM » depuis l’exemple
   « Les compagnons du village ». Renommer l’objet « Clé » en « Clé du village »
   et vérifier que les règles continuent à le référencer.
2. Préparer la revisite du jet depuis les formulaires : ajouter deux scènes
   intermédiaires, une pour chaque péripétie, et y diriger les deux plages
   du jet. Chacune propose un retour vers « La rencontre » et un choix vers
   sa fin d’origine. Conserver les deux fins explicitement marquées comme fins.
3. Enregistrer le projet `.mbah`, fermer, rouvrir et vérifier les règles,
   les noms et les destinations. Générer le pack, relever son identité et
   sa version, puis installer depuis le panneau de production sur le volume FLAM.
4. Éjecter proprement et débrancher. Choisir Pisteur. Avant acquisition,
   vérifier les explications de porte inaccessible. Prendre la clé ; consulter
   l’inventaire (quantité 1), revenir à la bibliothèque puis reprendre.
5. Éteindre complètement et reprendre hors ligne : classe et clé conservées,
   coffre vide. Ouvrir la porte, constater la quantité 0, puis éteindre et
   reprendre : porte ouverte et coffre vide conservés.
6. Traverser : « Lire les traces » est accessible et « Parler au renard » masqué.
   Lancer le dé ; noter la péripétie, revenir à la rencontre et relancer.
   La péripétie reste identique. Refaire après extinction hors ligne.
7. Atteindre une fin. Recommencer avec confirmation, choisir Ami des animaux :
   inventaire vide, porte fermée et coffre disponible. Refaire le parcours :
   « Lire les traces » est désactivé avec explication et « Parler au renard »
   accessible. Atteindre une fin.
8. Vérifier la lecture et la reprise d’une autre histoire et des prototypes
   déjà installés. Consigner leur identité sans modifier leurs parties.

## Résultats à renseigner

- Projet enregistré : à renseigner.
- Identité du contenu / `saveVersion` / reçu de transfert : à renseigner.
- Création et sauvegarde : confirmées ; renommage et réouverture non détaillés.
- Génération et installation : fonctionnement général confirmé après les
  indications d’installation ; identité du pack et reçu à relever.
- Inventaire et récompense unique : non vérifiés sur appareil.
- Reprise bibliothèque et extinction hors ligne : non vérifiées sur appareil.
- Consommation et porte ouverte persistantes : non vérifiées sur appareil.
- Conditions des deux classes : non vérifiées sur appareil.
- Jet conservé après revisite et extinction : non vérifié sur appareil.
- Fins et nouveau départ : non vérifiés sur appareil.
- Autres histoires et prototypes : non vérifiés sur appareil.
- Lisibilité, défilement et commandes sur écran physique : non vérifiés.
- Anomalies et limites observées : à renseigner.

Le [ticket 05](issues/05-validation-appareil.md) reste `ready-for-human`.
Les contrôles locaux ne permettent pas de clôturer le jalon matériel.

## Retour utilisateur du 15 novembre 2026

Après création et sauvegarde du projet, puis les indications de génération
et d’installation, l’utilisateur confirme : « tout est fonctionnel » et
« les combinaisons sont fonctionnelles ». Il signale l’absence de son et
précise n’avoir ajouté aucune piste : ce comportement est attendu, le texte
ne produisant pas automatiquement de narration.

Ce retour confirme le fonctionnement général du contenu sur l’appareil.
Il ne détaille pas les deux classes, la revisite du dé, le nouveau départ,
la préservation des autres histoires ou la reprise après extinction hors
ligne ; ces contrôles ne sont pas considérés comme explicitement confirmés.

Deux améliorations de conception sont demandées : retrouver une expérience
de graphe comparable à celle de Story Studio, et identifier les dossiers
générés par le titre de l’histoire plutôt que par le seul UUID.
