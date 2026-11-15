import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/experimental';
import { runner } from './reactHookDriver.mjs';
import i18next from 'i18next';
import { createTestI18n } from './i18nTestSetup.mjs';
import { createExampleAdventure } from '../src/store/flamAdventure/example.js';

const calls = [];
let invoke = async command => command === 'generate_flam_adventure' ? '/exports/adventure.flam' : { backupPath: '/backups/receipt' };
let open = async () => '/selected';
let confirm = async () => true;
let error;
let unsubscribed = 0;
globalThis.__flamProduction = {
  invoke: (command, args) => { calls.push({ command, args }); return invoke(command, args); },
  open: () => open(),
  listen: async () => () => { unsubscribed += 1; },
  dialog: { showErrorDialog: value => { error = value; }, showConfirmDialog: () => confirm() },
};
registerHooks({
  resolve(specifier, context, next) {
    const exports = {
      '@tauri-apps/api/core': 'export const invoke = (...args) => globalThis.__flamProduction.invoke(...args);',
      '@tauri-apps/api/event': 'export const listen = (...args) => globalThis.__flamProduction.listen(...args);',
      '@tauri-apps/plugin-dialog': 'export const open = (...args) => globalThis.__flamProduction.open(...args);',
    };
    if (exports[specifier]) return { url: `data:text/javascript,${encodeURIComponent(exports[specifier])}`, shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith('/common/Dialog.jsx')) return { format: 'module', source: 'export const useErrorDialog = () => globalThis.__flamProduction.dialog;', shortCircuit: true };
    if (url.endsWith('.jsx')) return { format: 'module', source: `import * as UIReact from '${new URL('../node_modules/react/index.js', import.meta.url).href}';\n` + transformSync(fileURLToPath(url), readFileSync(fileURLToPath(url), 'utf8'), { jsx: { runtime: 'classic', pragma: 'UIReact.createElement', pragmaFrag: 'UIReact.Fragment' } }).code, shortCircuit: true };
    return next(url, context);
  },
});
const { FlamProduction } = await import('../src/components/FlamWorkspace/FlamProduction.jsx');
i18next.init({ lng: 'fr', resources: createTestI18n().options.resources, initAsync: false, keySeparator: false, interpolation: { escapeValue: false } });
const elements = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(elements) : [node, ...elements(node.props?.children)];
function setup() {
  calls.length = 0; error = null; unsubscribed = 0;
  invoke = async command => command === 'generate_flam_adventure' ? '/exports/adventure.flam' : { backupPath: '/backups/receipt' };
  open = async () => '/selected'; confirm = async () => true;
  let document = createExampleAdventure();
  const ui = runner(() => FlamProduction({ document }));
  const render = () => { const tree = ui.render(); ui.flush(); return elements(tree); };
  const button = key => render().find(e => e.props?.children === i18next.t(`common:flam.production.${key}`) && e.props?.onClick);
  render();
  return { ui, render, button, update: next => { document = next(document); render(); } };
}

test('générer ne transfère rien ; installer exige un pack courant et une confirmation', async () => {
  const f = setup();
  try {
    assert.equal(f.button('install').props.disabled, true);
    await f.button('generate').props.onClick();
    assert.deepEqual(calls.map(c => c.command), ['generate_flam_adventure']);
    assert.equal(f.button('install').props.disabled, false);
    confirm = async () => false;
    await f.button('install').props.onClick();
    assert.equal(calls.length, 1);
    confirm = async () => true;
    await f.button('install').props.onClick();
    assert.equal(calls.at(-1).command, 'install_flam_adventure');
    assert.equal(calls.at(-1).args.packFolder, '/exports/adventure.flam');
    f.update(doc => ({ ...doc, title: 'Titre modifié' }));
    assert.equal(f.button('install').props.disabled, true);
    assert.equal(unsubscribed, 3);
  } finally { f.ui.unmount(); }
});

test('erreurs, diagnostics et annulation ne présentent pas de nouveau pack prêt', async () => {
  const f = setup();
  try {
    invoke = async () => { throw { code: 'MediaUnavailable' }; };
    await f.button('generate').props.onClick();
    assert.match(error.message, /média/);
    assert.equal(f.button('install').props.disabled, true);
    assert.equal(unsubscribed, 1);
    f.update(doc => ({ ...doc, startSceneId: null }));
    assert.equal(f.button('generate').props.disabled, true);
  } finally { f.ui.unmount(); }
});

test('une génération active est unique et son démontage demande son annulation', async () => {
  const f = setup();
  let finish;
  invoke = command => command === 'generate_flam_adventure' ? new Promise(resolve => { finish = resolve; }) : Promise.resolve();
  const running = f.button('generate').props.onClick();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.button('generate').props.disabled, true);
  await f.button('generate').props.onClick();
  assert.equal(calls.filter(c => c.command === 'generate_flam_adventure').length, 1);
  f.ui.unmount();
  assert.equal(calls.at(-1).command, 'cancel_flam_authoring');
  finish('/exports/late.flam'); await running;
  assert.equal(unsubscribed, 1);
});
