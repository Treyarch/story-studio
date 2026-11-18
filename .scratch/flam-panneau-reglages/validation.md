# Validation du panneau Réglages FLAM

Les trois tickets sont réalisés. La modification de produit reste dans le
panneau Réglages FLAM : le composant d’en-tête partagé, le graphe, la liste,
le lecteur et le format du document ne sont pas modifiés par ce lot.
Le dépôt contenait déjà d’autres travaux en cours, conservés sans réinitialisation.

## Réalisation

- `FlamWorkspace.jsx` répartit les formulaires et diagnostics entre Aventure
  et Sélection et conserve les commandes d’ajout dans leur catégorie.
- `useFlamInspector.js` gère l’onglet, les deux défilements et la localisation
  des corrections. Ce hook vit dans l’atelier, qui reste monté pendant la
  fermeture du panneau et est déjà indexé par projectEpoch dans WorkspaceView.
- Les deux contenus restent montés pendant les bascules. L’attribut hidden
  et son style empêchent le contenu masqué d’être affiché ou parcouru au clavier.
- Les onglets suivent le motif clavier flèches gauche/droite, Début et Fin,
  avec un seul arrêt de tabulation, aria-selected et association aux panneaux.
- Les guides et la conception indiquent la séparation, l’activation automatique
  des propriétés à la sélection et le libellé correspondant au type du nœud.

## Commandes et résultats

### Comportement FLAM et disposition

Commande exécutée avec Chromium for Testing 156.0.8078.4 disponible sur la machine :

```bash
CHROME_BIN=/home/mathieu/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome node --test scripts/flamInspectorMounted.test.mjs scripts/flamInspectorLayout.test.mjs scripts/flamEditorInteraction.test.mjs scripts/flamWorkspacePanels.test.mjs scripts/flamWorkspaceViewState.test.mjs
```

Résultat sur le contenu isolé du commit : **23 tests réussis, aucun échec ni
test ignoré**. La même commande dans le dossier de travail passe aussi le test
supplémentaire des nouvelles scènes, qui appartient à un autre lot et reste
hors de ce commit. La construction et le contrôle i18n ont également été
réexécutés sur le contenu isolé, avec succès.
Sur une autre machine, renseigner CHROME_BIN avec son exécutable Chromium ;
seul le test de géométrie est ignoré si cette variable est absente.

| Parcours | Preuve |
| --- | --- |
| Séparation des champs, diagnostics et ancienne présentation | Tests d’intégration du vrai FlamWorkspace |
| Sélection depuis Aventure : propriétés activées, bon type et bonne cible, réouverture | Tests d’intégration du vrai FlamWorkspace |
| Libellé par catégorie, sous-type d’écran et repli sans élément | Test d’intégration du vrai FlamWorkspace |
| Catégorie vide avec commandes d’ajout | Test d’intégration du vrai FlamWorkspace |
| Diagnostic global/local choisissant son onglet, panneau fermé | Test d’intégration du vrai FlamWorkspace |
| Clavier, état actif et association onglet/panneau | Hook de production monté avec le vrai reconciler React |
| Défilements distincts, scroll du panneau masqué ignoré, fermeture/réouverture | Hook de production monté |
| Maintien du même champ pendant une bascule | Hook monté, identité DOM et valeur du champ conservées |
| Nouveau projet initialisé sur Aventure | Montage indexé par projet, comme dans WorkspaceView |
| Groupes repliés, champ exact ou groupe parent, focus | Hook de production monté avec cibles DOM |
| Position de correction prioritaire puis retrouvée au retour | Hook de production monté |
| Onglets et fermeture sans chevauchement ni texte tronqué à 200 et 800 px | Géométrie calculée par Chromium en FR/EN/IT sur le vrai en-tête : 72 combinaisons de libellé, langue et largeur |
| Contenu masqué non affiché | Style calculé par Chromium |
| Commandes d’en-tête isolées de la poignée, fermeture et redimensionnement | Harnais du châssis commun |
| Médias différés, choix, règles, thèmes, écrans, création et historique | Tests d’interaction FLAM existants, conservés et réussis |
| Navigation d’onglet sans modification du document | Test d’intégration comparant le projet avant et après |

### Compatibilité de l’éditeur Avancé

```bash
node --test scripts/advancedWorkspaceState.test.mjs scripts/advancedWorkspaceMount.test.mjs
```

Résultat : **41 tests réussis**. Le châssis partagé n’a pas été modifié.

### Traductions, lint et construction

```bash
npm run check:i18n
npx eslint src/components/FlamWorkspace/FlamWorkspace.jsx src/components/FlamWorkspace/useFlamInspector.js scripts/flamInspectorMounted.test.mjs scripts/flamInspectorLayout.test.mjs scripts/flamWorkspacePanels.test.mjs scripts/flamEditorInteraction.test.mjs
npm run build
git diff --check
```

- Traductions : **0 erreur, 0 avertissement**, nouveaux libellés FR/EN/IT et
  métadonnées de traduction vérifiés.
- Lint ciblé : réussi, aucune sortie d’erreur.
- Construction Vite : réussie. Elle signale des bundles de plus de 500 ko ;
  cet avertissement ne bloque pas la construction.
- Vérification des espaces du diff : réussie.

## Limites des preuves

Les tests montés utilisent le DOM minimal du dépôt : ils prouvent les effets
de cycle de vie et les appels de focus, mais simulent les primitives de
scrollIntoView et ne mesurent pas le défilement physique du navigateur.
Le contrôle Chromium mesure séparément la géométrie réelle de l’en-tête et
le masquage CSS ; il ne constitue pas un parcours complet dans l’application
Tauri. Aucun essai manuel de souris, de lecteur d’écran ou d’appareil FLAM
n’est déclaré effectué. Aucun test Rust n’est nécessaire à ce changement
d’interface, qui ne modifie pas le lecteur ni la génération.

Le code partagé de déplacement/redimensionnement reste inchangé et ses
branchements passent les tests ; le nouveau groupe d’onglets utilise le
conteneur de commandes qui arrête déjà la propagation du pointeur.
