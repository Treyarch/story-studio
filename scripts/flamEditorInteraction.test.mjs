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
  if (url.endsWith('/editors/AudioField.jsx')) return { format: 'module', source: 'export function AudioField() { return null; }', shortCircuit: true };
  if (url.endsWith('/editors/ImageField.jsx')) return { format: 'module', source: 'export function ImageField() { return null; }', shortCircuit: true };
  if (url.endsWith('.css')) return { format: 'module', source: '', shortCircuit: true };
  if (url.endsWith('.jsx')) return { format: 'module', source: `import * as UIReact from '${new URL('../node_modules/react/index.js', import.meta.url).href}';\n` + transformSync(fileURLToPath(url), readFileSync(fileURLToPath(url), 'utf8'), { jsx: { runtime: 'classic', pragma: 'UIReact.createElement', pragmaFrag: 'UIReact.Fragment' } }).code, shortCircuit: true };
  return next(url, context);
} });
register('./nodeSourceResolver.mjs', import.meta.url);
const { useProjectStore } = await import('../src/store/projectStore.js');
const { FlamWorkspace } = await import('../src/components/FlamWorkspace/FlamWorkspace.jsx');
const { ChoiceEditor } = await import('../src/components/FlamWorkspace/ChoiceEditor.jsx');
const { RuleEditor } = await import('../src/components/FlamWorkspace/RuleEditor.jsx');
const { suggestProjectName } = await import('../src/store/projectSaveName.js');
const resources = createTestI18n().options.resources;
i18next.init({ lng: 'fr', resources, initAsync: false, keySeparator: false, interpolation: { escapeValue: false } });
const elements = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(elements) : [node, ...elements(node.props?.children)];
const componentElements = element => {
  const hook = runner(() => element.type(element.props));
  try { return elements(hook.render()); } finally { hook.unmount(); }
};

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
