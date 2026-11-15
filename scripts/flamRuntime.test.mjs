import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, copyFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { compileAdventureData } from '../src/flamRuntime/compile.js';

import { fixture } from './flamRuntimeFixture.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

const example = JSON.parse(await readFile(new URL('../src/store/flamAdventure/example.json', import.meta.url), 'utf8'));

for (const audio of [false, true]) {
  test(`le vrai runtime Lua exécute les données générées ${audio ? 'avec' : 'sans'} narration`, async () => {
    const folder = await mkdtemp(path.join(tmpdir(), 'flam-runtime-'));
    try {
      const source = path.join(root, 'src/flamRuntime/lua');
      for (const name of await readdir(source)) await copyFile(path.join(source, name), path.join(folder, name));
      await writeFile(path.join(folder, 'adventure_data.lua'), compileAdventureData(fixture(audio)));
      const result = spawnSync('lua', [path.join(root, 'scripts/check-flam-runtime.lua'), folder], { encoding: 'utf8' });
      assert.equal(result.status, 0, `${result.error || ''}\n${result.stdout}\n${result.stderr}`);
      assert.match(result.stdout, /OK : parcours complet/);
    } finally {
      await rm(folder, { recursive: true, force: true });
    }
  });
}

test('les brouillons et versions inconnues ne deviennent pas des données exécutables', () => {
  const document = structuredClone(example);
  document.rolls[0].outcomes[0].max = 9;
  assert.throws(() => compileAdventureData(document), error => error.diagnostics.some(entry => entry.code === 'ROLL_GAP'));
  assert.throws(() => compileAdventureData({ ...example, version: 2 }), /UNSUPPORTED_ADVENTURE_VERSION/);
});
