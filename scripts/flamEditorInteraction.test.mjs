import test from 'node:test';
import assert from 'node:assert/strict';
import { register, registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/experimental';
import { runner } from './reactHookDriver.mjs';
import i18next from 'i18next';
import { createTestI18n } from './i18nTestSetup.mjs';
import { createExampleAdventure } from '../src/store/flamAdventure/example.js';
import { createFlamProject } from '../src/store/flamAdventure/project.js';
import { commitAdventureEdit } from '../src/store/flamAdventure/editing.js';

let mediaTarget;
let dialog;
let prepare = async path => path;
globalThis.__flamUi = {
  dialog: { showErrorDialog: value => { dialog = value; }, showConfirmDialog: async () => true },
  media: { prepareMediaForProject: path => prepare(path), setGraphMediaTarget: target => { mediaTarget = target; } },
};
registerHooks({ load(url, context, next) {
  if (url.endsWith('/common/Dialog.jsx')) return { format: 'module', source: 'export const useErrorDialog = () => globalThis.__flamUi.dialog;', shortCircuit: true };
  if (url.endsWith('/MediaTransferContext.js')) return { format: 'module', source: 'export const useMediaTransfer = () => globalThis.__flamUi.media;', shortCircuit: true };
  if (url.endsWith('/hooks/useLocalFile.js')) return { format: 'module', source: "export const useLocalFile = path => { globalThis.__flamUi.previewPath = path; return path ? 'blob:flam-preview' : null; };", shortCircuit: true };
  if (url.endsWith('/editors/AudioField.jsx')) return { format: 'module', source: 'export function AudioField() { return null; }', shortCircuit: true };
  if (url.endsWith('/editors/ImageField.jsx')) return { format: 'module', source: 'export function ImageField() { return null; }', shortCircuit: true };
  if (url.endsWith('.css')) return { format: 'module', source: '', shortCircuit: true };
  if (url.endsWith('.jsx')) return { format: 'module', source: `import * as UIReact from '${new URL('../node_modules/react/index.js', import.meta.url).href}';\n` + transformSync(fileURLToPath(url), readFileSync(fileURLToPath(url), 'utf8'), { jsx: { runtime: 'classic', pragma: 'UIReact.createElement', pragmaFrag: 'UIReact.Fragment' } }).code, shortCircuit: true };
  return next(url, context);
} });
register('./nodeSourceResolver.mjs', import.meta.url);
const { useProjectStore } = await import('../src/store/projectStore.js');
const { FlamWorkspace } = await import('../src/components/FlamWorkspace/FlamWorkspace.jsx');
const { FlamGraph } = await import('../src/components/FlamWorkspace/FlamGraph.jsx');
const { ChoiceEditor } = await import('../src/components/FlamWorkspace/ChoiceEditor.jsx');
const { RuleEditor } = await import('../src/components/FlamWorkspace/RuleEditor.jsx');
const { suggestProjectName } = await import('../src/store/projectSaveName.js');
const resources = createTestI18n().options.resources;
i18next.init({ lng: 'fr', resources, initAsync: false, keySeparator: false, interpolation: { escapeValue: false } });
const elements = node => node?.type?.name === 'GraphWorkspacePanels'
  ? ['advanced-node-list', 'advanced-graph', 'advanced-inspector'].flatMap(id => elements(node.props.renderPanel(id, {})))
  : !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(elements) : [node, ...elements(node.props?.children)];
const componentElements = element => {
  const hook = runner(() => element.type(element.props));
  try { return elements(hook.render()); } finally { hook.unmount(); }
};

test('Réglages ouvre les propriétés et nomme l’onglet selon le type sélectionné sans modifier le projet', () => {
  const project = createFlamProject({ document: createExampleAdventure() });
  const before = JSON.stringify(project);
  const view = { showInspector: true, toggleInspector() { this.showInspector = !this.showInspector; } };
  const ui = runner(() => FlamWorkspace({ project, projectEpoch: 1, panelViewState: view,
    onEdit() { assert.fail('la navigation ne doit pas éditer le projet'); } }));
  const render = () => { const root = ui.render(); root.props.ref.current = { querySelectorAll: () => [] }; ui.flush(); return elements(root); };
  const panels = () => render().filter(element => element.props?.role === 'tabpanel');
  const tabs = () => componentElements(render().find(element => element.type?.name === 'GraphPanelHeader' && element.props.actions))
    .filter(element => element.props?.role === 'tab');
  try {
    let [adventure, selection] = panels();
    assert.equal(adventure.props.hidden, false);
    assert.equal(selection.props.hidden, true);
    assert.equal(tabs()[1].props.children, 'Scène');
    assert.ok(elements(adventure).some(element => element.props?.path === '/title'));
    assert.ok(!elements(selection).some(element => element.props?.path === '/title'));
    assert.ok(elements(adventure).some(element => element.props?.className === 'flam-diagnostics'));
    assert.ok(!elements(selection).some(element => element.props?.className === 'flam-diagnostics'));
    assert.ok(elements(adventure).some(element => element.type?.name === 'PresentationEditor'));
    assert.ok(!elements(selection).some(element => element.type?.name === 'PresentationEditor'));
    assert.ok(!elements(adventure).some(element => element.props?.className === 'flam-section-header'));
    const selectedId = project.authoring.document.scenes[1].id;
    render().find(element => element.type === FlamGraph).props.onSelect({ collection: 'scenes', id: selectedId });
    [adventure, selection] = panels();
    assert.equal(adventure.props.hidden, true);
    assert.equal(selection.props.hidden, false);
    assert.ok(elements(selection).some(element => element.props?.['data-flam-path'] === '/scenes/1'));
    tabs()[0].props.onClick();
    assert.equal(panels()[0].props.hidden, false);
    view.showInspector = false;
    render().find(element => element.type === FlamGraph).props.onSelect({ collection: 'items', id: 'cle' });
    assert.equal(view.showInspector, true);
    assert.equal(panels()[1].props.hidden, false);
    assert.equal(tabs()[1].props.children, 'Objet');
    assert.ok(elements(panels()[1]).some(element => element.props?.['data-flam-path'] === '/items/0'));
    assert.equal(JSON.stringify(project), before);
  } finally { ui.unmount(); }
});

test('le libellé de l’onglet suit les sous-types d’écran, toutes les catégories et le cas vide', () => {
  const document = createExampleAdventure();
  document.screens = ['menu', 'detail', 'grid', 'character'].map(type => ({ id: type, type, title: type, text: '', image: null, links: [], entries: [] }));
  const project = createFlamProject({ document });
  const ui = runner(() => FlamWorkspace({ project, projectEpoch: 1, onEdit() {} }));
  const render = () => { const root = ui.render(); root.props.ref.current = { querySelectorAll: () => [] }; ui.flush(); return elements(root); };
  const tab = () => componentElements(render().find(element => element.type?.name === 'GraphPanelHeader' && element.props.actions))
    .find(element => element.props?.role === 'tab' && element.props['aria-controls'].includes('selection'));
  try {
    for (const [collection, id, label] of [
      ['screens', 'menu', 'Menu'], ['screens', 'detail', 'Fiche'], ['screens', 'grid', 'Grille'], ['screens', 'character', 'Fiche personnage'],
      ['scenes', null, 'Scène'], ['classes', null, 'Classe'], ['items', null, 'Objet'], ['events', null, 'Événement'],
      ['rewards', null, 'Récompense'], ['rolls', null, 'Jet de dé'], ['choices', null, 'Choix'],
    ]) {
      render().find(element => element.type === FlamGraph).props.onSelect({ collection, id });
      assert.equal(tab().props.children, label);
      assert.equal(tab().props['aria-selected'], true);
    }
    project.authoring.document.screens = [];
    render().find(element => element.type === FlamGraph).props.onSelect({ collection: 'screens', id: null });
    assert.equal(tab().props.children, 'Sélection');
  } finally { ui.unmount(); }
});

test('Réglages conserve les ajouts en catégorie vide et dirige chaque diagnostic vers son onglet', () => {
  const document = createExampleAdventure();
  document.startSceneId = null;
  document.scenes[0].title = '';
  const project = createFlamProject({ document });
  const view = { showInspector: true, toggleInspector() { this.showInspector = !this.showInspector; } };
  const ui = runner(() => FlamWorkspace({ project, projectEpoch: 1, panelViewState: view, onEdit() {} }));
  const render = () => { const root = ui.render(); root.props.ref.current = { querySelectorAll: () => [] }; ui.flush(); return elements(root); };
  const panels = () => render().filter(element => element.props?.role === 'tabpanel');
  try {
    render().find(element => element.type === FlamGraph).props.onSelect({ collection: 'screens', id: null });
    const empty = elements(panels()[1]);
    assert.ok(empty.some(element => element.props?.children === 'Aucun élément sélectionné'));
    assert.ok(empty.some(element => element.props?.children === 'Ajouter un menu'));
    assert.ok(!empty.some(element => element.props?.className === 'flam-definition'));
    const diagnostic = text => render().find(element => element.props?.className?.startsWith('flam-diagnostic flam-diagnostic--')
      && elements(element).some(child => typeof child.props?.children === 'string' && child.props.children.includes(text)));
    view.showInspector = false;
    diagnostic('titre').props.children.props.onClick();
    assert.equal(view.showInspector, true);
    assert.equal(panels()[1].props.hidden, false);
    view.showInspector = false;
    diagnostic('départ').props.children.props.onClick();
    assert.equal(view.showInspector, true);
    assert.equal(panels()[0].props.hidden, false);
  } finally { ui.unmount(); }
});

test('formulaires réels : renommage, choix, règles, destinations, diagnostic et médiathèque dans le même projet', async () => {
  const storeHook = runner(() => useProjectStore(), { doubleInvokeStateUpdaters: true });
  let store = storeHook.render();
  store.loadProject(createFlamProject({ document: createExampleAdventure() }));
  store = storeHook.render();
  const epoch = store.workEpochRef.current;
  const onEdit = (captured, command) => commitAdventureEdit(store, captured, command);
  const ui = runner(() => FlamWorkspace({ project: store.readProject(), projectEpoch: epoch, onEdit, onOpenMedia() {} }));
  const render = () => {
    const root = ui.render();
    root.props.ref.current = { querySelectorAll: () => [] };
    ui.flush();
    return elements(root);
  };
  const click = text => render().find(e => e.props?.children === text && e.props?.onClick)?.props.onClick();
  const field = label => render().find(e => e.props?.label === label);
  const choiceElements = () => componentElements(render().find(e => e.type === ChoiceEditor));
  try {
    click('Objets');
    field('Nom').props.onChange('Clé dorée');
    assert.equal(store.readProject().authoring.document.items[0].name, 'Clé dorée');
    assert.equal(store.readProject().authoring.document.choices[3].effects[0].itemId, 'cle');
    click('Scènes'); render();
    assert.equal(mediaTarget.uuid, 'depart');
    await mediaTarget.assign({ kind: 'image', path: '/images/scene.png' });
    assert.equal(store.readProject().authoring.document.scenes[0].image, '/images/scene.png');
    const replayLabel = 'Relancer la narration si ce choix revient à la même scène';
    const replayField = () => choiceElements().find(e => e.props?.label === replayLabel);
    assert.equal(replayField().props.checked, true);
    replayField().props.onChange(false);
    assert.equal(replayField().props.checked, false);
    assert.equal(store.readProject().authoring.document.choices[0].replayAudioOnReturn, false);
    store.undo(); store = storeHook.render();
    assert.equal(replayField().props.checked, true);
    store.redo(); store = storeHook.render();
    assert.equal(replayField().props.checked, false);
    const choose = choiceElements();
    choose.find(e => e.props?.label === 'Texte du choix').props.onChange('Devenir pisteur');
    choiceElements().find(e => e.props?.label === 'Scène de destination').props.onChange('destination-absente');
    const ruleEditor = choiceElements().find(e => e.type === RuleEditor && !e.props.conditions);
    const rules = componentElements(ruleEditor);
    rules.find(e => e.props?.label === 'Classe').props.onChange('ami');
    const current = store.readProject().authoring.document.choices[0];
    assert.equal(current.label, 'Devenir pisteur');
    assert.equal(current.destination, 'destination-absente');
    assert.equal(current.effects[0].classId, 'ami');
    store.undo(); store = storeHook.render();
    assert.equal(store.project.authoring.document.choices[0].effects[0].classId, 'pisteur');
    store.redo(); store = storeHook.render();
    assert.equal(store.project.authoring.document.choices[0].effects[0].classId, 'ami');
    let focused = false;
    const root = ui.render();
    root.props.ref.current = { querySelectorAll: () => [{ dataset: { flamPath: '/choices/0/destination' }, querySelector: () => ({ focus: () => { focused = true; } }) }] };
    elements(root).find(e => e.props?.className === 'flam-diagnostic flam-diagnostic--error').props.children.props.onClick();
    ui.render(); ui.flush();
    assert.equal(focused, true);
    assert.ok(render().some(e => e.props?.['data-flam-path'] === '/choices/0'));
    click('Objets');
    await click('Supprimer cette définition');
    assert.match(dialog.message, /encore utilisée/);
    click('Récompenses');
    field('Autoriser cette récompense plusieurs fois par partie').props.onChange(true);
    assert.equal(store.readProject().authoring.document.rewards[0].repeatable, true);
    click('Jets de dé');
    field('Valeur minimale').props.onChange(2);
    assert.equal(store.readProject().authoring.document.rolls[0].outcomes[0].min, 2);
    assert.ok(render().some(e => e.props?.className === 'flam-diagnostic flam-diagnostic--error'));
    field('Valeur minimale').props.onChange(1);
    field('Péripétie : scène de destination').props.onChange('fin-renard');
    assert.equal(store.readProject().authoring.document.rolls[0].outcomes[0].destination, 'fin-renard');
    field('Titre de l’aventure').props.onChange('Les compagnons renommés');
    assert.equal(suggestProjectName(store.readProject()), 'Les compagnons renommés');
    for (const language of ['en', 'it', 'pseudo']) {
      await i18next.changeLanguage(language);
      const labels = render().filter(e => e.props?.label).map(e => e.props.label);
      assert.ok(labels.length > 0);
      assert.ok(labels.every(label => !label.includes('common:')));
      assert.equal(store.readProject().authoring.document.items[0].name, 'Clé dorée');
    }
  } finally { ui.unmount(); storeHook.unmount(); await i18next.changeLanguage('fr'); }
});

test('une affectation média différée conserve la scène d’origine et ne touche pas le projet suivant', async () => {
  const storeHook = runner(() => useProjectStore());
  const store = storeHook.render();
  store.loadProject(createFlamProject({ document: createExampleAdventure() }));
  const epoch = store.workEpochRef.current;
  const ui = runner(() => FlamWorkspace({ project: store.readProject(), projectEpoch: epoch, onEdit: (captured, command) => commitAdventureEdit(store, captured, command) }));
  try {
    ui.render(); ui.flush();
    let finish;
    prepare = () => new Promise(resolve => { finish = resolve; });
    const pending = mediaTarget.assign({ kind: 'audio', path: '/late.mp3' });
    store.loadProject(createFlamProject());
    finish('/prepared/late.mp3');
    await pending;
    assert.equal(store.readProject().authoring.document.scenes.length, 0);
  } finally { prepare = async path => path; ui.unmount(); storeHook.unmount(); }
});


test('graphe principal : sélection de scène, lien vers un jet et édition partagent le document et l’historique', () => {
  const storeHook = runner(() => useProjectStore());
  const store = storeHook.render();
  store.loadProject(createFlamProject({ document: createExampleAdventure() }));
  const epoch = store.workEpochRef.current;
  const ui = runner(() => FlamWorkspace({ project: store.readProject(), projectEpoch: epoch,
    onEdit: (captured, command) => commitAdventureEdit(store, captured, command) }));
  const render = () => { const root = ui.render(); root.props.ref.current = { querySelectorAll: () => [] }; ui.flush(); return elements(root); };
  const graph = () => render().find(e => e.type === FlamGraph);
  try {
    graph().props.onSelect({ collection: 'scenes', id: 'clairiere' });
    assert.equal(graph().props.selection.id, 'clairiere');
    assert.equal(mediaTarget.uuid, 'clairiere');
    graph().props.onLayout([{ collection: 'scenes', id: 'clairiere', x: 120, y: -80 }]);
    assert.equal(graph().props.graphLayout.positions[0].x, 120);
    render().find(e => e.props?.label === 'Titre de la scène').props.onChange('Une nouvelle clairière');
    assert.equal(graph().props.document.scenes.find(s => s.id === 'clairiere').title, 'Une nouvelle clairière');
    graph().props.onLink({ key: 'add', kind: 'add', sceneId: 'clairiere' }, { collection: 'rolls', id: 'rencontre' });
    const selected = graph().props.selection;
    assert.equal(selected.collection, 'choices');
    const choice = store.readProject().authoring.document.choices.find(c => c.id === selected.id);
    assert.equal(choice.rollId, 'rencontre');
    assert.ok(render().some(e => e.type === ChoiceEditor && e.props.choice.id === selected.id));
    store.undo();
    assert.ok(!graph().props.document.choices.some(c => c.id === selected.id));
    graph().props.onAddScene();
    const added = graph().props.selection;
    assert.equal(added.collection, 'scenes');
    assert.equal(mediaTarget.uuid, added.id);
  } finally { ui.unmount(); storeHook.unmount(); }
});

test('le menu et ses rubriques se configurent dans les formulaires et partagent l’historique du projet', async () => {
  const { PresentationEditor } = await import('../src/components/FlamWorkspace/PresentationEditor.jsx');
  const storeHook = runner(() => useProjectStore(), { doubleInvokeStateUpdaters: true });
  let store = storeHook.render();
  store.loadProject(createFlamProject({ document: createExampleAdventure() }));
  store = storeHook.render();
  const epoch = store.workEpochRef.current;
  const settings = runner(() => PresentationEditor({ document: store.readProject().authoring.document,
    onEdit: command => commitAdventureEdit(store, epoch, command), prepareMedia: async source => source, projectEpoch: epoch }));
  const render = () => elements(settings.render());
  const click = label => render().find(e => e.props?.children === label && e.props.onClick)?.props.onClick();
  try {
    click('Configurer le menu illustré');
    assert.equal(store.readProject().authoring.document.presentation.sections.length, 5);
    render().find(e => e.props?.path === '/presentation/sections/0/title').props.onChange('Sommaire');
    render().find(e => e.props?.path === '/presentation/sections/0/enabled').props.onChange(false);
    const media = render().find(e => e.props?.path === '/presentation' && e.type?.name === 'PresentationMedia');
    await media.props.onMedia('image', '/images/accueil.png');
    assert.equal(store.readProject().authoring.document.presentation.image, '/images/accueil.png');
    assert.equal(store.readProject().authoring.document.presentation.sections[0].title, 'Sommaire');
    assert.equal(store.readProject().authoring.document.presentation.sections[0].enabled, false);
    store.undo(); store = storeHook.render();
    assert.equal(store.readProject().authoring.document.presentation.image, null);
    store.redo(); store = storeHook.render();
    click('Ajouter un chapitre');
    render().find(e => e.props?.path === '/presentation/chapters/0/title').props.onChange('Le départ');
    click('Ajouter un passage');
    render().find(e => e.props?.path === '/presentation/chapters/0/passages/0/sceneId').props.onChange('depart');
    assert.equal(store.readProject().authoring.document.presentation.chapters[0].passages[0].sceneId, 'depart');
  } finally { settings.unmount(); storeHook.unmount(); }
});

test('le graphe crée Menu et Fiche, les relie et configure leur contenu avec historique et diagnostics', async () => {
  const { ScreenEditor } = await import('../src/components/FlamWorkspace/ScreenEditor.jsx');
  const { flamLinkPorts } = await import('../src/store/flamAdventure/graphLinks.js');
  const { flamGraphElements } = await import('../src/components/FlamWorkspace/flamGraph.js');
  const { diagnoseAdventureDocument } = await import('../src/store/flamAdventure/diagnostics.js');
  const { encodeProjectFile, decodeProjectFile } = await import('../src/store/projectModel/codec.js');
  const hook = runner(() => useProjectStore(), { doubleInvokeStateUpdaters: true });
  let store = hook.render();
  store.loadProject(createFlamProject()); store = hook.render();
  const epoch = store.workEpochRef.current;
  const ui = runner(() => FlamWorkspace({ project: store.readProject(), projectEpoch: epoch,
    onEdit: (captured, command) => commitAdventureEdit(store, captured, command) }));
  const render = () => { const root = ui.render(); root.props.ref.current = { querySelectorAll: () => [] }; ui.flush(); return elements(root); };
  const graph = () => render().find(e => e.type === FlamGraph).props;
  const screen = () => componentElements(render().find(e => e.type === ScreenEditor));
  try {
    graph().onAddScreen('menu');
    screen().find(e => e.props?.label === 'Titre de l’écran').props.onChange('Mes archives');
    const menu = store.readProject().authoring.document.screens[0];
    render().find(e => e.props?.label === 'Menu principal').props.onChange(menu.id);
    graph().onAddScreen('detail');
    const detail = store.readProject().authoring.document.screens[1];
    screen().find(e => e.props?.label === 'Titre de l’écran').props.onChange('Le pont');
    screen().find(e => e.props?.multiline).props.onChange('Le village est tout proche.');
    await render().find(e => e.type === ScreenEditor).props.onMedia('/images/pont.png');
    const port = flamLinkPorts(store.readProject().authoring.document, 'screens', menu.id)[0];
    graph().onLink(port, { collection: 'screens', id: detail.id });
    let document = store.readProject().authoring.document;
    assert.equal(document.screens[0].links[0].screenId, detail.id);
    assert.equal(document.screens[0].links[0].label, 'Le pont');
    const projected = flamGraphElements(document, { untitled: 'Sans titre' });
    assert.equal(projected.filter(e => e.data.source && e.data.consultation).length, 1);
    assert.equal(document.scenes.length, 0, 'Une fiche ne crée aucune scène');
    store.undo(); store = hook.render();
    assert.equal(store.readProject().authoring.document.screens[0].links.length, 0);
    store.redo(); store = hook.render();
    assert.equal(store.readProject().authoring.document.screens[0].links.length, 1);
    // Les champs du formulaire éditent le lien projeté dans le graphe.
    screen().find(e => e.props?.label === 'Accès de consultation').props.onChange('Consulter le pont');
    screen().find(e => e.props?.label === 'Écran à consulter').props.onChange('absente');
    document = store.readProject().authoring.document;
    assert.ok(diagnoseAdventureDocument(document).some(d => d.path === '/screens/0/links/0/screenId'));
    const reopened = (await decodeProjectFile(encodeProjectFile(store.readProject()))).project;
    assert.deepEqual(reopened.authoring.document, document, 'Un brouillon avec accès incomplet reste sauvegardable');
    screen().find(e => e.props?.label === 'Écran à consulter').props.onChange(detail.id);
    assert.throws(() => commitAdventureEdit(store, epoch, { type: 'remove', collection: 'screens', id: detail.id }), /REFERENCED_ADVENTURE_DEFINITION/);
    commitAdventureEdit(store, epoch, { type: 'document', patch: { mainMenuId: detail.id } });
    assert.ok(diagnoseAdventureDocument(store.readProject().authoring.document).some(d => d.code === 'INVALID_MAIN_MENU'));
  } finally { ui.unmount(); hook.unmount(); }
});

test('les menus mixtes partagent une fiche et éditent un vrai choix narratif avec historique et réouverture', async () => {
  const { screensFixture } = await import('./flamScreensFixture.mjs');
  const { ScreenEditor } = await import('../src/components/FlamWorkspace/ScreenEditor.jsx');
  const { flamLinkPorts } = await import('../src/store/flamAdventure/graphLinks.js');
  const { flamGraphElements } = await import('../src/components/FlamWorkspace/flamGraph.js');
  const { encodeProjectFile, decodeProjectFile } = await import('../src/store/projectModel/codec.js');
  const hook = runner(() => useProjectStore(), { doubleInvokeStateUpdaters: true });
  let store = hook.render(); store.loadProject(createFlamProject({ document: screensFixture() })); store = hook.render();
  const epoch = store.workEpochRef.current;
  const ui = runner(() => FlamWorkspace({ project: store.readProject(), projectEpoch: epoch,
    onEdit: (captured, command) => commitAdventureEdit(store, captured, command) }));
  const render = () => { const root = ui.render(); root.props.ref.current = { querySelectorAll: () => [] }; ui.flush(); return elements(root); };
  const graph = () => render().find(e => e.type === FlamGraph).props;
  const screen = () => componentElements(render().find(e => e.type === ScreenEditor));
  const choice = () => componentElements(screen().find(e => e.type === ChoiceEditor));
  const rules = conditions => componentElements(choice().find(e => e.type === RuleEditor && Boolean(e.props.conditions) === conditions));
  const field = (nodes, label) => nodes.find(e => e.props?.label === label);
  const document = () => store.readProject().authoring.document;
  try {
    graph().onAddScreen('menu');
    field(screen(), 'Titre de l’écran').props.onChange('Sous-menu');
    const submenu = document().screens.at(-1).id;
    const port = id => flamLinkPorts(document(), 'screens', id).find(p => p.kind === 'consult-add');
    graph().onLink(port('accueil'), { collection: 'screens', id: submenu });
    graph().onLink(port(submenu), { collection: 'screens', id: 'carte' });
    assert.equal(document().screens.filter(s => s.id === 'carte').length, 1);
    screen().find(e => e.props?.children === 'Ajouter une commande narrative').props.onClick();
    const command = document().choices.at(-1).id;
    assert.equal(document().screens.at(-1).links.at(-1).choiceId, command);
    store.undo(); store = hook.render();
    assert.ok(!document().choices.some(c => c.id === command));
    store.redo(); store = hook.render();
    field(choice(), 'Texte du choix').props.onChange('Utiliser la clé');
    field(choice(), 'Scène de destination').props.onChange('sentier');
    // Les mêmes formulaires de règles que les choix de scène.
    for (const conditions of [true, false]) {
      rules(conditions).find(e => e.props?.children === 'Ajouter une règle').props.onClick();
      const typeField = rules(conditions).find(e => e.props?.path?.endsWith('/0') && typeof e.props.children === 'function');
      typeField.props.children('type').props.onChange({ target: { value: conditions ? 'item' : 'consumeItem' } });
      field(rules(conditions), 'Objet').props.onChange('cle');
    }
    assert.deepEqual(document().choices.at(-1).conditions, [{ type: 'item', itemId: 'cle', quantity: 1 }]);
    assert.deepEqual(document().choices.at(-1).effects, [{ type: 'consumeItem', itemId: 'cle', quantity: 1 }]);
    const projected = flamGraphElements(document(), { untitled: '' });
    assert.equal(projected.filter(e => e.data.definitionId === 'carte' && !e.data.source).length, 1);
    const edge = projected.find(e => e.data.definitionId === command && e.data.source);
    assert.equal(edge.data.source, `screens:${submenu}`); assert.equal(edge.data.target, 'scenes:sentier');
    assert.ok(!edge.data.consultation);
    const reopened = (await decodeProjectFile(encodeProjectFile(store.readProject()))).project;
    assert.deepEqual(reopened.authoring.document, document());
    // Retirer une commande et sa définition est un seul geste, annulable.
    choice().find(e => e.props?.children === 'Retirer cette commande du menu').props.onClick();
    await Promise.resolve();
    assert.ok(!document().choices.some(c => c.id === command));
    store.undo(); store = hook.render(); assert.ok(document().choices.some(c => c.id === command));
  } finally { ui.unmount(); hook.unmount(); }
});


test('thème et remplacements actualisent l’aperçu, le graphe et le projet sans exécuter une partie', async () => {
  const { themedScreensFixture } = await import('./flamScreensFixture.mjs');
  const { ThemeEditor } = await import('../src/components/FlamWorkspace/ThemeEditor.jsx');
  const { FlamScreenPreview } = await import('../src/components/FlamWorkspace/FlamScreenPreview.jsx');
  const { flamGraphElements } = await import('../src/components/FlamWorkspace/flamGraph.js');
  const { diagnoseAdventureDocument } = await import('../src/store/flamAdventure/diagnostics.js');
  const { encodeProjectFile, decodeProjectFile } = await import('../src/store/projectModel/codec.js');
  const hook = runner(() => useProjectStore(), { doubleInvokeStateUpdaters: true });
  let store = hook.render(); store.loadProject(createFlamProject({ document: themedScreensFixture() })); store = hook.render();
  const epoch = store.workEpochRef.current;
  const ui = runner(() => FlamWorkspace({ project: store.readProject(), projectEpoch: epoch,
    onEdit: (captured, command) => commitAdventureEdit(store, captured, command) }));
  const render = () => { const root = ui.render(); root.props.ref.current = { querySelectorAll: () => [] }; ui.flush(); return elements(root); };
  const graph = () => render().find(e => e.type === FlamGraph);
  const colors = local => componentElements(render().find(e => e.type === ThemeEditor && Boolean(e.props.screen) === local));
  const changeColor = (local, label, value, raw = false) => {
    const field = colors(local).find(e => e.props?.label === label);
    elements(field.props.children('color')).find(e => e.type === 'input' && (raw ? e.props.type !== 'color' : e.props.type === 'color')).props.onChange({ target: { value } });
  };
  let previewProps;
  const preview = runner(() => FlamScreenPreview(previewProps));
  const screen = () => {
    const { document, selection } = graph().props;
    previewProps = { document, collection: selection.collection, id: selection.id };
    return elements(preview.render());
  };
  const svg = () => screen().find(e => e.type === 'svg').props;
  try {
    graph().props.onSelect({ collection: 'scenes', id: 'clairiere' });
    const rules = structuredClone(store.readProject().authoring.document.choices);
    assert.equal(svg().style.background, '#101112');
    assert.equal(svg().style.color, '#ffeecc');
    assert.equal(screen().some(e => e.type === 'text' && e.props.fontSize === '20'), false);
    assert.ok(screen().some(e => e.type === 'text' && e.props.fontSize === '12' && e.props.y === 64));
    const optionPositions = () => screen().filter(e => e.type === 'svg' && e.props.x === '30').map(e => [e.props.children.props.children, e.props.x, e.props.width]);
    const initialPositions = optionPositions();
    assert.ok(initialPositions.length > 0);
    assert.ok(initialPositions.every(([, x, width]) => Number(x) + width === 202));
    assert.equal(screen().some(e => e.type === 'image'), false);
    colors(true).find(e => e.props?.label === 'Remplacer la couleur Texte').props.onChange(true);
    changeColor(true, 'Texte', '#123456');
    changeColor(false, 'Texte', '#abcdef');
    assert.equal(svg().style.color, '#123456');
    colors(true).find(e => e.props?.label === 'Remplacer la couleur Texte').props.onChange(false);
    assert.equal(svg().style.color, '#abcdef');
    store.undo(); store = hook.render(); assert.equal(svg().style.color, '#123456');
    store.redo(); store = hook.render(); assert.equal(svg().style.color, '#abcdef');
    colors(true).find(e => e.props?.label === 'Remplacer la couleur Fond').props.onChange(false);
    assert.equal(svg().style.background, '#112233');
    changeColor(false, 'Fond', '#aabbcc');
    assert.equal(svg().style.background, '#aabbcc');
    const projected = flamGraphElements(store.readProject().authoring.document, { untitled: '' });
    assert.equal(projected.find(e => e.data.id === 'scenes:clairiere').data.screenBackground, '#aabbcc');
    assert.equal(projected.find(e => e.data.id === 'scenes:clairiere').data.screenText, '#abcdef');
    const selected = screen().find(e => e.type === 'select');
    selected.props.onChange({ target: { value: '1' } });
    assert.deepEqual(optionPositions(), initialPositions);
    assert.ok(screen().some(e => e.type === 'text' && e.props.fill === '#abcdef' && e.props.children === '>'));
    assert.deepEqual(store.readProject().authoring.document.choices, rules);
    const reopened = (await decodeProjectFile(encodeProjectFile(store.readProject()))).project;
    assert.deepEqual(reopened.authoring.document.theme, store.readProject().authoring.document.theme);
    assert.deepEqual(reopened.authoring.document.scenes, store.readProject().authoring.document.scenes);
    graph().props.onSelect({ collection: 'screens', id: 'carte' });
    assert.equal(svg().style.color, '#00ddaa');
    assert.ok(screen().some(e => e.type === 'image' && e.props.href === 'blob:flam-preview'));
    assert.ok(screen().some(e => e.type === 'text' && e.props.children === 'La carte du village'));
    changeColor(true, 'Texte', 'invalide', true);
    assert.ok(diagnoseAdventureDocument(store.readProject().authoring.document).some(d => d.code === 'INVALID_COLOR' && d.path === '/screens/1/colors/text'));
    assert.equal(svg().style.color, '#abcdef', 'Un brouillon invalide conserve un aperçu lisible avec la couleur héritée');
    const graphElements = componentElements(graph());
    assert.ok(graphElements.some(e => e.type === FlamScreenPreview && e.props.id === 'carte'));
  } finally { preview.unmount(); ui.unmount(); hook.unmount(); }
});

test('une grille et sa fiche type se construisent sans dupliquer les objets et suivent le projet', async () => {
  const { inventoryGridFixture } = await import('./flamScreensFixture.mjs');
  const { ScreenEditor } = await import('../src/components/FlamWorkspace/ScreenEditor.jsx');
  const { FlamScreenPreview, PreviewGridCell } = await import('../src/components/FlamWorkspace/FlamScreenPreview.jsx');
  const { flamLinkPorts } = await import('../src/store/flamAdventure/graphLinks.js');
  const { flamGraphElements } = await import('../src/components/FlamWorkspace/flamGraph.js');
  const { diagnoseAdventureDocument } = await import('../src/store/flamAdventure/diagnostics.js');
  const { encodeProjectFile, decodeProjectFile } = await import('../src/store/projectModel/codec.js');
  const fixture = inventoryGridFixture();
  fixture.screens = fixture.screens.filter(s => !['affaires', 'objet'].includes(s.id));
  fixture.screens[0].links = fixture.screens[0].links.filter(link => link.screenId !== 'affaires');
  const hook = runner(() => useProjectStore(), { doubleInvokeStateUpdaters: true });
  let store = hook.render(); store.loadProject(createFlamProject({ document: fixture })); store = hook.render();
  const ui = runner(() => FlamWorkspace({ project: store.readProject(), projectEpoch: store.workEpochRef.current,
    onEdit: (epoch, command) => commitAdventureEdit(store, epoch, command) }));
  const render = () => { const root = ui.render(); root.props.ref.current = { querySelectorAll: () => [] }; ui.flush(); return elements(root); };
  const graph = () => render().find(e => e.type === FlamGraph).props;
  const screen = () => componentElements(render().find(e => e.type === ScreenEditor));
  const document = () => store.readProject().authoring.document;
  let previewProps;
  const preview = runner(() => FlamScreenPreview(previewProps));
  const view = () => { const { selection } = graph(); previewProps = { document: document(), ...selection }; return elements(preview.render()); };
  try {
    graph().onAddScreen('grid');
    const gridId = document().screens.at(-1).id;
    screen().find(e => e.props?.label === 'Titre de l’écran').props.onChange('Mes objets');
    assert.ok(diagnoseAdventureDocument(document()).some(d => d.code === 'INVALID_GRID_DETAIL'));
    graph().onAddScreen('detail');
    const templateId = document().screens.at(-1).id;
    screen().find(e => e.props?.label === 'Contenu de la fiche').props.children('source').props.onChange({ target: { value: 'item' } });
    screen().find(e => e.props?.label === 'Titre de l’écran').props.onChange('Fiche des objets');
    assert.ok(!screen().some(e => e.props?.multiline), 'La fiche type n’exige aucune copie de description');
    const gridPort = flamLinkPorts(document(), 'screens', gridId)[0];
    graph().onLink(gridPort, { collection: 'screens', id: templateId });
    assert.equal(document().screens.find(s => s.id === gridId).detailScreenId, templateId);
    store.undo(); store = hook.render(); assert.equal(document().screens.find(s => s.id === gridId).detailScreenId, null);
    store.redo(); store = hook.render();
    const menuPort = flamLinkPorts(document(), 'screens', 'accueil').find(p => p.kind === 'consult-add');
    graph().onLink(menuPort, { collection: 'screens', id: gridId });
    graph().onSelect({ collection: 'screens', id: gridId });
    let cells = view().filter(e => e.type === PreviewGridCell);
    assert.deepEqual(cells.map(e => e.props.item.name), ['Clé', 'Jeton', 'Corde', 'Boussole']);
    assert.deepEqual(cells.map(e => { const rect = componentElements(e).find(n => n.type === 'rect'); return [rect.props.x, rect.props.y]; }), [[12,48],[164,48],[12,118],[164,118]]);
    view().find(e => e.type === 'select').props.onChange({ target: { value: '6' } });
    cells = view().filter(e => e.type === PreviewGridCell);
    assert.deepEqual(cells.map(e => e.props.item.name), ['Lanterne', 'Galet', 'Carte']);
    graph().onSelect({ collection: 'items', id: 'carte-objet' });
    render().find(e => e.props?.multiline).props.onChange('Un nouveau plan.');
    graph().onSelect({ collection: 'screens', id: templateId });
    view().find(e => e.type === 'select').props.onChange({ target: { value: '6' } });
    assert.ok(view().some(e => e.type === 'text' && e.props.children === 'Carte'));
    assert.ok(view().filter(e => e.type === 'text').map(e => e.props.children).join(' ').includes('Un nouveau plan.'));
    assert.ok(view().some(e => e.type === 'image' && e.props.href === 'blob:flam-preview'));
    const projected = flamGraphElements(document(), { untitled: '' });
    assert.equal(projected.filter(e => e.data.source === `screens:${gridId}`).length, 1, 'Un seul lien suffit pour tous les objets');
    assert.ok(!projected.some(e => e.data.collection === 'items'));
    const reopened = (await decodeProjectFile(encodeProjectFile(store.readProject()))).project;
    assert.deepEqual(reopened.authoring.document, document());
    assert.throws(() => commitAdventureEdit(store, store.workEpochRef.current, { type: 'remove', collection: 'screens', id: templateId }), /REFERENCED_ADVENTURE_DEFINITION/);
    screen().find(e => e.props?.label === 'Contenu de la fiche').props.children('source').props.onChange({ target: { value: 'author' } });
    assert.ok(diagnoseAdventureDocument(document()).some(d => d.code === 'INVALID_GRID_DETAIL'));
  } finally { preview.unmount(); ui.unmount(); hook.unmount(); }
});

test('une collection édite entrées, médias, conditions et fiches dans le même historique', async () => {
  const { inventoryGridFixture } = await import('./flamScreensFixture.mjs');
  const { ScreenEditor } = await import('../src/components/FlamWorkspace/ScreenEditor.jsx');
  const { CollectionEditor } = await import('../src/components/FlamWorkspace/CollectionEditor.jsx');
  const { FlamScreenPreview, PreviewGridCell } = await import('../src/components/FlamWorkspace/FlamScreenPreview.jsx');
  const { flamLinkPorts } = await import('../src/store/flamAdventure/graphLinks.js');
  const { flamGraphElements } = await import('../src/components/FlamWorkspace/flamGraph.js');
  const { diagnoseAdventureDocument } = await import('../src/store/flamAdventure/diagnostics.js');
  const { encodeProjectFile, decodeProjectFile } = await import('../src/store/projectModel/codec.js');
  const hook = runner(() => useProjectStore(), { doubleInvokeStateUpdaters: true });
  let store = hook.render(); store.loadProject(createFlamProject({ document: inventoryGridFixture() })); store = hook.render();
  const epoch = store.workEpochRef.current;
  const ui = runner(() => FlamWorkspace({ project: store.readProject(), projectEpoch: epoch, onEdit: (captured, command) => commitAdventureEdit(store, captured, command) }));
  const render = () => { const root = ui.render(); root.props.ref.current = { querySelectorAll: () => [] }; ui.flush(); return elements(root); };
  const graph = () => render().find(e => e.type === FlamGraph).props;
  const screen = () => componentElements(render().find(e => e.type === ScreenEditor));
  const entries = () => componentElements(screen().find(e => e.type === CollectionEditor));
  const rules = () => componentElements(entries().find(e => e.type === RuleEditor));
  const document = () => store.readProject().authoring.document;
  try {
    graph().onAddScreen('detail'); const detailId = document().screens.at(-1).id;
    screen().find(e => e.props?.label === 'Titre de l’écran').props.onChange('La porte découverte');
    graph().onAddScreen('grid'); const gridId = document().screens.at(-1).id;
    screen().find(e => e.props?.label === 'Source de la grille').props.children('source').props.onChange({ target: { value: 'collection' } });
    entries().find(e => e.props?.children === 'Ajouter une entrée').props.onClick();
    entries().find(e => e.props?.label === 'Libellé de l’entrée').props.onChange('Souvenir de la porte');
    entries().find(e => e.props?.label === 'Fiche de l’entrée').props.onChange(detailId);
    await entries().find(e => e.type?.name === 'ImageField').props.onPick('/images/souvenir.png');
    rules().find(e => e.props?.children === 'Ajouter une règle').props.onClick();
    rules().find(e => e.props?.path?.endsWith('/0') && typeof e.props.children === 'function').props.children('type').props.onChange({ target: { value: 'event' } });
    rules().find(e => e.props?.label === 'Événement').props.onChange('porte-ouverte');
    entries().find(e => e.props?.label === 'Entrée indisponible').props.children('unavailable').props.onChange({ target: { value: 'disabled' } });
    let entry = document().screens.at(-1).entries[0];
    assert.equal(entry.unavailable, 'disabled'); assert.equal(entry.image, '/images/souvenir.png');
    assert.deepEqual(entry.conditions, [{ type: 'event', eventId: 'porte-ouverte', present: true }]);
    assert.throws(() => commitAdventureEdit(store, epoch, { type: 'remove', collection: 'screens', id: detailId }), /REFERENCED_ADVENTURE_DEFINITION/);
    const port = flamLinkPorts(document(), 'screens', gridId)[0];
    graph().onLink(port, { collection: 'screens', id: 'note' });
    assert.equal(document().screens.at(-1).entries[0].screenId, 'note');
    store.undo(); store = hook.render(); assert.equal(document().screens.at(-1).entries[0].screenId, detailId);
    store.redo(); store = hook.render();
    const edge = flamGraphElements(document(), { untitled: '' }).find(e => e.data.sourcePortKey === port.key);
    assert.equal(edge.data.target, 'screens:note'); assert.equal(edge.data.consultation, true); assert.equal(edge.data.conditional, true);
    const preview = componentElements({ type: FlamScreenPreview, props: { document: document(), collection: 'screens', id: gridId } });
    assert.equal(preview.find(e => e.type === PreviewGridCell).props.item.name, 'Souvenir de la porte');
    const reopened = (await decodeProjectFile(encodeProjectFile(store.readProject()))).project;
    assert.deepEqual(reopened.authoring.document, document());
    screen().find(e => e.props?.label === 'Source de la grille').props.children('source').props.onChange({ target: { value: 'inventory' } });
    store.undo(); store = hook.render();
    assert.equal(document().screens.at(-1).source, 'collection'); assert.equal(document().screens.at(-1).entries[0].image, '/images/souvenir.png');
    rules().find(e => e.props?.path?.endsWith('/0') && typeof e.props.children === 'function').props.children('type').props.onChange({ target: { value: 'item' } });
    rules().find(e => e.props?.label === 'Objet').props.onChange('cle');
    rules().find(e => e.props?.label === 'Quantité entière positive').props.onChange(0);
    assert.ok(diagnoseAdventureDocument(document()).some(d => d.code === 'INVALID_QUANTITY' && d.path.includes('/entries/0/conditions/0/quantity')));
  } finally { ui.unmount(); hook.unmount(); }
});


test('modes, images par identité et résultats médias différés se retrouvent dans l’aperçu et l’historique', async () => {
  const { selectionIllustrationsFixture } = await import('./flamScreensFixture.mjs');
  const { ScreenEditor } = await import('../src/components/FlamWorkspace/ScreenEditor.jsx');
  const { IllustrationModeField } = await import('../src/components/FlamWorkspace/IllustrationEditor.jsx');
  const { FlamScreenPreview } = await import('../src/components/FlamWorkspace/FlamScreenPreview.jsx');
  const { encodeProjectFile, decodeProjectFile } = await import('../src/store/projectModel/codec.js');
  const hook = runner(() => useProjectStore(), { doubleInvokeStateUpdaters: true });
  let store = hook.render(); store.loadProject(createFlamProject({ document: selectionIllustrationsFixture() })); store = hook.render();
  const epoch = store.workEpochRef.current;
  const ui = runner(() => FlamWorkspace({ project: store.readProject(), projectEpoch: epoch, onEdit: (captured, command) => commitAdventureEdit(store, captured, command) }));
  const render = () => { const root = ui.render(); root.props.ref.current = { querySelectorAll: () => [] }; ui.flush(); return elements(root); };
  const graph = () => render().find(e => e.type === FlamGraph).props;
  const screen = () => componentElements(render().find(e => e.type === ScreenEditor));
  const mode = value => {
    const field = graph().selection.collection === 'scenes' ? render().find(e => e.type === IllustrationModeField) : screen().find(e => e.type === IllustrationModeField);
    componentElements(field).find(e => e.props?.label === 'Mode d’illustration').props.children('mode').props.onChange({ target: { value } });
  };
  let previewProps;
  const preview = runner(() => FlamScreenPreview(previewProps));
  const view = () => { const { selection, document } = graph(); previewProps = { ...selection, document }; return elements(preview.render()); };
  const picture = () => { view(); return globalThis.__flamUi.previewPath; };
  const document = () => store.readProject().authoring.document;
  try {
    graph().onSelect({ collection: 'scenes', id: 'depart' });
    const choice = render().find(e => e.type === ChoiceEditor && e.props.choice.id === 'choisir-pisteur');
    await componentElements(choice).find(e => e.props?.label === 'Illustration de ce choix').props.onPick('/images/pisteur.png');
    assert.equal(picture(), 'start-common.png');
    const illustration = view().find(e => e.type === 'image').props;
    assert.deepEqual([illustration.x, illustration.y, illustration.width, illustration.height, illustration.preserveAspectRatio],
      ['214', '0', '106', '212', 'xMidYMax meet']);
    mode('selection'); assert.equal(picture(), '/images/pisteur.png');
    view().find(e => e.type === 'select').props.onChange({ target: { value: '1' } }); assert.equal(picture(), 'ami.png');
    mode('common'); assert.equal(picture(), 'start-common.png');
    store.undo(); store = hook.render(); assert.equal(picture(), 'ami.png');
    commitAdventureEdit(store, epoch, { type: 'patch', collection: 'scenes', id: 'depart', patch: { choices: ['choisir-ami','choisir-pisteur'] } });
    view().find(e => e.type === 'select').props.onChange({ target: { value: '0' } }); assert.equal(picture(), 'ami.png');
    view().find(e => e.type === 'select').props.onChange({ target: { value: '1' } }); assert.equal(picture(), '/images/pisteur.png');
    graph().onSelect({ collection: 'screens', id: 'accueil' });
    let release;
    prepare = () => new Promise(resolve => { release = resolve; });
    const menuImage = () => screen().find(e => e.props?.fieldId === 'flam-menu-choice:accueil:carte');
    const pending = menuImage().props.onPick('/images/menu.png');
    screen().find(e => e.props?.path === '/screens/0/links/0/label').props.onChange('Carte renommée');
    release('/images/menu.png'); await pending;
    assert.equal(document().screens[0].links[0].label, 'Carte renommée');
    assert.equal(document().screens[0].links[0].image, '/images/menu.png');
    assert.equal(document().screens.find(s => s.id === 'carte').image, 'carte.png', 'Un identifiant de lien peut être homonyme d’un écran sans détourner le média');
    assert.equal(picture(), '/images/menu.png'); mode('common'); assert.equal(picture(), 'main-common.png'); mode('selection');
    const reopened = (await decodeProjectFile(encodeProjectFile(store.readProject()))).project;
    assert.deepEqual(reopened.authoring.document, document());
    menuImage().props.onClear(); assert.equal(picture(), 'main-common.png');
    store.undo(); store = hook.render(); assert.equal(picture(), '/images/menu.png');
    const late = menuImage().props.onPick('/images/perimee.png');
    const current = document().screens[0];
    commitAdventureEdit(store, epoch, { type: 'patch', collection: 'screens', id: 'accueil', patch: { links: current.links.filter(link => link.id !== 'carte') } });
    const afterRemoval = structuredClone(document());
    release('/images/perimee.png'); await late;
    assert.deepEqual(document(), afterRemoval, 'Un média différé ne recrée pas un accès supprimé');
    store.undo(); store = hook.render(); assert.equal(document().screens[0].links[0].image, '/images/menu.png');
  } finally { prepare = async path => path; preview.unmount(); ui.unmount(); hook.unmount(); }
});

test('compositions, audio facultatif et texte long des fiches sont éditables et prévisualisables', async () => {
  const { richDetailsFixture } = await import('./flamScreensFixture.mjs');
  const { ScreenEditor } = await import('../src/components/FlamWorkspace/ScreenEditor.jsx');
  const { FlamScreenPreview } = await import('../src/components/FlamWorkspace/FlamScreenPreview.jsx');
  const { encodeProjectFile, decodeProjectFile } = await import('../src/store/projectModel/codec.js');
  const hook = runner(() => useProjectStore(), { doubleInvokeStateUpdaters: true });
  let store = hook.render(); store.loadProject(createFlamProject({ document: richDetailsFixture() })); store = hook.render();
  const epoch = store.workEpochRef.current;
  const ui = runner(() => FlamWorkspace({ project: store.readProject(), projectEpoch: epoch, onEdit: (captured, command) => commitAdventureEdit(store, captured, command) }));
  const render = () => { const root = ui.render(); root.props.ref.current = { querySelectorAll: () => [] }; ui.flush(); return elements(root); };
  const graph = () => render().find(e => e.type === FlamGraph).props;
  const editor = () => componentElements(render().find(e => e.type === ScreenEditor));
  const layout = value => editor().find(e => e.props?.label === 'Composition de la fiche').props.children('layout').props.onChange({ target: { value } });
  let previewProps;
  const preview = runner(() => FlamScreenPreview(previewProps));
  const view = () => { const { selection, document } = graph(); previewProps = { ...selection, document }; return elements(preview.render()); };
  const document = () => store.readProject().authoring.document;
  try {
    graph().onSelect({ collection: 'screens', id: 'fiche-enrichie' });
    let image = view().find(e => e.type === 'image');
    assert.equal(image.props.x, '12'); assert.equal(image.props.width, 140); assert.equal(image.props.height, '140');
    assert.ok(view().some(e => e.type === 'text' && e.props.x === 164 && e.props.children === 'Ligne00é'));
    const range = view().find(e => e.type === 'input' && e.props.type === 'range');
    range.props.onChange({ target: { value: String(range.props.max) } });
    assert.ok(view().some(e => e.type === 'text' && e.props.children === 'TERMINUS'));
    assert.ok(!view().some(e => e.type === 'text' && e.props.children === 'Ligne00é'));
    layout('fullImage'); image = view().find(e => e.type === 'image'); assert.equal(image.props.width, 296);
    assert.ok(!view().some(e => e.type === 'text' && e.props.children === 'TERMINUS'));
    view().find(e => e.props?.children === 'Lire la description').props.onClick();
    assert.ok(!view().some(e => e.type === 'image'));
    assert.ok(view().some(e => e.type === 'text' && e.props.x === 12 && e.props.children === 'TERMINUS'));
    const audio = () => editor().find(e => e.type?.name === 'AudioField');
    assert.equal(audio().props.required, false); assert.equal(audio().props.xttsTarget.projectEpoch, epoch);
    await audio().props.onPick('/audio/description.mp3');
    editor().find(e => e.props?.label === 'Titre de l’écran').props.onChange('');
    let detail = document().screens.find(s => s.id === 'fiche-enrichie');
    assert.equal(detail.audio, '/audio/description.mp3'); assert.equal(detail.title, ''); assert.equal(detail.layout, 'fullImage');
    audio().props.onClear(); await Promise.resolve(); assert.equal(document().screens.find(s => s.id === detail.id).audio, null);
    store.undo(); store = hook.render(); assert.equal(document().screens.find(s => s.id === detail.id).audio, '/audio/description.mp3');
    const reopened = (await decodeProjectFile(encodeProjectFile(store.readProject()))).project;
    assert.deepEqual(reopened.authoring.document, document());
    graph().onSelect({ collection: 'screens', id: 'objet' });
    assert.ok(!editor().some(e => e.type?.name === 'AudioField'), 'La fiche type réutilise l’audio de l’objet');
    layout('split');
    view().find(e => e.type === 'select').props.onChange({ target: { value: '0' } });
    assert.equal(view().find(e => e.type === 'image').props.width, 140);
    assert.ok(view().some(e => e.type === 'text' && e.props.children === 'Écouter la description'));
    assert.ok(view().filter(e => e.type === 'small').some(e => JSON.stringify(e.props.children).includes('cle-description-stereo.mp3')));
  } finally { preview.unmount(); ui.unmount(); hook.unmount(); }
});

test('la fiche personnage se crée, se relie et édite portrait et informations conditionnelles avec historique', async () => {
  const { screensFixture } = await import('./flamScreensFixture.mjs');
  const { ScreenEditor } = await import('../src/components/FlamWorkspace/ScreenEditor.jsx');
  const { CharacterEditor } = await import('../src/components/FlamWorkspace/CharacterEditor.jsx');
  const { FlamScreenPreview } = await import('../src/components/FlamWorkspace/FlamScreenPreview.jsx');
  const { flamLinkPorts } = await import('../src/store/flamAdventure/graphLinks.js');
  const { flamGraphElements } = await import('../src/components/FlamWorkspace/flamGraph.js');
  const { diagnoseAdventureDocument } = await import('../src/store/flamAdventure/diagnostics.js');
  const { encodeProjectFile, decodeProjectFile } = await import('../src/store/projectModel/codec.js');
  const hook = runner(() => useProjectStore(), { doubleInvokeStateUpdaters: true });
  let store = hook.render(); store.loadProject(createFlamProject({ document: screensFixture() })); store = hook.render();
  const epoch = store.workEpochRef.current;
  const ui = runner(() => FlamWorkspace({ project: store.readProject(), projectEpoch: epoch, onEdit: (captured, command) => commitAdventureEdit(store, captured, command) }));
  const render = () => { const root = ui.render(); root.props.ref.current = { querySelectorAll: () => [] }; ui.flush(); return elements(root); };
  const graph = () => render().find(e => e.type === FlamGraph).props;
  const editor = () => componentElements(render().find(e => e.type === ScreenEditor));
  const information = () => componentElements(editor().find(e => e.type === CharacterEditor));
  const rules = () => componentElements(information().find(e => e.type === RuleEditor));
  const document = () => store.readProject().authoring.document;
  let previewProps;
  const preview = runner(() => FlamScreenPreview(previewProps));
  const view = () => { previewProps = { document: document(), collection: 'screens', id: graph().selection.id }; return elements(preview.render()); };
  try {
    graph().onAddScreen('character'); const id = document().screens.at(-1).id;
    assert.equal(document().screens.at(-1).type, 'character');
    editor().find(e => e.props?.label === 'Titre de l’écran').props.onChange('Ton portrait');
    await editor().find(e => e.type?.name === 'ImageField').props.onPick('/images/portrait.png');
    information().find(e => e.props?.children === 'Ajouter une information').props.onClick();
    const long = Array.from({ length: 20 }, (_, i) => `Texte${i}`).join('\n') + '\nDERNIER';
    information().find(e => e.props?.label === 'Information du personnage').props.onChange(long);
    rules().find(e => e.props?.children === 'Ajouter une règle').props.onClick();
    rules().find(e => e.props?.label === 'Classe').props.onChange('pisteur');
    assert.deepEqual(document().screens.at(-1).information[0].conditions, [{ type: 'class', classId: 'pisteur' }]);
    assert.throws(() => commitAdventureEdit(store, epoch, { type: 'remove', collection: 'classes', id: 'pisteur' }), /REFERENCED_ADVENTURE_DEFINITION/);
    rules().find(e => e.props?.path?.endsWith('/0') && typeof e.props.children === 'function').props.children('type').props.onChange({ target: { value: 'event' } });
    rules().find(e => e.props?.label === 'Événement').props.onChange('porte-ouverte');
    assert.deepEqual(document().screens.at(-1).information[0].conditions, [{ type: 'event', eventId: 'porte-ouverte', present: true }]);
    store.undo(); store = hook.render();
    assert.ok(diagnoseAdventureDocument(document()).some(d => d.path.endsWith('/information/0/conditions/0/eventId')));
    store.redo(); store = hook.render();
    const port = flamLinkPorts(document(), 'screens', 'accueil').find(p => p.kind === 'consult-add');
    graph().onLink(port, { collection: 'screens', id });
    assert.ok(flamGraphElements(document(), { untitled: '' }).some(e => e.data.target === `screens:${id}` && e.data.consultation));
    graph().onSelect({ collection: 'screens', id });
    assert.ok(view().some(e => e.type === 'image' && e.props.width === 140));
    const range = view().find(e => e.type === 'input' && e.props.type === 'range'); range.props.onChange({ target: { value: String(range.props.max) } });
    assert.ok(view().some(e => e.type === 'text' && e.props.children === 'DERNIER'));
    assert.ok(view().some(e => e.type === 'small' && e.props.children.includes('toutes les informations')));
    information().find(e => e.props?.children === 'Retirer cette information').props.onClick();
    assert.equal(document().screens.at(-1).information.length, 0);
    store.undo(); store = hook.render(); assert.equal(document().screens.at(-1).information[0].text, long);
    assert.equal(document().screens.at(-1).image, '/images/portrait.png');
    assert.ok(!diagnoseAdventureDocument(document()).some(d => d.severity === 'error'));
    const reopened = (await decodeProjectFile(encodeProjectFile(store.readProject()))).project;
    assert.deepEqual(reopened.authoring.document, document());
  } finally { preview.unmount(); ui.unmount(); hook.unmount(); }
});

test('les commandes Tout, Récit et Consultation changent la visibilité sans éditer le projet', async () => {
  const { unifiedGraphFixture } = await import('./flamArrangedGraphFixture.mjs');
  const { GraphSurfaceControls } = await import('../src/components/AdvancedGraphCanvas/GraphSurfaceControls.jsx');
  const { FlamGraphPorts } = await import('../src/components/FlamWorkspace/FlamGraphPorts.jsx');
  const document = unifiedGraphFixture(); const before = structuredClone(document);
  const edits = [];
  const ui = runner(() => FlamGraph({ document, selection: { collection: 'screens', id: 'accueil' }, graphLayout: undefined,
    projectEpoch: 1, onSelect: value => edits.push(value), onLayout: value => edits.push(value), onAddScene() {}, onAddRoll() {}, onAddScreen() {}, onLink() {} }));
  const render = () => elements(ui.render());
  const button = label => render().find(e => e.props?.children === label && e.props?.['aria-pressed'] !== undefined);
  try {
    assert.equal(button('Tout').props['aria-pressed'], true);
    button('Récit').props.onClick(); assert.equal(button('Récit').props['aria-pressed'], true);
    assert.equal(button('Tout').props['aria-pressed'], false);
    let controls = render().find(e => e.type === GraphSurfaceControls);
    assert.equal(controls.props.arrangement.disabled, false);
    button('Consultation').props.onClick(); assert.equal(button('Consultation').props['aria-pressed'], true);
    assert.ok(render().some(e => e.type === FlamGraphPorts));
    controls = render().find(e => e.type === GraphSurfaceControls);
    assert.equal(controls.props.arrangement.disabled, false);
    assert.ok(controls.props.edgeFilters.some(filter => filter.group === 'consultation'));
    button('Tout').props.onClick(); assert.equal(button('Tout').props['aria-pressed'], true);
    assert.deepEqual(edits, []); assert.deepEqual(document, before);
  } finally { ui.unmount(); }
});
