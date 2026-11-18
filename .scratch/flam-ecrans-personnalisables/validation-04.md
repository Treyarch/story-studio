# Validation du ticket 04 — Thème, couleurs et aperçu

Réalisation et contrôles locaux du 17 novembre 2026. La validation de qualité
visuelle sur FLAM réelle reste au ticket 11 et n’est pas revendiquée ici.

## Résultat livré

Le thème de l’aventure fournit les couleurs de fond, texte et sélection.
Chaque scène, Menu et Fiche peut remplacer indépendamment ces couleurs.
Un remplacement retiré redevient hérité ; un changement du thème préserve
les autres remplacements. Sélecteur de couleur et saisie `#RRGGBB` sont
proposés dans les formulaires communs.

Les objets optionnels `theme` du document et `colors` des scènes et écrans
portent `background`, `text`, `selection`. La résolution utilise le champ de
l’écran, puis celui du thème, puis le défaut. Une couleur invalide dans un
brouillon produit un diagnostic localisé et bloque la génération. L’aperçu
garde dans ce cas une couleur de repli valide ; il ne masque pas le diagnostic.
Les validations JavaScript et Rust contrôlent le même format et les champs
admis. Aucun état de partie ni changement des règles n’est introduit.

Le graphe affiche un aperçu de l’écran sélectionné : composition 320 × 212,
couleurs résolues, titre, début de texte, image configurée et choix. La
sélection d’un choix dans cet aperçu reste locale à la présentation. La
narration configurée est identifiée sans être lancée. Les cartes des scènes
et écrans reflètent aussi leurs couleurs effectives de fond et de texte.
Les choix dépendent de données d’auteur, sans simuler leurs conditions.

Le lecteur applique le fond au conteneur LVGL, le texte aux libellés et la
sélection au choix pointé. Les changements d’écran, consultations partagées,
retours et reprises rétablissent la palette de destination. Les mêmes styles
sont réutilisés pendant la navigation. Les futurs gabarits adoptent le contrat
commun de couleurs et compléteront leur composition d’aperçu à leur livraison.

## Vérifications exécutées

- `node --test scripts/flam*.test.mjs` : 61 tests réussis.
- `cargo test --manifest-path src-tauri/Cargo.toml services::flam_pack::tests --lib` :
  15 tests réussis, dont pack de production avec thème et rejet natif des
  valeurs invalides.
- `npm run build` : réussi, avec l’avertissement habituel sur la taille de bundles.
- ESLint ciblé sur les modules FLAM et tests modifiés : réussi.
- `npm run check:i18n` : zéro erreur, zéro avertissement.

Le même harnais du vrai lecteur Lua est utilisé depuis le compilateur
JavaScript et depuis le pack de production généré, validé et extrait par Rust.
La fixture `themedScreensFixture` couvre : fond remplacé du menu principal,
fiche au texte remplacé, fiche et sous-menu entièrement hérités, scène au
fond et à la sélection remplacés, et une autre scène héritée.

Les services hôtes simulés enregistrent les couleurs réellement demandées
aux styles et ajoutées aux objets LVGL. Les assertions portent sur le fond
du conteneur, le texte du titre et des lignes, et la couleur du choix pointé,
y compris après mouvement de sélection, consultation, retour, reprise audio
et réouverture du lecteur. Les valeurs attendues sont écrites explicitement
dans le harnais ; celui-ci ne réimplémente pas l’héritage. La partie est
comparée avant et après consultation/reprise.

Les interactions de formulaire vérifient changement du thème, conservation
d’un remplacement, retrait rétablissant l’héritage, annulation/rétablissement,
réouverture, actualisation de l’aperçu et du graphe, affichage d’une image,
sélection d’aperçu sans modification des règles et diagnostic de couleur
invalide. Le test sur disque confirme que thème, remplacements, images et
placements suivent le projet après déplacement.

## Limites

L’aperçu présente une composition d’auteur, avec les polices du poste et le
début des contenus longs. Il ne prédit pas les conditions d’une partie ni
la typographie exacte du firmware. Les compositions avancées et le défilement
spécifique des futures fiches restent dans leurs tickets respectifs.
Les observations d’appels LVGL ne prouvent ni la lisibilité ni la fidélité
visuelle sur écran physique : ces contrôles restent au ticket 11.
