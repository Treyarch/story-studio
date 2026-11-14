Status: resolved

# Valider les classes narratives et leur reprise sur FLAM

## Objectif

Après l’inventaire et le dé validés sur la FLAM 2.4.1 de l’utilisateur,
valider le choix d’une classe narrative et ses possibilités particulières.
Ce jalon prolonge le [cadrage confirmé](../../docs/flam-custom-stories-design.md)
avant l’intégration à l’éditeur visuel.

## Parcours

**Les compagnons des lucioles** propose Pisteur ou Ami des animaux au départ.
Le coffre, la clé consommée, la porte et le dé narratif restent présents.
Après la porte, le Pisteur peut lire les traces et l’Ami des animaux parler
au renard. Le choix de l’autre classe est désactivé avec une explication.
Chaque classe dispose d’un chemin accessible vers le dé et la fin.
Une narration propre rend perceptible la conséquence de chaque chemin.

La classe figure dans l’inventaire et est conservée à la revisite, au retour
bibliothèque et après extinction. Seul « Recommencer », explicitement confirmé,
rouvre le choix de classe et remet la progression à zéro.

## Réalisation

- Nouvelle identité et schéma de sauvegarde trois : aucune migration ou
  modification des trois prototypes et de leurs parties validés sur appareil.
- Classe et scène sauvegardées ensemble avant de présenter la conséquence.
  Un refus conserve le choix initial ; une écriture incertaine impose la
  réconciliation existante.
- Validation stricte de la classe restaurée : une valeur absente ou inconnue
  hors sélection initiale est signalée comme sauvegarde illisible.
- Contenu et conditions dans le module de scènes existant. Aucun nouveau
  framework, service de stockage ou format de projet de production.
- Narrations et modules listés explicitement dans le pack et son contrôle.
- Le constructeur accepte le Piper embarqué en C++ (stdin) et le CLI Python
  utilisé précédemment (fichier d’entrée).

## Vérifications

Même point d’entrée que les jalons précédents : vrai runtime dans le harnais
Lua ; seuls affichage, audio, commandes, hasard et stockage sont simulés.
Couvrir les deux classes jusqu’à la fin, refus d’écriture au choix, choix
inaccessible sans effet, reprise du même module et d’une nouvelle instance,
retour au choix de classe après nouveau départ et changement de classe.
Préserver les contrôles inventaire/dé/audio, les tests Python de transfert,
les vérifications de syntaxe, du pack et du décodage de toutes les narrations.

La preuve matérielle reste obligatoire : noter la classe choisie, quitter,
éteindre complètement puis reprendre, vérifier la classe et son choix propre,
finir, puis recommencer avec l’autre classe. Les résultats locaux ne prouvent
pas la conservation sur l’appareil.

## Hors périmètre

Éditeur visuel, statistiques, combat, score, nouvelles règles de dés,
plusieurs personnages ou parties, migration des anciennes sauvegardes,
transferts de production et modification des histoires existantes.

## Résultat

Validation matérielle confirmée par l’utilisateur après le parcours demandé :
« ca marche tres bien, parfait ». Jalon résolu sur sa FLAM 2.4.1.
