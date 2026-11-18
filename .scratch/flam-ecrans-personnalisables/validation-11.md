# Validation du ticket 11 — Démonstration complète

Préparation locale du 17 novembre 2026, installation sur FLAM le 18 novembre.
**Ticket non terminé : parcours de lecture sur appareil non exécuté.**
La démonstration est installée et relue sur la FLAM, firmware **2.4.1-d5186dc0**.
Les observations de rendu, de commandes et de lecture restent à recueillir.

## Livrables

La démonstration originale **L’atelier des lucioles** est ouvrable et modifiable
dans l’éditeur :

- [Projet `.mbah`](../../exports/flam-ecrans-personnalisables/atelier-des-lucioles/L’atelier%20des%20lucioles.mbah).
- [Livraison portable ZIP](../../exports/flam-ecrans-personnalisables/atelier-des-lucioles-portable.zip) :
  projet, médias, pack, guide et protocole matériel.
- [Guide d’usage](../../docs/flam-ecrans-guide.md).
- [Parcours matériel à compléter](demo/parcours-materiel.md).

L’aventure contient six scènes, un jet, deux classes narratives, six objets,
un Menu principal mixte et un sous-menu, deux Grilles, une Fiche type d’objet,
une Fiche partagée avec audio, un carnet pleine image et une Fiche personnage.
Les 20 médias comprennent 12 illustrations géométriques originales et huit
narrations françaises produites localement avec Piper et `fr_FR-siwis-medium`.
Les photos officielles ne sont jamais intégrées aux médias.

Le projet a été sauvegardé et rouvert par `projectIO`, avec 44 références médias
retrouvées et 15 positions de graphe. Tout, Récit, Consultation et le rangement
ont été appliqués sans changer son document joué. L’archive portable a été
extraite ailleurs : les 20 fichiers médias et les 15 positions y sont à nouveau
retrouvés, avec document identique à la définition de démonstration.

Deux avertissements `CONDITIONAL_EXITS` sont attendus : la cour se poursuit par
la commande du Menu et les talents filtrent les choix de l’atelier. Aucun
diagnostic bloquant. Le guide décrit ces chemins.

## Pack réellement généré

- Aventure : `4f67c0b8-d1c9-4d51-9a46-9d290de13f11`, version de partie 1.
- Dossier : `pack-production/L_atelier_des_lucioles--4f67c0b8-d1c9-4d51-9a46-9d290de13f11.flam` dans la livraison.
- Archive : `adventure.plain.pk`, 4,815,015 octets, 62 fichiers internes.
- SHA-256 archive : `5a8033f20f713e9642081f7f9a6595e8b0e1517554cc2db5d5f65cf3fce1e773`.
- SHA-256 manifeste : `2070e9a3b5478620190dc57dd19e65e1b16fa3b2cddc668b593f8a373fd2720a`.
- SHA-256 ZIP portable : `0671e70621bebe5500801c86e4aad7b957c60b50d51bf025ea6ffbb0dea016c2`.
- Firmware lu sur le volume physique : **2.4.1-d5186dc0**, le 18 novembre 2026.

Le service Rust de production a préparé les vraies images et narrations du
projet rouvert, généré le pack, puis `read_pack` a revalidé son contenu. Le pack
a ensuite été extrait et exécuté dans le harnais commun. Le pilote local de
génération a été retiré du module de tests après exécution ; aucune commande
locale de génération ou d’installation n’est ajoutée à l’application.

## Parcours locaux exécutés

Le même parcours du vrai lecteur est exécuté depuis les données JavaScript,
depuis le pack natif de régression et depuis le pack livré avec ses vrais médias.
Il vérifie :

- images du Menu selon la sélection, sans déclencher de lecture ni transition ;
- inventaire vide, acquisition unique de six objets, Grille 2 × 2, deuxième
  page et ouverture de la bonne Fiche, retour à la même page ;
- Fiche descriptive partagée depuis plusieurs chemins, texte long jusqu’à la
  dernière phrase, lecture audio explicite, fin naturelle et arrêt à la sortie ;
- événement audio périmé ignoré après sortie et après reprise de narration ;
- carnet sans titre, image dans tout le contenu et bascule vers la description ;
- Fiche personnage filtrée pour chacune des deux classes, découverte révélée
  après ouverture de l’atelier, texte long accessible ;
- entrées de collection masquées et verrouillées, déverrouillage et pagination ;
- commande narrative consommant la clé, changeant la scène et devenant ensuite
  indisponible ; souvenir de clé conservé sans sa possession ;
- dépôt des cinq objets restants, inventaire vide à nouveau, souvenirs conservés ;
- reprise de la scène narrative depuis son début, sans effets rejoués ;
- jet déclenché seulement par le récit, fin et résultat conservés après réouverture.

Les consultations comparent tous les champs de partie et les nombres de
sauvegardes, lectures et tirages. L’audio explicitement demandé est distingué
d’une lecture automatique. Les positions, couleurs et sources images sont
observées dans le harnais LVGL, avec assertions complémentaires d’aperçu pour
tous les gabarits. Les médias et la disposition ne sont pas validés sur écran
physique par ces observations.

## Contrôles exécutés

- `node --test scripts/flam*.test.mjs` : **86 tests réussis**.
- `cargo test --manifest-path src-tauri/Cargo.toml services::flam_pack::tests --lib` :
  **27 tests réussis**.
- Génération locale avec les vrais médias : **1 contrôle natif réussi**.
- Projet rouvert compilé en JavaScript et pack livré extrait : parcours combiné réussi.
- ZIP extrait dans un autre dossier : réouverture et médias réussis.
- ESLint ciblé FLAM : réussi.
- `npm run check:i18n` : zéro erreur, zéro avertissement.
- `npm run build` : réussi, avertissement habituel de taille des bundles.
- `git diff --check` : réussi.

Les preuves locales sont conservées dans [demo/](demo/) : `reouverture.json`,
`pack.json`, `parcours-javascript.log`, `parcours-pack.log`, `portabilite.log`.
`generation-medias.json` dans la livraison identifie la voix et les empreintes
des audios. La définition reproductible est `scripts/flamDemoFixture.mjs`.

## Validation physique restante

Les 22 étapes du [protocole matériel](demo/parcours-materiel.md) restent toutes
**non exécutées**. Elles couvrent les compositions et la comparaison aux onze
photos, couleurs, lisibilité, sélection, commandes, défilement, pagination,
audio, retours, reprise et conservation de partie. Le firmware et le reçu
d’installation sont renseignés ci-dessous ; les observations et les écarts
restent à recueillir sur l’appareil.

Le ticket 11 passe à `ready-for-human` pour cette étape matérielle, avec ses
critères physiques non cochés. Le ticket parent reste ouvert. Aucun résultat
sur appareil n’est déduit de la réussite des contrôles locaux.

## Installation matérielle du 18 novembre 2026

La FLAM était montée sur `/run/media/mathieu/FLAM`. Le firmware a été lu
dans ses métadonnées : **2.4.1-d5186dc0**. L’identité de démonstration était
absente des dossiers et listes visibles ou masqués ; les empreintes du pack
correspondaient aux valeurs ci-dessus.

Le service d’installation de production a réussi ses étapes copie, vérification,
inscription et relecture. Une vérification supplémentaire compare les **62
fichiers installés** aux empreintes du reçu. La liste antérieure est conservée
avec la seule addition de l’identité de démonstration ; la liste masquée
éventuelle est inchangée. Aucune histoire existante n’a été remplacée.

Reçu : `/home/mathieu/.local/share/com.hugs11.story-studio/flam-installations/71d4a6e9-16ee-4944-92c1-2d1dee47c24a/installation.json`.
Preuve synthétique sans clés : [installation-verifiee.json](demo/installation-verifiee.json).

Le pilote local temporaire a été retiré après exécution. Ce succès valide le
transfert et sa relecture sur le volume physique ; le lancement de l’aventure,
le rendu, les boutons et l’audio restent **non observés**. Aucun des 22
parcours de lecture n’est coché sur cette seule base.
