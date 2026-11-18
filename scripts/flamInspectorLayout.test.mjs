import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const { mountSurface } = await import('./chromeBench.mjs');
const { GraphPanelHeader } = await import('../src/workspace/GraphWorkspacePanels.jsx');

test('en-tête FLAM : onglets et fermeture accessibles à 200 et 800 px en FR/EN/IT', {
  skip: !process.env.CHROME_BIN && 'Renseigner CHROME_BIN pour vérifier la géométrie dans Chromium.',
}, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'flam-settings-layout-'));
  try {
    const styles = await Promise.all([
      'src/styles/variables.css', 'src/styles/layout.css',
      'src/components/AdvancedWorkspace/AdvancedWorkspace.css',
      'src/components/FlamWorkspace/FlamWorkspace.css',
    ].map(path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')));
    const panels = [];
    for (const language of ['fr', 'en', 'it']) {
      const labels = JSON.parse(await readFile(new URL(`../src/locales/${language}/common.json`, import.meta.url), 'utf8'));
      for (const key of ['flam.settings.selection', 'flam.scene', 'flam.screens.menu', 'flam.screens.detail', 'flam.grid.title', 'flam.character.title',
        'flam.class', 'flam.item', 'flam.event', 'flam.reward', 'flam.roll', 'flam.choices']) for (const width of [200, 800]) {
        const { html } = mountSurface(React.createElement('section', {
          className: 'advanced-panel flam-settings-panel', style: { width }, 'data-case': `${language}-${key}-${width}`,
        }, React.createElement(GraphPanelHeader, { title: labels['workspace.settings.label'], onClose() {},
          actions: React.createElement('div', { className: 'flam-settings-tabs', role: 'tablist' },
            React.createElement('button', { role: 'tab', 'aria-selected': true }, labels['flam.settings.adventure']),
            React.createElement('button', { role: 'tab', 'aria-selected': false }, labels[key])) }),
        React.createElement('aside', { className: 'advanced-inspector flam-inspector', hidden: true }, 'masqué')));
        panels.push(html);
      }
    }
    const html = `<!doctype html><meta charset="utf-8"><style>${styles.join('\n')}</style>${panels.join('\n')}
      <pre id="result"></pre><script>
      const results = [...document.querySelectorAll('[data-case]')].map(panel => {
        const header = panel.querySelector('header').getBoundingClientRect();
        const buttons = [...panel.querySelectorAll('button')].map(button => {
          const rect = button.getBoundingClientRect();
          return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
            width: rect.width, scrollWidth: button.scrollWidth, clientWidth: button.clientWidth };
        });
        return { name: panel.dataset.case, left: header.left, right: header.right,
          top: header.top, bottom: header.bottom, buttons,
          hidden: getComputedStyle(panel.querySelector('aside')).display };
      });
      document.getElementById('result').textContent = JSON.stringify(results);
      </script>`;
    const path = join(directory, 'layout.html');
    await writeFile(path, html);
    const { stdout } = await promisify(execFile)(process.env.CHROME_BIN, [
      '--headless', '--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server',
      `--user-data-dir=${join(directory, 'profile')}`, '--dump-dom', '--virtual-time-budget=1000', pathToFileURL(path).href,
    ], { timeout: 20000, maxBuffer: 1024 * 1024 });
    const results = JSON.parse(stdout.match(/<pre id="result">([^<]+)<\/pre>/)?.[1] ?? 'null');
    assert.equal(results?.length, 72);
    for (const result of results) {
      assert.equal(result.hidden, 'none', result.name);
      assert.equal(result.buttons.length, 3, result.name);
      for (const button of result.buttons) {
        assert.ok(button.width > 0 && button.left >= result.left && button.right <= result.right, result.name);
        assert.ok(button.top >= result.top && button.bottom <= result.bottom, result.name);
        assert.ok(button.scrollWidth <= button.clientWidth, `${result.name} : texte tronqué ${JSON.stringify(button)}`);
      }
      assert.ok(result.buttons[0].right <= result.buttons[1].left, result.name);
      assert.ok(result.buttons[1].right <= result.buttons[2].left, result.name);
    }
  } finally { await rm(directory, { recursive: true, force: true, maxRetries: 5 }); }
});
