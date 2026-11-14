# Édition visuelle des aventures FLAM

Portée : [ticket 02](issues/02-edition-scenes-regles.md). Base : `c58b7bc`.

## Réalisation

L’accueil propose « Aventure FLAM », avec un projet vide ou un exemple original
modifiable. Chaque création reçoit une nouvelle identité d’aventure et une
session de travail ordinaire. La sauvegarde suggère le titre courant.

La navigation présente les scènes, classes, objets, événements, récompenses,
jets et choix. Les formulaires permettent de définir le départ, les fins,
les textes, images et narrations, puis les destinations et règles. Les conditions
sont combinées par « toutes » ; chaque règle possède un résumé lisible.
Les récompenses restent uniques par défaut, les choix peuvent être désactivés
avec une explication ou masqués et les plages des jets ciblent des scènes nommées.

Le document reste dans le store commun : les formulaires ne gardent que leur
sélection et la demande de focus. Ajouter ou retirer un choix et son rattachement
forme un seul geste d’historique. Les renommages conservent les identifiants ;
les suppressions référencées sont refusées. Le projet vivant et son époque sont
relus avant toute publication, y compris après une préparation de média ou
une génération vocale. Une scène supprimée n’est pas recréée par un résultat tardif.

Les diagnostics du module sont cliquables : sélection de la définition,
défilement et focus du champ. Ils permettent de corriger les brouillons sans
empêcher leur sauvegarde. Les champs sont nommés pour les lecteurs d’écran,
les contrôles restent natifs et la navigation est accessible au clavier.
Les textes de commandes existent en français, anglais et italien ; l’exemple
reste un contenu d’auteur en français.

## Vérifications

- Tests du document, du store réel, des codecs et de la sauvegarde sur disque
  temporaire conservés. La fixture est devenue la source de l’exemple livré,
  sans changer ses règles ; les tests relisent cette même source.
- Tests d’édition : création vide et exemple, identités indépendantes,
  construction des mécaniques depuis un brouillon, renommage, annulation et
  rétablissement, sauvegarde/relecture, refus de suppression référencée,
  diagnostics et affectations différées périmées.
- Tests d’interaction des vrais formulaires : renommage, destination absente,
  règle de classe, historique, récompense répétable, plages et destinations de
  jet, navigation depuis un diagnostic, médiathèque et changements de langue.
  Seuls les dialogues, transports médias et composants multimédias sont simulés.
- La garde de fermeture commune est exécutée avec un brouillon FLAM modifié :
  elle demande le choix habituel et respecte son annulation.
- Le contrat de transmission de toutes les propriétés d’espace de travail
  a signalé un raccord manquant dans `AppShell`, corrigé puis revérifié.
- Seconde lecture des traductions nouvelles effectuée avec le contexte des
  formulaires ; paramètres et métadonnées vérifiés par le contrôle i18n.
- Suite complète finale : `node --test --test-concurrency=4 scripts/*.test.mjs`,
  8 729 tests, 8 728 réussis et un échec préexistant. Il s’agit de
  `scripts/i18nHomeReview.test.mjs:34`, qui observe deux appels `plugin:log|log`
  en plus des opérations de session attendues. Ce même échec était déjà
  reproduit sur la base du lot 01, comme consigné dans [sa revue](review.md).
  Aucun autre test ne reste en échec.
- `npm run lint`, `npm run check:i18n` (zéro erreur ni avertissement),
  `npm run check:blank-lines`, `npm run build` et `git diff --check` passent.
  Le build conserve l’avertissement de taille de certains chunks.

La génération, le runtime et la validation matérielle restent les tickets
03 à 05. Aucun essai sur appareil ni validation visuelle dans un navigateur
n’est revendiqué pour ce lot.
