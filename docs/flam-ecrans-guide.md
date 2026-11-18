# Composer les écrans d’une aventure FLAM

Les scènes et les jets racontent l’aventure. Les Menus, Grilles, Fiches et
Fiches personnage permettent de consulter ses contenus. Ils se dessinent dans
le même graphe, tout en gardant des navigations distinctes.

## Distinguer aventure et sélection

Le panneau **Réglages** propose deux onglets dans sa barre de titre :

- **Aventure** : titre de l’aventure, scène de départ, menu principal,
  couleurs générales et **Problèmes de l’aventure**.
- **Sélection** : commandes d’ajout de la catégorie courante, propriétés,
  médias, liens, couleurs propres et suppression de l’élément sélectionné.

L’ouverture d’un projet affiche Aventure. Sélectionner un élément dans le
graphe ou la liste active automatiquement ses propriétés et rouvre le panneau
fermé. Le second onglet porte le type de cet élément : Scène, Menu, Fiche,
Grille, Fiche personnage, Objet, etc. Chaque onglet retrouve son défilement pendant la session,
même après fermeture du panneau. Sans élément disponible, Sélection conserve
les commandes d’ajout et indique qu’aucun élément n’est sélectionné.

Cliquer sur un problème ouvre directement le bon onglet, les groupes repliés
et le champ à corriger. Choisir le Menu principal se fait dans Aventure ;
modifier le contenu de ce Menu se fait dans Sélection.

## Commencer avec la démonstration

Ouvrir `exports/flam-ecrans-personnalisables/atelier-des-lucioles/L’atelier des lucioles.mbah`
dans Story Studio. Conserver les dossiers `images/` et `audio/` à côté du projet.
Cette aventure originale possède tous les gabarits, deux classes narratives,
six objets et un parcours d’environ dix minutes avec les consultations.
Les illustrations géométriques sont originales ; les voix françaises ont
été produites localement avec Piper, voix `fr_FR-siwis-medium`.

On peut modifier ce projet comme une autre aventure FLAM. Les médias déjà
préparés ne doivent pas être remplacés pour simplement essayer les écrans.

## Construire les accès

Ajouter un Menu et le désigner comme Menu principal dans les réglages de
l’aventure. Ajouter une Fiche, une Grille ou une Fiche personnage et relier
la prise d’accès du Menu à sa destination. Plusieurs accès peuvent partager
la même Fiche ; son contenu ne se duplique pas.

Un accès de consultation ouvre un écran sans faire avancer le récit. Pour
faire avancer l’histoire depuis un Menu, ajouter une commande narrative et
configurer ses conditions, effets et destination comme un choix de scène.
Dans la démonstration, Ouvrir l’atelier exige la clé, la consomme et rejoint
la scène de l’atelier. Après utilisation, cette commande devient indisponible.

Retour pendant une narration ouvre le Menu principal et interrompt la lecture.
Retour dans une consultation remonte le chemin emprunté. Reprendre retrouve
la scène conservée et relit sa narration depuis le début, sans rejouer ses effets.

## Choisir la présentation

Dans toutes les scènes, les textes et les options occupent les deux tiers gauches
et le tiers droit reste réservé aux illustrations, même en l’absence d’image.
L’illustration conserve ses proportions, s’agrandit au maximum de cette zone
et se cale en bas, au centre. À son chargement, elle entre depuis la droite en
300 ms. Cette disposition s’applique aussi aux illustrations liées au choix
sélectionné et à l’aperçu de l’éditeur.

Le thème de l’aventure définit fond, texte et sélection. Une scène ou un
écran peut remplacer une ou plusieurs de ces couleurs. L’aperçu du nœud
sélectionné présente sa composition et ses couleurs.

Les scènes et Menus proposent Illustration commune et Selon le choix
sélectionné. Dans le second mode, renseigner les images des choix ou accès.
Un choix sans image utilise l’image commune, si elle existe. Tourner la
molette change la sélection ; seule la validation déclenche le choix.

Les Fiches proposent deux compositions : grande illustration à gauche et
texte à droite, ou Carnet avec image occupant tout l’espace de contenu.
Le titre peut rester vide. Sans image, le texte utilise toute la largeur.
Si un carnet possède aussi du texte, Lire la description et Voir l’illustration
alternent les vues. Les textes longs se lisent avec Texte précédent et Texte
suivant ; l’indicateur donne la position de la fenêtre de lecture.

Un audio de Fiche reste facultatif. Écouter la description le lance
explicitement ; Arrêter la description ou quitter la fiche l’arrête. Sa fin
naturelle conserve la fiche. L’aperçu permet de lire le texte et de voir les
images ; il ne lance pas d’audio.

## Présenter objets et souvenirs

Pour l’inventaire, ajouter une Grille avec source Inventaire, puis une Fiche
avec contenu Objet de l’inventaire. Relier la Grille à cette fiche type.
Chaque objet est décrit une seule fois dans les définitions : nom, texte,
image et audio. Le lecteur reprend directement ces contenus dans sa fiche.
Il montre uniquement les quantités positives, par pages de quatre cases en
2 × 2. Un inventaire vide possède son propre message.

Pour une collection, choisir les entrées de l’auteur comme source de la
Grille. Chaque entrée définit son libellé, son image, sa Fiche et ses conditions.
Une entrée indisponible peut être masquée ou visible mais verrouillée.
Pour garder une découverte après consommation d’un objet, conditionner le
souvenir sur un événement acquis par le récit, plutôt que sur sa possession.

## Présenter le personnage

Ajouter une Fiche personnage, choisir son portrait et écrire sa description
commune. Ajouter des informations et leurs conditions de classe, d’objet ou
d’événement. Toutes les conditions d’une information doivent être satisfaites.
Sans condition, elle reste toujours visible.

L’aperçu d’auteur montre toutes les informations et le signale ; le lecteur
les filtre selon la partie. Les classes décrivent des talents narratifs,
sans statistiques chiffrées ni jauges de personnage.

## Organiser et enregistrer

Tout montre le graphe complet. Récit montre scènes, jets et Menus portant des
commandes narratives. Consultation montre les écrans et leurs accès.
Ces filtres restent locaux à la surface et ne changent pas le document joué.
Les familles de liens peuvent aussi être masquées séparément.

Ranger dispose les éléments visibles de gauche à droite. Les cycles restent
regroupés ; les fiches partagées restent uniques. Les cartes masquées gardent
leurs positions. Le rangement est annulable et ses positions sont enregistrées
avec le projet, comme les contenus, liens, couleurs et médias.

## Générer et essayer

Enregistrer le projet et corriger les diagnostics bloquants. Générer le pack
FLAM choisit un dossier de sortie et prépare les images et audios. Un texte
sans audio ne devient pas automatiquement une narration. Installer sur la
FLAM est une action distincte : choisir puis confirmer le volume de l’appareil.

La démonstration comporte deux avertissements de sorties conditionnelles :
la cour se poursuit par la commande du Menu et les talents filtrent les choix
de l’atelier. Ces chemins font partie du parcours de contrôle.

Le [protocole matériel](../.scratch/flam-ecrans-personnalisables/demo/parcours-materiel.md)
donne les commandes à essayer et les résultats attendus. Un harnais local
réussi ne valide pas la lisibilité, les boutons ou l’audio sur appareil réel.
