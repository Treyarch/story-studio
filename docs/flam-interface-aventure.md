# Menu illustré et rubriques des aventures FLAM

Dans l’inspecteur d’une aventure FLAM, ouvrir **Présentation de l’aventure**,
puis **Configurer le menu illustré**. Les projets existants conservent leur
lecteur simple jusqu’à cette activation. Le graphe reste le scénario ; son
rangement automatique se lit désormais de gauche à droite.

## Configurer le contenu

- **Rubriques du menu** : renommer, déplacer, masquer ou supprimer une rubrique,
  lui associer une image et choisir son type. Les types proposés sont chapitres,
  fiche personnage, inventaire et collection de contenus (carnet ou souvenirs).
- **Fiche personnage, carnet et souvenirs** : ajouter des entrées avec texte,
  image, audio facultatif et conditions. Une entrée verrouillée est masquée ou
  présentée comme indisponible. Utiliser un événement acquis pour conserver une
  découverte après consommation d’un objet ; une condition de possession reste
  liée à la quantité actuelle de cet objet.
- **Objets** : dans leurs réglages habituels, ajouter une description, une image
  et éventuellement un audio. L’inventaire affiche uniquement les quantités
  positives ; sa consultation ne consomme rien.
- **Chapitres écoutés** : définir des chapitres, puis ajouter et ordonner leurs
  scènes. Les conditions des passages permettent de distinguer des branches
  exclusives. Une visite commence le chapitre ; la fin normale et sauvegardée
  d’une piste autorise sa réécoute si celle-ci est permise. Un passage sans audio
  est découvert lors de l’arrivée narrative, sans être compté comme une écoute.
- **Progression** : définir un objectif positif et des jalons conditionnels.
  Chaque jalon est mémorisé une fois. Pour deux branches exclusives, prévoir
  deux jalons alternatifs et un objectif correspondant au nombre de jalons
  d’un parcours complet, plutôt qu’au total de toutes les branches.

Une présentation nouvellement activée est un brouillon : ajouter au moins un
jalon conditionnel pour pouvoir la générer. Les diagnostics ouvrent les champs
à corriger, y compris dans les rubriques repliées. Toutes ces modifications
passent par l’historique et la sauvegarde du projet.

## Parcours sur FLAM

Le menu montre Commencer ou Reprendre, le pourcentage et une barre de progression,
puis les rubriques activées. Recommencer demande confirmation. Bibliothèque
quitte l’aventure. La molette parcourt les choix ; les listes sont paginées par
triades, avec illustration de sélection et vignettes de consultation.

Le bouton Retour revient à la rubrique précédente, puis au menu. Pendant une
narration, il ouvre le menu sans modifier la scène à reprendre. Pendant une
réécoute, il arrête cette lecture et revient à sa fiche. Reprendre relit le
début de la scène en cours ; la position audio exacte n’est pas conservée.
Les textes longs disposent d’une commande **Texte suivant**, qui revient à la
première page après la dernière. Les intitulés longs défilent dans leur ligne.

Consulter une rubrique ou réécouter ne déclenche aucun choix, effet ou jet.
Une erreur audio permet de continuer sans enregistrer une écoute complète.
Un refus de sauvegarde d’écoute propose de réessayer ; une écriture incertaine
impose de relire la partie. Une incompatibilité n’efface jamais la partie.

## Format et vérification

Le document de version 1 accepte un bloc de présentation optionnel ; son absence
préserve le contrat des anciens projets. La partie du lecteur illustré utilise
un schéma 2 avec visites, écoutes et jalons, distinct du schéma 1 du lecteur
simple. Aucune migration de partie installée ni remplacement d’aventure existante
n’est introduit. Configurer la présentation avant la première installation.

Les médias de toutes les rubriques suivent le même parcours que ceux des scènes :
relativisation des chemins, déplacement du projet, contrôle et préparation avant
installation. Les images sont converties en LIF natif RGB565 avec alpha, bornées
à 320 × 212 sans agrandissement. Le chargement garde les sources visibles en
mémoire et borne leur nombre à une illustration et trois vignettes.

L’en-tête et les opcodes LIF ainsi que les appels `lv.img_src` ont été vérifiés
contre le [décodeur de référence](https://github.com/scarlaty/flam-player/blob/71385ff7812987e54fe843cd62c952d1246afd89/src/formats/lif_decoder.c)
et ses [bindings Lua](https://github.com/scarlaty/flam-player/blob/71385ff7812987e54fe843cd62c952d1246afd89/src/bindings/lua_lv_obj.c).
L’encodeur local n’utilise que des pixels littéraux ; les sources de ce projet
externe ne sont pas embarquées. Le format et l’affichage restent à confirmer
sur la FLAM réelle avec le nouveau lecteur.

Les tests exécutent le vrai runtime Lua depuis les données générées en JavaScript
et depuis le pack de production Rust. Les contrôles de projet et de formulaires
couvrent aussi l’historique et les médias des rubriques. Voir la
[validation matérielle préparée](../.scratch/flam-interface-aventure/validation.md)
pour les vérifications qui ne peuvent pas être prouvées par le harnais.
