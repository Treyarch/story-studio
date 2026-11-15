# Créer visuellement une aventure personnelle pour FLAM

État : trois premiers lots réalisés après la validation matérielle des quatre
prototypes. Le document et son enveloppe sont retenus dans
l’[ADR 0001](../../docs/adr/0001-document-aventure-flam.md). L’édition visuelle
est disponible ; le runtime piloté par le document passe le harnais Lua.
La génération du pack et le transfert restent à implémenter.

## Résultat attendu

L’auteur crée dans Story Studio une courte aventure personnelle sans écrire
de Lua, l’enregistre, la rouvre et génère un contenu jouable sur sa FLAM.
Il peut choisir une classe, obtenir puis consommer un objet, ouvrir un passage
conditionnel et déclencher un jet de dé narratif. Une reprise après extinction
conserve la progression ; recommencer demande une confirmation.

Le [cadrage confirmé](../../docs/flam-custom-stories-design.md) et le
[glossaire](../../GLOSSARY.md) restent la référence fonctionnelle. La validation
des classes est consignée dans [le jalon précédent](../flam-classes/validation.md).

## Constats dans le dépôt

- `src/store/projectModel/envelope.js` accepte les modes Libre et Avancé.
  `codec.js` et `src/store/projectWorkState.js` aiguillent lecture, sauvegarde
  et mutations selon ce mode. Ajouter un champ au normaliseur Libre ne suffit
  pas à conserver un document FLAM.
- Le document Avancé, son simulateur et son export dans
  `src-tauri/src/native_pack/` représentent des packs à index. Le mot « natif »
  ne signifie pas ici qu’ils exécutent les scripts Lua FLAM.
- `scripts/prototypes/flam-native/scenes.lua` décrit le contenu, mais
  `passage.lua` connaît encore les champs `keys`, `class`, `door` et `roll`.
  L’inventaire, l’application des effets et la validation de sauvegarde ne
  deviennent pas génériques en remplaçant seulement les textes des scènes.
- `prototype.py` construit une aventure d’identité et de ressources fixes.
  Son installateur et ses tests apportent des protections à conserver, pas
  encore un exporteur général pour les projets de l’utilisateur.

## Parcours d’auteur proposé

1. Depuis l’accueil, choisir « Aventure FLAM ». Un exemple original modifiable
   permet de découvrir le parcours ; un projet vide reste possible.
2. Définir les classes, objets et événements mémorisés dans l’aventure.
3. Créer des scènes, choisir le départ et marquer explicitement les fins.
   Chaque scène possède un titre, un texte, une image facultative et au plus
   une narration. Le texte écrit n’est pas automatiquement une piste audio.
4. Relier des choix à leurs scènes de destination. Configurer leurs conditions
   et leurs effets par des formulaires. Un résumé lisible accompagne chaque
   règle, par exemple « Posséder au moins une clé → retirer une clé et mémoriser
   porte ouverte ».
5. Pour un jet, répartir les valeurs de 1 à 20 entre des péripéties nommées.
   Le joueur déclenche le tirage ; l’auteur ne choisit pas sa valeur en partie.
6. Enregistrer, fermer et rouvrir le projet. Les règles, médias et identifiants
   restent identiques. Annuler et rétablir couvrent aussi les changements de règles.
7. Vérifier les diagnostics, générer le contenu, puis l’installer sur la FLAM
   avec les protections de transfert et effectuer le parcours matériel.

## Document et règles

Le document d’auteur contient des définitions identifiées : scènes, choix,
classes, objets, événements, récompenses et jets. Les noms sont modifiables
sans casser les références. L’état de partie contient leurs valeurs courantes,
la scène à reprendre, les récompenses obtenues et les résultats des jets.
Il ne fait pas partie du fichier de projet de l’auteur.

La première version propose des conditions simples combinées par « toutes » :
classe choisie, quantité minimale d’un objet, événement présent ou absent.
Les effets permettent de choisir une classe, donner ou consommer une quantité
entière positive et mémoriser un événement. Une récompense possède une identité
distincte du choix qui l’accorde ; elle est unique par partie par défaut.
La répétition est une option explicite. Consommer ne peut pas rendre une
quantité négative ; une action impossible n’applique aucun de ses effets.

Un choix inaccessible est désactivé avec une explication par défaut ; le
masquage reste disponible. Les valeurs d’un jet doivent couvrir exactement
1 à 20, sans trou ni chevauchement, et conduire à des destinations définies.
Le résultat mémorisé est réutilisé lors d’une revisite et d’une reprise.

Les brouillons incomplets doivent pouvoir être enregistrés. La validation de
structure du fichier est distincte des diagnostics de contenu qui bloquent
la génération : référence absente, départ manquant, plage de dé incorrecte,
effet invalide ou scène manifestement sans sortie hors fin explicite.

L’éditeur signale aussi les scènes dont les seules sorties sont conditionnelles
et demandent une vérification de parcours. Ce signalement ne constitue pas
une preuve exhaustive d’absence d’impasse pour tous les états possibles.

## Articulation

Retenir un document d’aventure FLAM distinct du graphe à index, tout en
réutilisant le cycle de projet, la médiathèque et les conventions d’interface
de Story Studio. L’étendre dans le graphe actuel obligerait à lui ajouter des
règles que son runtime ne sait pas exécuter ; un éditeur externe séparé
dupliquerait sauvegarde, médias et gestion des modifications non enregistrées.

Le premier ticket a retenu une enveloppe `.mbah` de schéma 5, en mode `flam`,
portant un document structuré de version 1. Les fichiers Libre et Avancé
conservent leurs versions existantes. Le raccord passe par les lecteurs de
fichiers, reprises de session, signatures de travail et historique ordinaires.
Les justifications et identités distinctes sont consignées dans l’ADR 0001.

Le module de document expose les opérations de création, lecture/écriture,
modification et diagnostic. Il porte les invariants de référence et produit
des diagnostics localisés. Les formulaires ne réimplémentent pas ces règles.

Le module de génération reçoit un document validé et ses médias, et produit
un contenu FLAM contrôlé ou un refus explicite. Il garde en interne le runtime,
le format Lua et le manifeste. Le module de transfert reçoit uniquement ce
contenu contrôlé ; l’interface d’auteur n’écrit pas directement sur l’appareil.

Le runtime généré reprend les acquis audio et de persistance des prototypes.
Une transition calcule un état candidat, vérifie les conditions et l’ensemble
des effets, sauvegarde puis présente la conséquence. Un refus d’écriture
conserve l’état précédent ; une écriture incertaine exige la réconciliation.
Réécouter une narration ne rejoue aucun effet. La sauvegarde porte l’identité
et une révision compatible de l’aventure : une incompatibilité est signalée,
sans réinitialisation silencieuse. La migration des parties reste hors périmètre.

## Découpage et ordre

1. [Document d’aventure et sauvegarde](issues/01-document-aventure.md).
2. [Édition visuelle des scènes et règles](issues/02-edition-scenes-regles.md).
3. [Runtime FLAM piloté par le document](issues/03-runtime-document.md).
4. [Génération et installation contrôlées](issues/04-generation-installation.md).
5. [Validation du parcours complet sur FLAM](issues/05-validation-appareil.md).

Les tickets 01 et 02 sont livrés : le document est sauvegardable et éditable
visuellement dans le cycle de projet existant, avec création vide ou exemple.
Le ticket 03 ajoute le runtime générique et ses données Lua générées, vérifiés
sur hôte simulé, selon la [validation du lot 03](validation-03.md).
Ces lots ne permettent pas encore de jouer sur appareil. Le jalon complet ne sera
terminé qu’au ticket 05.

## Acceptation du jalon complet

Créer l’exemple depuis l’interface, sans retoucher de JSON ni de Lua. Enregistrer
et rouvrir, modifier le nom d’un objet sans perdre ses règles, puis générer et
installer. Sur FLAM : choisir chaque classe dans deux parties, récupérer une
clé unique, consulter l’inventaire, ouvrir une porte en consommant la clé,
lancer un dé, terminer et reprendre après extinction. Le résultat du dé ne
change pas ; coffre vidé et porte ouverte restent mémorisés. Recommencer
rétablit l’état initial de cette seule aventure. Refaire la reprise hors ligne.

Le harnais Lua exécute le contenu généré et son vrai runtime, avec seulement
les capacités hôtes simulées. Il couvre les refus et incertitudes de stockage,
les callbacks audio périmés et les cycles de réouverture déjà rencontrés.
Les contrôles de transfert vérifient refus de remplacement, annulation et
préservation des autres histoires. La preuve matérielle est consignée séparément.

Les régressions ciblées couvrent les projets Libre et Avancé : ouverture,
sauvegarde, reprise de session, annulation et export. Les textes d’interface
suivent le système de traduction du dépôt.

## Hors périmètre

Combat, statistiques, points de vie, score, programmation Lua par l’auteur,
éditeur universel de scripts, synchronisation, plusieurs parties par aventure,
migration des anciennes sauvegardes, modification des prototypes validés,
conversion automatique de projets Lunii ou de contenus commerciaux,
preuve exhaustive de tous les états et mise à jour d’une aventure déjà jouée.

Le simulateur FLAM dans l’application pourra réutiliser le runtime lorsqu’une
exécution fidèle sera disponible ; ne pas livrer comme preuve de jeu un
second moteur JavaScript dont les règles divergent du contenu exporté.
