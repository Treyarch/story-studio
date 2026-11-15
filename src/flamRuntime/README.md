# Runtime d’aventure FLAM

Le lot 03 exécute le document d’auteur de version 1, séparément des prototypes
validés dans `scripts/prototypes/flam-native/`. Le contenu Lua est testé sur un
hôte simulé ; son installation et sa validation matérielle restent les lots 04
et 05. Aucun second moteur de règles JavaScript n’est introduit.

## Frontière de génération

`compileAdventureData(document)` vérifie la structure et les diagnostics du
module de document. Une erreur de contenu refuse la génération avec les
diagnostics localisés dans `error.diagnostics`. Les avertissements n’empêchent
pas la génération. Le résultat est le texte du module `adventure_data.lua`,
contenant les données de l’auteur ; les chaînes sont encodées en octets UTF-8
échappés pour Lua, sans interpolation de code.

Le futur exporteur doit joindre ce module aux quatre fichiers de `lua/` :
`main.lua` à la racine, puis `passage.lua`, `rules.lua`, `savegame.lua` et
`adventure_data.lua` dans le chemin des modules du firmware. Le compilateur
ne produit pas encore de pack, ne prépare pas les médias et n’effectue aucun
transfert. Les chemins audio doivent être résolus vers les ressources livrées
par ce futur exporteur. Une scène sans narration passe directement aux choix.

## Règles et partie

`rules.lua` indexe les définitions du document. Décrire la scène ne modifie pas
la partie et ne tire aucun dé. Une transition vérifie l’appartenance du choix
à la scène, ses conditions, sa récompense et tous ses effets sur une copie.
Un effet impossible rejette l’ensemble. Les quantités restent des entiers
compris entre zéro et le plus grand entier sûr du document JavaScript.
Une classe déjà choisie peut être réaffirmée mais ne peut plus être remplacée
avant un nouveau départ.

Les récompenses et les jets sont mémorisés par identité, indépendamment des
choix qui les déclenchent. Une récompense déjà obtenue désactive ou masque
le choix, sauf si elle est répétable. Un jet existant choisit de nouveau la
même destination sans tirage. L’inventaire affiche les noms de l’auteur et
les quantités ; les listes de choix défilent par groupes de trois lignes.
Les fins explicites ne proposent plus de choix narratifs.

L’état de partie est plat, afin de conserver la forme éprouvée du stockage :
`schema: 1`, `adventureId`, `saveVersion`, `sceneId`, `classId` (vide avant
sélection), puis `item:<id>`, `event:<id>`, `reward:<id>` et `roll:<id>`.
Les événements et récompenses valent zéro ou un, les jets zéro avant tirage
puis un à vingt. Les champs manquants, inconnus ou invalides, les identités
étrangères et les versions incompatibles sont refusés sans réécriture.
Il n’y a pas de migration ni de preuve exhaustive de l’accessibilité des états.

## Persistance et cycle hôte

Le seul adaptateur de stockage utilise `progression.load/save("partie")`,
dans l’espace de l’aventure isolé par le firmware. Chaque candidat est écrit
et relu avant toute conséquence affichée ou narration. Un refus confirmé garde
l’état précédent ; réessayer réévalue le choix. Une relecture incertaine impose
la réconciliation, sans fausse annulation. Le retour bibliothèque garde cette
protection active, même si le firmware reprend le même module sans `setup`.

Les résultats proposés restent en mémoire par identité pendant les refus,
annulations et réconciliations du même module. Une nouvelle instance retrouve
les résultats effectivement sauvegardés ; un tirage jamais persisté ne peut
pas être garanti après destruction du module. Un nouveau départ confirmé
efface les propositions et remplace seulement la partie de cette aventure.

Le cycle audio conserve les protections des prototypes : attente de l’arrêt,
refus des événements synchrones de chargement, durée vérifiée, lecture trop
courte signalée, délai de démarrage et identifiant de lecture contre les
callbacks périmés. Le joueur peut continuer sans audio après une erreur.
Réécouter ou consulter l’inventaire n’applique aucun effet.

## Contrôles

```sh
node --test scripts/flamRuntime.test.mjs
lua scripts/prototypes/flam-native/check-runtime.lua
```

Le test Node génère réellement les données depuis le document et copie le vrai
runtime dans un dossier temporaire. `scripts/check-flam-runtime.lua` utilise
la même frontière hôte que le harnais des prototypes : LVGL, audio, progression,
bibliothèque et hasard contrôlé. Il pilote `main.lua`/`setup` par les commandes
du joueur et observe les écrans et le stockage. Les règles ne sont pas simulées.

La fixture enrichit l’exemple avec d’autres identités, une récompense répétable,
une transaction impossible, un deuxième jet et des revisites. Les parcours
passent avec et sans narration. Les tests ne constituent pas une preuve de
reprise après extinction sur FLAM, ni une vérification de disposition sur son
écran physique. La relecture de stockage ne prouve pas non plus une résistance
à une coupure arbitraire pendant l’écriture flash.
