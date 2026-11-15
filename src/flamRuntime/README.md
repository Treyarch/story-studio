# Runtime d’aventure FLAM

Le lot 03 exécute le document d’auteur de version 1, séparément des prototypes
validés dans `scripts/prototypes/flam-native/`. Le contenu Lua est testé sur un
hôte simulé. Le lot 04 ajoute la génération et le transfert depuis l’éditeur ;
la validation matérielle du parcours reste le lot 05. Aucun second moteur de règles JavaScript n’est introduit.

## Frontière de génération

`compileAdventureData(document)` vérifie la structure et les diagnostics du
module de document. Une erreur de contenu refuse la génération avec les
diagnostics localisés dans `error.diagnostics`. Les avertissements n’empêchent
pas la génération. Le résultat est le texte du module `adventure_data.lua`,
contenant les données de l’auteur ; les chaînes sont encodées en octets UTF-8
échappés pour Lua, sans interpolation de code.

Le service Rust `src-tauri/src/services/flam_pack/` reçoit le document JSON,
revérifie sa structure et ses références et sérialise les données sans recevoir
de code Lua de l’interface. Il embarque les quatre fichiers du vrai runtime.
Les deux sérialiseurs utilisent les mêmes échappements ; le harnais commun
exécute aussi le pack produit par Rust, avec et sans narration.

Le résultat est un dossier `<titre>--<uuid>.flam` contenant `adventure.plain.pk`
et `manifest.json`. Le titre est adapté aux noms de fichiers et limité en
longueur ; l’UUID distingue les aventures de même titre. L’identité est lue
dans le contenu : les anciens dossiers `<uuid>.flam` restent utilisables.
L’archive comporte `main.lua`, les modules sous `script/`,
`info.plain`, `version`, `uuid.bin` et les médias. La narration est convertie
par le FFmpeg embarqué en MP3 stéréo, 44,1 kHz, CBR 128 kb/s, sans tags ni Xing,
avec une table `.mp3map` calculée sur les limites des trames. Les images sont
préparées en JPEG de dimensions maximales 320 × 240. Les noms de ressources
sont produits par le générateur ; aucun chemin de l’auteur ne devient un
chemin d’archive. Le texte seul ne génère aucune narration.

La publication exclusive suit la relecture du manifeste, des empreintes,
des chemins, de l’identité, des médias et des modules. Les sources Lua doivent
correspondre exactement au runtime embarqué et à la sérialisation du document
validé. Un manifeste réécrit ne peut donc pas autoriser un autre script.
La syntaxe de ces sources est contrôlée par leur construction fermée et par
les tests Lua ; aucune installation de `lua` ou `luac` n’est exigée chez l’auteur.
Un dossier de même identité n’est jamais remplacé. Le pack est plafonné à
512 Mio ; une narration convertie est plafonnée à 256 Mio.

Dans l’éditeur, « Générer le pack FLAM » choisit un dossier de sortie.
« Installer sur la FLAM » est une action séparée, disponible seulement pour
le document qui a produit le pack. Le choix du volume monté est confirmé
avant le transfert ; progression et annulation couvrent les deux opérations.

L’installateur `storyteller_device/flam_authoring.rs` recontrôle le pack,
le volume monté et les métadonnées des firmwares 2.4.1 et 2.4.2. Il partage
le verrou de mutation des appareils, refuse les identités présentes dans
les listes ou dossiers visibles et masqués, chiffre les scripts et métadonnées,
écrit dans un dossier temporaire et relit chaque fichier. La publication
exclusive et l’inscription suivent une seconde vérification des listes et
du cache ; une barrière de volume et une relecture finale précèdent le succès.
Les identités des autres histoires et leurs parties ne sont pas modifiées.

La liste, la liste masquée éventuelle, le cache et un reçu sans clés de
chiffrement sont conservés dans les données de l’application sous
`flam-installations/<identifiant-de-transfert>/`. Une annulation restaure
la liste et le cache quand leur état reste reconnaissable. Si la bibliothèque
a changé ou si la restauration est incertaine, l’opération signale un besoin
de récupération et conserve le reçu et le contenu concerné. Aucune réparation
silencieuse ni mise à jour d’une aventure déjà installée n’est proposée.

Limite du runtime du lot 03 conservée : les images sont préparées et livrées,
mais les scènes sont actuellement rendues en texte et choix, sans affichage
de leur illustration. La lecture et la reprise sur l’appareil physique ne
sont pas prouvées par ces contrôles locaux.

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
