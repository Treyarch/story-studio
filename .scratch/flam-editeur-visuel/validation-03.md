# Validation du lot 03 : runtime piloté par le document

Le runtime indépendant `src/flamRuntime/lua/` exécute les définitions du
document. `compileAdventureData` produit le module de données Lua depuis le
vrai validateur du lot 01. Les prototypes matériels ne sont pas modifiés.
L’interface du module et le format de partie sont décrits dans son
[README](../../src/flamRuntime/README.md).

## Résultats locaux

- `node --test scripts/flamAdventure.test.mjs scripts/flamAdventurePersistence.test.mjs scripts/flamEditing.test.mjs scripts/flamEditorInteraction.test.mjs scripts/flamRuntime.test.mjs` : 15 tests réussis.
- `lua scripts/prototypes/flam-native/check-runtime.lua` : parcours des prototypes réussis.
- `npx eslint src/flamRuntime/compile.js scripts/flamRuntime.test.mjs` : réussi.
- `luac -p`, séparément pour chaque fichier de `src/flamRuntime/lua/` et pour `scripts/check-flam-runtime.lua` : réussi.
- `git diff --check` : réussi.

Le nouveau harnais exécute le vrai point d’entrée `main.lua`, le rendu, les
règles, le stockage et le module de données effectivement généré. Seul l’hôte
est simulé. Deux parcours complets, avec et sans narration, couvrent :

- les deux classes, leurs noms dans l’inventaire, les choix désactivés avec
  explication et masqués, y compris après restauration ;
- la récompense unique partagée par deux choix, la récompense répétable,
  l’acquisition, la consommation et le rejet de tous les effets d’une
  transaction impossible ;
- les vingt résultats, leurs deux péripéties, les revisites, deux jets
  indépendants, les propositions conservées après refus/annulation/relecture,
  et le nouveau départ qui autorise de nouveaux tirages ;
- la sauvegarde avant conséquence, le refus initial, la nouvelle tentative,
  l’écriture sans effet, l’exception après écriture, les deux issues d’une
  écriture incertaine, la valeur tierce invalide et le retour bibliothèque ;
- les sauvegardes incomplètes, étrangères, incompatibles, aux valeurs invalides
  ou illisibles, sans réinitialisation silencieuse ;
- la fin explicite, la confirmation et l’annulation du nouveau départ,
  la réouverture du même module et la nouvelle instance conservant le stockage ;
- les chemins audio de scène, le chargement refusé, l’arrêt synchrone pendant
  le chargement, le démarrage absent, l’arrêt prématuré, les callbacks périmés,
  la durée indisponible, le lecteur bloqué et la poursuite sans audio ;
- les identifiants et textes UTF-8, guillemets, antislashs, sauts de ligne et
  octet nul sérialisés sans interprétation comme code Lua.

## Limites et suite

Le lot ne produit pas encore de pack installable et ne prépare pas les médias.
La génération complète et le transfert sont le ticket 04. Aucun essai matériel
ni contrôle visuel sur l’écran FLAM n’est revendiqué : la reprise après
extinction et le parcours complet sur l’appareil restent le ticket 05.

Les projets Libre et Avancé ne changent pas : le nouveau module est isolé et
ne branche pas encore la commande de génération. Les tests ciblés du cycle
de projet des lots précédents passent ; aucune suite globale n’est revendiquée.
