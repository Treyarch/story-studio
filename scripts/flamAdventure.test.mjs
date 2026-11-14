import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { register } from 'node:module';
import { runner } from './reactHookDriver.mjs';
import { createFlamProject, withFlamDocument } from '../src/store/flamAdventure/project.js';
import { decodeProjectFile, encodeProjectFile } from '../src/store/projectModel/codec.js';
import { createAdventureDocument, editAdventureDefinition } from '../src/store/flamAdventure/document.js';
import { diagnoseAdventureDocument } from '../src/store/flamAdventure/diagnostics.js';

const example = JSON.parse(await readFile(new URL('./fixtures/flam-adventure.json', import.meta.url), 'utf8'));
register('./nodeSourceResolver.mjs', import.meta.url);
const { useProjectStore } = await import('../src/store/projectStore.js');
const { createWorkSnapshot } = await import('../src/store/projectHelpers.js');
const { isProjectOpen, hasProjectTree, authoringWorkspaceMode } = await import('../src/store/projectWorkState.js');
const { buildToolbarInventory } = await import('../src/store/toolbarModel.js');
const { productionChain } = await import('../src/store/production/productionRouting.js');
const { projectToRustExport } = await import('../src/store/projectModel/schema.js');

test('une aventure conserve ses règles, ses identités et ses médias pendant deux cycles de fichier', async () => {
  const original = createFlamProject({ document: example, projectName: 'Mon aventure' });
  original.authoring.document.scenes[0].audio = './voix/depart.mp3';
  original.authoring.document.scenes[0].image = './images/depart.png';
  let current = original;
  for (let cycle = 0; cycle < 2; cycle += 1) {
    current = (await decodeProjectFile(encodeProjectFile(current))).project;
    assert.deepEqual(current, original);
  }
  assert.notEqual(original.storage.workId, original.authoring.document.id);
  assert.equal(original.authoring.document.saveVersion, 1);
});

test('le document ouvre les commandes de fichier sans permettre une génération Lunii', () => {
  const project = createFlamProject({ document: example });
  const mode = authoringWorkspaceMode(project);
  const toolbar = buildToolbarInventory({ workspaceMode: mode });
  for (const id of ['saveProject', 'saveProjectAs', 'openProject', 'newProject']) {
    assert.equal(toolbar.find(command => command.id === id)?.available, true, id);
  }
  assert.equal(toolbar.some(command => command.id === 'generate' && command.available), false);
  assert.equal(productionChain(mode), null);
  assert.throws(() => projectToRustExport(project), error => error.code === 'FLAM_CODEC_REQUIRED');
});

test('renommer un objet garde ses références, et annuler puis rétablir restaure le vrai projet', async () => {
  const hook = runner(() => useProjectStore(), { doubleInvokeStateUpdaters: true });
  let store = hook.render();
  store.loadProject(createFlamProject({ document: example }));
  store = hook.render();
  const original = encodeProjectFile(store.project);
  const snapshot = createWorkSnapshot(store.project);
  assert.equal(isProjectOpen(store.project), true);
  assert.equal(hasProjectTree(store.project), false);
  assert.equal(authoringWorkspaceMode(store.project), 'flam');
  store.setProject(project => withFlamDocument(project,
    editAdventureDefinition(project.authoring.document, { collection: 'items', id: 'cle', patch: { name: 'Clé dorée' } })));
  store = hook.render();
  const renamed = encodeProjectFile(store.project);
  assert.notEqual(createWorkSnapshot(store.project), snapshot);
  assert.equal(store.project.authoring.document.choices[3].effects[0].itemId, 'cle');
  assert.equal(store.project.authoring.document.items[0].name, 'Clé dorée');
  store.undo();
  store = hook.render();
  assert.equal(encodeProjectFile(store.project), original);
  store.redo();
  store = hook.render();
  assert.equal(encodeProjectFile(store.project), renamed);
  const reopened = (await decodeProjectFile(renamed)).project;
  assert.equal(reopened.authoring.document.items[0].name, 'Clé dorée');
  assert.throws(() => editAdventureDefinition(reopened.authoring.document, { collection: 'items', id: 'cle', patch: null }),
    error => error.code === 'REFERENCED_ADVENTURE_DEFINITION' && error.references.includes('/choices/3/effects/0/itemId'));
  assert.equal(encodeProjectFile(store.project), renamed, 'le refus ne modifie pas le projet');
});

test('un brouillon se sauvegarde et les diagnostics distinguent les erreurs des parcours à vérifier', async () => {
  const draft = createFlamProject({ document: createAdventureDocument() });
  const reopened = (await decodeProjectFile(encodeProjectFile(draft))).project;
  assert.deepEqual(reopened, draft);
  assert.ok(diagnoseAdventureDocument(reopened.authoring.document).some(d => d.code === 'MISSING_START' && d.severity === 'error'));

  const document = structuredClone(example);
  document.choices[3].effects[0].quantity = -1;
  document.rolls[0].outcomes = [{ min: 1, max: 12, destination: 'fin-lucioles' }, { min: 12, max: 19, destination: 'absente' }];
  document.scenes.push({ id: 'impasse', title: 'Une impasse', text: '', audio: null, image: null, ending: false, choices: [] });
  const diagnostics = diagnoseAdventureDocument(document);
  for (const [code, path] of [
    ['INVALID_QUANTITY', '/choices/3/effects/0/quantity'],
    ['ROLL_OVERLAP', '/rolls/0/outcomes/1'],
    ['ROLL_GAP', '/rolls/0/outcomes'],
    ['MISSING_REFERENCE', '/rolls/0/outcomes/1/destination'],
    ['NO_EXIT', '/scenes/6'],
  ]) assert.ok(diagnostics.some(d => d.code === code && d.path === path && d.severity === 'error'), `${code}: ${path}`);
  assert.ok(diagnostics.some(d => d.code === 'CONDITIONAL_EXITS' && d.path === '/scenes/2' && d.severity === 'warning'));
  assert.equal(diagnoseAdventureDocument(example).filter(d => d.severity === 'error').length, 0);
});

test('un format inconnu ou une structure invalide est refusé avant de résoudre les médias', async () => {
  for (const mutate of [
    p => { p.schemaVersion = 6; },
    p => { p.authoring.document.version = 2; },
    p => { p.authoring.document.scenes[1].id = 'depart'; },
    p => { p.authoring.document.choices[0].effects[0].type = 'script'; },
    p => { p.authoring.document.partie = { scene: 'fin' }; },
    p => { p.authoring.payload = '{}'; },
    p => { p.nativeGraph = {}; },
    p => { p.rootAudio = 'ambiance.mp3'; },
  ]) {
    const project = createFlamProject({ document: example });
    mutate(project);
    let resolved = false;
    await assert.rejects(decodeProjectFile(JSON.stringify(project), {
      resolveMediaPaths: value => { resolved = true; return value; },
    }), error => typeof error.code === 'string' && error.path.startsWith('/'));
    assert.equal(resolved, false);
  }
});
