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
