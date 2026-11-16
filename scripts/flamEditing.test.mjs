import cytoscape from 'cytoscape';
import { flamGraphElements } from '../src/components/FlamWorkspace/flamGraph.js';
import { bindFlamGraphLayout, restoreFlamGraphLayout } from '../src/components/FlamWorkspace/flamGraphSync.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { runner } from './reactHookDriver.mjs';
import { createAdventureDocument } from '../src/store/flamAdventure/document.js';
import { createFlamProject } from '../src/store/flamAdventure/project.js';
import { createExampleAdventure } from '../src/store/flamAdventure/example.js';
import { adventureDiagnosticTarget, commitAdventureEdit } from '../src/store/flamAdventure/editing.js';
import { diagnoseAdventureDocument } from '../src/store/flamAdventure/diagnostics.js';
import { encodeProjectFile, decodeProjectFile } from '../src/store/projectModel/codec.js';
import { applyGeneratedAudioToTarget } from '../src/store/generatedAudioTarget.js';
import { useFlamProjectEntry } from '../src/hooks/useFlamProjectEntry.js';
register('./nodeSourceResolver.mjs', import.meta.url);
const { useProjectStore } = await import('../src/store/projectStore.js');
const { askSaveBeforeLeave } = await import('../src/hooks/saveBeforeLeave.js');

function mount(document = createAdventureDocument()) {
  const hook = runner(() => useProjectStore(), { doubleInvokeStateUpdaters: true });
  let store = hook.render();
  store.loadProject(createFlamProject({ document }));
  store = hook.render();
  const epoch = store.workEpochRef.current;
  return { hook, get store() { return store = hook.render(); },
    edit(command) { const result = commitAdventureEdit(store, epoch, command); store = hook.render(); return result; },
    get document() { return store.readProject().authoring.document; } };
}

test('création vide et exemple passent par une session neuve, sans conserver les médias du projet précédent', async () => {
  const mounted = mount();
  try {
    let landing;
    let paths;
    const snapshot = { current: 'old' };
    const start = useFlamProjectEntry({ store: mounted.store, savedSnapshotRef: snapshot, setMediaLibraryPaths: value => { paths = value; },
      runFunnelLanding: async (type, acquire, options) => { landing = { type, options }; await acquire(); } });
    await start({ example: true });
    const first = mounted.store.project;
    assert.equal(landing.type, 'flam');
    assert.equal(landing.options.applyProjectType, false);
    assert.equal(snapshot.current, null);
    assert.deepEqual(paths, []);
    assert.equal(mounted.store.isPristine(), true);
    assert.equal(diagnoseAdventureDocument(first.authoring.document).filter(d => d.severity === 'error').length, 0);
    await start({ example: true });
    assert.notEqual(mounted.store.project.authoring.document.id, first.authoring.document.id);
    await start();
    assert.equal(mounted.store.project.authoring.document.scenes.length, 0);
    assert.equal(mounted.store.canUndo, false);
  } finally { mounted.hook.unmount(); }
});

test('les gestes recréent une aventure depuis un brouillon et conservent les règles après sauvegarde et historique', async () => {
  const mounted = mount();
  try {
    for (const [collection, id] of [['scenes', 'start'], ['scenes', 'end'], ['classes', 'tracker'], ['items', 'key'], ['events', 'door'], ['rewards', 'chest'], ['rolls', 'roll']]) mounted.edit({ type: 'add', collection, id });
    const patch = (collection, id, changes) => mounted.edit({ type: 'patch', collection, id, patch: changes });
    patch('scenes', 'start', { title: 'Départ', text: 'Un coffre et une porte.', audio: '/voix/depart.mp3', image: '/images/depart.png' });
    patch('scenes', 'end', { title: 'Les lucioles', ending: true });
    mounted.edit({ type: 'document', patch: { title: 'Mon aventure', startSceneId: 'start' } });
    patch('items', 'key', { name: 'Clé' });
    patch('classes', 'tracker', { name: 'Pisteur' });
    patch('events', 'door', { name: 'Porte ouverte' });
    patch('rewards', 'chest', { name: 'Le coffre', effects: [{ type: 'giveItem', itemId: 'key', quantity: 1 }] });
    patch('rolls', 'roll', { name: 'Rencontre', outcomes: [{ min: 1, max: 10, destination: 'end' }, { min: 11, max: 20, destination: 'end' }] });
    const beforeChoice = encodeProjectFile(mounted.store.project);
    mounted.edit({ type: 'add', collection: 'choices', id: 'open', sceneId: 'start' });
    mounted.store.undo();
    assert.equal(encodeProjectFile(mounted.store.project), beforeChoice, 'création et rattachement du choix se défont ensemble');
    mounted.store.redo();
    assert.deepEqual(mounted.store.project.authoring.document.scenes[0].choices, ['open']);
    patch('choices', 'open', { label: 'Ouvrir', destination: null, rollId: 'roll', rewardId: 'chest',
      conditions: [{ type: 'class', classId: 'tracker' }, { type: 'item', itemId: 'key', quantity: 1 }, { type: 'event', eventId: 'door', present: false }],
      effects: [{ type: 'chooseClass', classId: 'tracker' }, { type: 'consumeItem', itemId: 'key', quantity: 1 }, { type: 'setEvent', eventId: 'door' }],
      unavailable: { mode: 'disabled', explanation: 'Trouve la clé.' } });
    const beforeRename = encodeProjectFile(mounted.store.project);
    patch('items', 'key', { name: 'Clé dorée' });
    const renamed = encodeProjectFile(mounted.store.project);
    mounted.store.undo();
    assert.equal(encodeProjectFile(mounted.store.project), beforeRename);
    mounted.store.redo();
    assert.equal(encodeProjectFile(mounted.store.project), renamed);
    const reopened = (await decodeProjectFile(renamed)).project;
    assert.deepEqual(reopened.authoring.document, mounted.document);
    assert.equal(reopened.authoring.document.choices[0].effects[1].itemId, 'key');
    assert.equal(diagnoseAdventureDocument(mounted.document).filter(d => d.severity === 'error').length, 0);
    assert.throws(() => mounted.edit({ type: 'remove', collection: 'items', id: 'key' }), error => error.code === 'REFERENCED_ADVENTURE_DEFINITION');
    assert.equal(encodeProjectFile(mounted.store.project), renamed);
    mounted.edit({ type: 'removeChoice', id: 'open', sceneId: 'start' });
    assert.equal(mounted.document.choices.length, 0);
    mounted.store.undo();
    assert.equal(encodeProjectFile(mounted.store.project), renamed);
  } finally { mounted.hook.unmount(); }
});

test('diagnostics localisés et brouillons restent sauvegardables ; un résultat différé ne recrée pas une scène supprimée', async () => {
  const mounted = mount(createExampleAdventure());
  try {
    const choice = mounted.document.choices[0];
    mounted.edit({ type: 'patch', collection: 'choices', id: choice.id, patch: { destination: 'absent' } });
    const diagnostic = diagnoseAdventureDocument(mounted.document).find(d => d.code === 'MISSING_REFERENCE');
    assert.deepEqual(adventureDiagnosticTarget(mounted.document, diagnostic.path), { collection: 'choices', id: choice.id });
    assert.deepEqual((await decodeProjectFile(encodeProjectFile(mounted.store.project))).project.authoring.document, mounted.document);
    mounted.edit({ type: 'add', collection: 'scenes', id: 'temporary' });
    mounted.edit({ type: 'remove', collection: 'scenes', id: 'temporary' });
    assert.equal(mounted.edit({ type: 'patch', collection: 'scenes', id: 'temporary', patch: { audio: 'late.mp3' } }).status, 'stale');
    const store = mounted.store;
    const epoch = store.workEpochRef.current;
    let applied = 0;
    const target = { kind: 'flamScene', projectEpoch: epoch, apply: () => applied++ };
    applyGeneratedAudioToTarget({ target, path: '/voice.mp3', store });
    assert.equal(applied, 1);
    store.loadProject(createFlamProject());
    assert.equal(commitAdventureEdit(store, epoch, { type: 'document', patch: { title: 'stale' } }).status, 'stale');
    applyGeneratedAudioToTarget({ target, path: '/late.mp3', store });
    assert.equal(applied, 1);
  } finally { mounted.hook.unmount(); }
});

test('la garde ordinaire de fermeture demande de conserver un brouillon FLAM modifié', async () => {
  const mounted = mount();
  try {
    mounted.store.markPristine();
    const readWork = () => ({ project: mounted.store.project, pristine: mounted.store.isPristine(), savedSnapshot: null, mediaLibraryPaths: [], mediaTags: {} });
    let asked = 0;
    const cancel = async () => { asked++; return 'cancel'; };
    assert.equal(await askSaveBeforeLeave(readWork, null, cancel), true);
    assert.equal(asked, 0);
    mounted.edit({ type: 'document', patch: { title: 'Brouillon à conserver' } });
    assert.equal(await askSaveBeforeLeave(readWork, null, cancel), false);
    assert.equal(asked, 1);
    assert.equal(await askSaveBeforeLeave(readWork, null, async () => 'discard'), true);
  } finally { mounted.hook.unmount(); }
});

test('relier depuis le graphe crée un choix atomique, annulable et sauvegardable', async () => {
  const mounted = mount(createExampleAdventure());
  try {
    mounted.edit({ type: 'connect', id: 'lien-graphe', sceneId: 'clairiere', targetCollection: 'scenes', targetId: 'sentier' });
    let doc = mounted.store.readProject().authoring.document;
    assert.ok(doc.scenes.find(s => s.id === 'clairiere').choices.includes('lien-graphe'));
    assert.equal(doc.choices.find(c => c.id === 'lien-graphe').destination, 'sentier');
    mounted.store.undo();
    doc = mounted.store.readProject().authoring.document;
    assert.ok(!doc.choices.some(c => c.id === 'lien-graphe'));
    assert.ok(!doc.scenes.find(s => s.id === 'clairiere').choices.includes('lien-graphe'));
    mounted.store.redo();
    assert.ok(mounted.store.readProject().authoring.document.choices.some(c => c.id === 'lien-graphe'));
    mounted.edit({ type: 'connect', id: 'vers-de', sceneId: 'sentier', targetCollection: 'rolls', targetId: 'rencontre' });
    const choice = mounted.store.readProject().authoring.document.choices.find(c => c.id === 'vers-de');
    assert.equal(choice.rollId, 'rencontre');
    assert.equal(choice.destination, null);
    const saved = encodeProjectFile(mounted.store.readProject());
    assert.deepEqual((await decodeProjectFile(saved)).project.authoring.document, mounted.store.readProject().authoring.document);
  } finally { mounted.hook.unmount(); }
});


test('déplacer une carte marque le projet modifié, survit à une édition et restaure le placement à la réouverture', async () => {
  const mounted = mount(createExampleAdventure());
  const labels = { start: 'Départ', ending: 'Fin', roll: 'Dé', untitled: 'Sans titre', conditional: 'Condition' };
  const cy = cytoscape({ headless: true, elements: flamGraphElements(mounted.document, labels) });
  const unbind = bindFlamGraphLayout(cy, positions => mounted.edit({ type: 'layout', positions }));
  try {
    mounted.store.markPristine();
    cy.getElementById('scenes:depart').position({ x: -321.5, y: 654.25 });
    cy.getElementById('rolls:rencontre').position({ x: 90, y: -45 });
    cy.getElementById('scenes:depart').emit('dragfree');
    assert.equal(mounted.store.isPristine(), false);
    const layout = structuredClone(mounted.store.readProject().authoring.graphLayout);
    mounted.store.undo();
    assert.equal(mounted.store.readProject().authoring.graphLayout, undefined);
    mounted.store.redo();
    assert.deepEqual(mounted.store.readProject().authoring.graphLayout, layout);
    mounted.edit({ type: 'patch', collection: 'scenes', id: 'depart', patch: { title: 'Un autre titre' } });
    assert.deepEqual(mounted.store.readProject().authoring.graphLayout, layout);
    const reopened = (await decodeProjectFile(encodeProjectFile(mounted.store.readProject()))).project;
    const restored = cytoscape({ headless: true, elements: flamGraphElements(reopened.authoring.document, labels) });
    try {
      restoreFlamGraphLayout(restored, reopened.authoring.graphLayout);
      assert.deepEqual(restored.getElementById('scenes:depart').position(), { x: -321.5, y: 654.25 });
      assert.deepEqual(restored.getElementById('rolls:rencontre').position(), { x: 90, y: -45 });
    } finally { restored.destroy(); }
    const epoch = mounted.store.workEpochRef.current;
    mounted.store.loadProject(createFlamProject());
    assert.equal(commitAdventureEdit(mounted.store, epoch, { type: 'layout', positions: layout.positions }).status, 'stale');
  } finally { unbind(); cy.destroy(); mounted.hook.unmount(); }
});

test('les placements invalides sont refusés et supprimer une définition retire son placement', () => {
  const mounted = mount(createExampleAdventure());
  try {
    const valid = { collection: 'scenes', id: 'depart', x: 50, y: 60 };
    for (const positions of [[{ ...valid, x: NaN }], [{ ...valid, y: Infinity }], [valid, valid], [{ ...valid, id: 'absente' }]]) {
      assert.throws(() => mounted.edit({ type: 'layout', positions }));
    }
    mounted.edit({ type: 'add', collection: 'scenes', id: 'isolée' });
    mounted.edit({ type: 'layout', positions: [valid, { collection: 'scenes', id: 'isolée', x: -2, y: 3 }] });
    mounted.edit({ type: 'remove', collection: 'scenes', id: 'isolée' });
    assert.deepEqual(mounted.store.readProject().authoring.graphLayout.positions, [valid]);
    mounted.store.undo();
    assert.equal(mounted.store.readProject().authoring.graphLayout.positions.length, 2);
  } finally { mounted.hook.unmount(); }
});

const { flamLinkPorts, planFlamGraphLink } = await import('../src/store/flamAdventure/graphLinks.js');

test('rebrancher un choix ou une plage conserve les règles et survit à l’historique et à la sauvegarde', async () => {
  const mounted = mount(createExampleAdventure());
  try {
    const before = structuredClone(mounted.document);
    const port = flamLinkPorts(before, 'scenes', 'clairiere').find(p => p.choiceId === 'prendre-cle');
    const plan = planFlamGraphLink(mounted.document, port, { collection: 'rolls', id: 'rencontre' });
    mounted.edit(plan.command);
    const changed = mounted.document.choices.find(c => c.id === 'prendre-cle');
    const original = before.choices.find(c => c.id === 'prendre-cle');
    assert.deepEqual(changed, { ...original, destination: null, rollId: 'rencontre' });
    mounted.store.undo(); assert.deepEqual(mounted.document, before);
    mounted.store.redo(); assert.equal(mounted.document.choices.find(c => c.id === 'prendre-cle').rollId, 'rencontre');
    const outcome = flamLinkPorts(mounted.document, 'rolls', 'rencontre')[0];
    mounted.edit(planFlamGraphLink(mounted.document, outcome, { collection: 'scenes', id: 'sentier' }).command);
    const saved = (await decodeProjectFile(encodeProjectFile(mounted.store.readProject()))).project;
    assert.equal(saved.authoring.document.rolls[0].outcomes[0].destination, 'sentier');
    assert.equal(saved.authoring.document.rolls[0].outcomes[0].min, 1);
    assert.equal(saved.authoring.document.rolls[0].outcomes[0].max, 10);
    assert.equal(saved.authoring.document.choices.find(c => c.id === 'prendre-cle').rewardId, original.rewardId);
  } finally { mounted.hook.unmount(); }
});

test('créer dans le vide pose le nœud et son lien en une seule étape et une seule sauvegarde', async () => {
  const mounted = mount(createExampleAdventure());
  try {
    const before = structuredClone(mounted.store.readProject());
    mounted.edit({ type: 'linkNew', id: 'nouveau-choix', targetCollection: 'scenes', targetId: 'nouvelle-scene',
      name: 'La cabane', port: { key: 'add', kind: 'add', sceneId: 'clairiere' },
      position: { x: -120, y: 450 }, positions: [{ collection: 'scenes', id: 'clairiere', x: 200, y: 100 }] });
    assert.equal(mounted.document.scenes.find(s => s.id === 'nouvelle-scene').title, 'La cabane');
    assert.equal(mounted.document.choices.find(c => c.id === 'nouveau-choix').destination, 'nouvelle-scene');
    assert.ok(mounted.document.scenes.find(s => s.id === 'clairiere').choices.includes('nouveau-choix'));
    assert.deepEqual(mounted.store.readProject().authoring.graphLayout.positions.at(-1), { collection: 'scenes', id: 'nouvelle-scene', x: -120, y: 450 });
    mounted.store.undo(); assert.deepEqual(mounted.store.readProject(), before);
    mounted.store.redo();
    const saved = (await decodeProjectFile(encodeProjectFile(mounted.store.readProject()))).project;
    assert.equal(saved.authoring.document.choices.find(c => c.id === 'nouveau-choix').destination, 'nouvelle-scene');
    assert.equal(saved.authoring.graphLayout.positions.at(-1).x, -120);
    const port = flamLinkPorts(mounted.document, 'rolls', 'rencontre')[0];
    const current = structuredClone(mounted.store.readProject());
    assert.throws(() => mounted.edit({ type: 'linkNew', id: 'interdit', targetCollection: 'rolls', targetId: 'dé-interdit',
      name: 'Dé interdit', port, position: { x: 0, y: 0 } }));
    assert.deepEqual(mounted.store.readProject(), current);
  } finally { mounted.hook.unmount(); }
});

test('créer une scène depuis une plage de dé rebranche cette plage sans ajouter de choix', () => {
  const mounted = mount(createExampleAdventure());
  try {
    const before = structuredClone(mounted.store.readProject());
    const port = flamLinkPorts(mounted.document, 'rolls', 'rencontre')[0];
    mounted.edit({ type: 'linkNew', id: 'identifiant-inutilisé', targetCollection: 'scenes', targetId: 'fin-nouvelle',
      name: 'Un autre chemin', port, position: { x: 20, y: 50 }, positions: [] });
    assert.deepEqual(mounted.document.rolls[0].outcomes[0], { min: 1, max: 10, destination: 'fin-nouvelle' });
    assert.deepEqual(mounted.document.choices, before.authoring.document.choices);
    mounted.store.undo(); assert.deepEqual(mounted.store.readProject(), before);
  } finally { mounted.hook.unmount(); }
});


test('la relance de narration est optionnelle dans les anciens documents et conservée à la réouverture', async () => {
  const mounted = mount(createExampleAdventure());
  try {
    const id = mounted.document.choices[0].id;
    assert.equal(mounted.document.choices[0].replayAudioOnReturn, undefined);
    mounted.edit({ type: 'patch', collection: 'choices', id, patch: { replayAudioOnReturn: false } });
    const reopened = (await decodeProjectFile(encodeProjectFile(mounted.store.project))).project;
    assert.equal(reopened.authoring.document.choices[0].replayAudioOnReturn, false);
    assert.throws(() => mounted.edit({ type: 'patch', collection: 'choices', id, patch: { replayAudioOnReturn: null } }), error => error.path === '/choices/0/replayAudioOnReturn');
    mounted.edit({ type: 'add', collection: 'choices', id: 'nouveau', sceneId: mounted.document.scenes[0].id });
    assert.equal(mounted.document.choices.at(-1).replayAudioOnReturn, true);
  } finally { mounted.hook.unmount(); }
});
