# Validation matérielle du parcours visuel

État : parcours matériel guidé validé par l’utilisateur le 16 novembre 2026
sur FLAM `2.4.1-d5186dc0`. Ticket 05 résolu, avec les limites ci-dessous.

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

## Résultats consolidés

- Projet de référence local : `exports/flam-editeur-visuel/les-compagnons.mbah`.
- Identité installée : `bf629aa5-ccb3-4328-8dda-f3d20d29c5cf` ; `saveVersion: 1`.
- Copie pour revisite du dé : `exports/flam-editeur-visuel/les-compagnons-validation-de.mbah`,
  identité `5e6c46f3-4baa-47b7-894b-2fd115b7b5da`, `saveVersion: 1`.
- Génération et installation depuis l'éditeur : confirmées pour les parcours guidés.
- Inventaire, classe et récompense unique après extinction : confirmés.
- Consommation de clé, porte ouverte et coffre vide après extinction : confirmés.
- Conditions des deux classes, fins et nouveau départ : confirmés.
- Péripétie du dé conservée après revisite, puis extinction et reprise : confirmée.
- Lecture et reprise d'une autre histoire : confirmées, sans identité relevée.
- Limites : renommage et réouverture du projet non détaillés ; retour par la
  bibliothèque non isolé dans le test ; prototypes non revérifiés individuellement ;
  ergonomie physique non évaluée séparément. Aucune narration dans ces projets :
  l'audio de cette aventure n'est pas validé par ce parcours.
- Le refus d'installation provenait du dossier sélectionné, sans défaut du
  montage en écriture constaté ni correction du code.

Le [ticket 05](issues/05-validation-appareil.md) est `resolved` après les
confirmations matérielles de l'utilisateur, en complément des tests locaux.
Les sections suivantes conservent la chronologie des essais.

## Reprise de validation du 16 novembre 2026

- Révision contrôlée : `8ea354d` ; arbre de travail initial propre.
- `node --test scripts/flam*.test.mjs` : 43 tests réussis, aucun échec,
  dont l'exécution du vrai runtime Lua avec et sans narration.
- FLAM connectée sur `/run/media/mathieu/FLAM` ; firmware lu dans `.mdf` :
  `2.4.1-d5186dc0`. Inspection en lecture seule, sans installation.
- Le reçu local `flam-installations/2507839d-84c2-46a2-b13a-158f7b7e6d73/installation.json`
  concerne « Les compagnons du village », identité
  `bf629aa5-ccb3-4328-8dda-f3d20d29c5cf`. Aucun dossier correspondant
  n'est présent sur le volume connecté ; ce reçu ne prouve donc pas
  l'installation actuelle de l'aventure à tester.
- Le projet local `exports/flam-editeur-visuel/les-compagnons.mbah` est
  un exemple sans narration, dont les deux résultats du dé mènent directement
  à des fins. Pour tester une revisite du dé, préparer les retours décrits
  au point 2 du parcours avant de générer et d'installer depuis l'interface.
- Prochaine action humaine : ouvrir l'aventure dans Story Studio, préparer
  le parcours, enregistrer/rouvrir, générer puis installer. Les essais physiques
  et leur résultat restent en attente ; le ticket n'est pas clôturé.

### Installation confirmée le 16 novembre

Après sélection du volume FLAM dans le dialogue d'installation, l'utilisateur
confirme : « ca a marché correctement ». Le refus venait du choix du dossier,
sans correction du code ni modification du montage.
Le nouveau reçu local est
`flam-installations/3cc5f12b-7e09-4a90-8569-8a804703236b/installation.json`,
pour « Les compagnons du village », identité
`bf629aa5-ccb3-4328-8dda-f3d20d29c5cf`.
L'installation est confirmée ; le parcours physique et la reprise après
extinction restent à vérifier.

### Persistance confirmée par l'utilisateur le 16 novembre

Après le parcours demandé avec Pisteur, acquisition de la clé, consultation
de l'inventaire, extinction complète et reprise, l'utilisateur confirme :
« verifications faites, tout est bon ». Classe et clé sont conservées et le
coffre ne donne pas de seconde clé.

Après ouverture de la porte en consommant la clé, vérification d'une quantité
nulle, nouvelle extinction complète et reprise, il confirme :
« tout est bon aussi ». La porte reste ouverte et le coffre vide.

Ces deux parcours matériels sont validés.

L'utilisateur confirme ensuite « oui tout est bon » après le parcours des
deux classes : avec Pisteur, « Lire les traces » accessible et « Parler au
renard » masqué ; jet et fin ; nouveau départ confirmé avec Ami des animaux,
inventaire sans clé, porte fermée et coffre disponible ; « Lire les traces »
désactivé avec explication, « Parler au renard » accessible et fin atteinte.
Les choix de classe, les fins et la remise à zéro de la partie sont validés.

La conservation du résultat du dé après revisite et extinction et le
fonctionnement des autres histoires restent à vérifier explicitement.

### Autre histoire et préparation de la revisite du dé

L'utilisateur confirme ensuite : « une autre histoire est ok » après la
demande de vérifier sa lecture et sa reprise. Ce contrôle est validé pour
l'histoire essayée ; il ne constitue pas une vérification de chaque histoire
ou prototype présent.

Le parcours installé mène directement à une fin après le dé, sans retour.
La copie `exports/flam-editeur-visuel/les-compagnons-validation-de.mbah`
ajoute donc une scène par péripétie, avec retour vers « La rencontre » ou
sortie vers la fin d'origine. Identité indépendante :
`5e6c46f3-4baa-47b7-894b-2fd115b7b5da`. Le projet d'origine est préservé.
Absence d'erreur bloquante, aller-retour du codec et retour de chaque
péripétie vers la rencontre vérifiés. Génération, installation et essai
physique de cette copie restent à effectuer.

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

### Conservation du dé confirmée et clôture

Après le parcours demandé sur la copie dédiée (retour à « La rencontre »,
nouveau tirage, puis retour, extinction complète, reprise et nouveau tirage),
l'utilisateur confirme « oui c'ets bon ». La péripétie est conservée dans les
deux cas. Reçu local :
`flam-installations/ba68f834-7a0b-4a5f-9a38-50cc24e57591/installation.json`,
identité `5e6c46f3-4baa-47b7-894b-2fd115b7b5da`.
Le parcours matériel guidé est terminé ; les limites figurent au bilan consolidé.
