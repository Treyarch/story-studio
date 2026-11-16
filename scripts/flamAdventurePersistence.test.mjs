import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createDiskHarness } from './tauriDiskHarness.mjs';
import { createFlamProject } from '../src/store/flamAdventure/project.js';

const io = await import('../src/store/projectIO.js');
const { isProjectWorthAutosaving } = await import('../src/store/autosaveDecision.js');
const { collectMediaLibrary, isMediaHeldByProject } = await import('../src/store/mediaLibrary.js');
const { KEYS } = await import('../src/store/persistentSettings.js');
const example = JSON.parse(await fs.readFile(new URL('../src/store/flamAdventure/example.json', import.meta.url), 'utf8'));

test('sauvegarde, déplacement, Enregistrer sous et reprise de session conservent les règles et médias FLAM', async () => {
  const harness = await createDiskHarness();
  harness.settings.setItem(KEYS.WORKSPACE_DIR, harness.workspace);
  try {
    const directory = await harness.mkdirp('aventure');
    await harness.writeFile('aventure/intro.mp3', 'audio');
    await harness.writeFile('aventure/image.png', 'image');
    const project = createFlamProject({ document: example, projectName: 'Les compagnons' });
    project.authoring.document.scenes[0].audio = `${directory}/intro.mp3`;
    project.authoring.document.scenes[0].image = `${directory}/image.png`;
    await io.saveProject(project, `${directory}/aventure.mbah`);
    const written = JSON.parse(await fs.readFile(`${directory}/aventure.mbah`, 'utf8'));
    assert.equal(written.authoring.document.scenes[0].audio, './intro.mp3');
    assert.equal(written.authoring.document.scenes[0].image, './image.png');

    await fs.rename(directory, harness.dir('deplacee'));
    const source = harness.dir('deplacee/aventure.mbah');
    const reopened = await io.loadProjectFromPath(source);
    assert.equal(reopened.data.authoring.document.scenes[0].audio, harness.dir('deplacee/intro.mp3'));
    assert.equal(reopened.data.authoring.document.id, example.id);
    assert.deepEqual(reopened.data.authoring.document.choices, example.choices);
    const media = collectMediaLibrary({ project: reopened.data });
    assert.equal(media.length, 2);
    assert.ok(media.every(isMediaHeldByProject), 'un média utilisé ne peut pas être supprimé comme inutilisé');

    const copyDirectory = await harness.mkdirp('copie');
    harness.answerSave(`${copyDirectory}/copie.mbah`);
    const copied = await io.saveProjectAs(reopened.data, source);
    const reloadedCopy = await io.loadProjectFromPath(copied.path);
    assert.deepEqual(reloadedCopy.data.authoring.document, reopened.data.authoring.document);
    assert.deepEqual(JSON.parse(await fs.readFile(source, 'utf8')), written);

    const sessionDirectory = await harness.mkdirp('session');
    assert.equal(isProjectWorthAutosaving(reloadedCopy.data), true);
    const snapshot = `${sessionDirectory}/.session-recovery.mbah`;
    assert.ok(await io.autoSaveEphemeralProject(reloadedCopy.data, sessionDirectory, snapshot));
    const preview = await io.previewProjectFromPath(snapshot);
    assert.equal(preview.authoringMode, 'flam');
    const recovered = await io.loadProjectFromPath(snapshot);
    assert.deepEqual(recovered.data.authoring.document, reopened.data.authoring.document);
    assert.equal(harness.countCalls('validate_advanced_payload'), 0);
  } finally {
    await harness.dispose();
  }
});

test('le placement des scènes et du dé survit à la sauvegarde, Enregistrer sous et la reprise de session', async () => {
  const harness = await createDiskHarness();
  harness.settings.setItem(KEYS.WORKSPACE_DIR, harness.workspace);
  try {
    const directory = await harness.mkdirp('placement');
    const project = createFlamProject({ document: example });
    const layout = { version: 1, positions: [
      { collection: 'scenes', id: 'depart', x: -321.5, y: 654.25 },
      { collection: 'rolls', id: 'rencontre', x: 987, y: -42 },
    ] };
    project.authoring.graphLayout = layout;
    const path = `${directory}/aventure.mbah`;
    await io.saveProject(project, path);
    const reopened = (await io.loadProjectFromPath(path)).data;
    assert.deepEqual(reopened.authoring.graphLayout, layout);
    harness.answerSave(`${directory}/copie.mbah`);
    const copied = await io.saveProjectAs(reopened, path);
    assert.deepEqual((await io.loadProjectFromPath(copied.path)).data.authoring.graphLayout, layout);
    const snapshot = `${directory}/.session-recovery.mbah`;
    assert.ok(await io.autoSaveEphemeralProject(reopened, directory, snapshot));
    assert.deepEqual((await io.loadProjectFromPath(snapshot)).data.authoring.graphLayout, layout);
  } finally { await harness.dispose(); }
});

test('les médias du menu, des rubriques, des chapitres et des objets suivent le déplacement du projet', async () => {
  const { presentationFixture } = await import('./flamPresentationFixture.mjs');
  const harness = await createDiskHarness();
  harness.settings.setItem(KEYS.WORKSPACE_DIR, harness.workspace);
  try {
    const directory = await harness.mkdirp('presentation');
    await harness.writeFile('presentation/image.png', 'image');
    await harness.writeFile('presentation/voix.mp3', 'audio');
    const document = presentationFixture();
    for (const scene of document.scenes) { scene.audio = null; scene.image = null; }
    const image = `${directory}/image.png`;
    document.presentation.image = image;
    document.presentation.sections[0].image = image;
    document.presentation.sections[3].entries[0].image = image;
    document.presentation.sections[3].entries[0].audio = `${directory}/voix.mp3`;
    document.presentation.chapters[0].image = image;
    document.items[0].image = image;
    const project = createFlamProject({ document });
    await io.saveProject(project, `${directory}/aventure.mbah`);
    const written = JSON.parse(await fs.readFile(`${directory}/aventure.mbah`, 'utf8'));
    assert.equal(written.authoring.document.presentation.sections[3].entries[0].audio, './voix.mp3');
    assert.equal(written.authoring.document.presentation.chapters[0].image, './image.png');
    await fs.rename(directory, harness.dir('presentation-deplacee'));
    const loaded = (await io.loadProjectFromPath(harness.dir('presentation-deplacee/aventure.mbah'))).data;
    assert.equal(loaded.authoring.document.items[0].image, harness.dir('presentation-deplacee/image.png'));
    assert.equal(loaded.authoring.document.presentation.image, harness.dir('presentation-deplacee/image.png'));
    assert.equal(loaded.authoring.document.presentation.sections[3].entries[0].audio, harness.dir('presentation-deplacee/voix.mp3'));
    const media = collectMediaLibrary({ project: loaded });
    assert.equal(media.length, 2);
    assert.ok(media.every(isMediaHeldByProject));
  } finally { await harness.dispose(); }
});
