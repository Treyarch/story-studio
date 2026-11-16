import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, copyFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { compileAdventureData } from '../src/flamRuntime/compile.js';
import { presentationFixture } from './flamPresentationFixture.mjs';

test('le pack illustré propose son menu sans perdre la partie pendant la consultation', async () => {
  const folder = await mkdtemp(path.join(tmpdir(), 'flam-presentation-'));
  try {
    const source = new URL('../src/flamRuntime/lua/', import.meta.url);
    for (const name of await readdir(source)) await copyFile(new URL(name, source), path.join(folder, name));
    await writeFile(path.join(folder, 'adventure_data.lua'), compileAdventureData(presentationFixture()));
    const result = spawnSync('lua', ['scripts/check-flam-presentation.lua', folder], { encoding: 'utf8' });
    assert.equal(result.status, 0, `${result.error || ''}\n${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /OK : menu illustré/);
  } finally { await rm(folder, { recursive: true, force: true }); }
});
