// npm ci --prefix e2e
// CHROMIUM_EXECUTABLE_PATH=/chemin/vers/chrome node --test e2e/browser/flamGraphPorts.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import react from '@vitejs/plugin-react';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const fixture = `<!doctype html><html><body><div id="root"></div><script type="module">
import React from 'react';
import { createRoot } from 'react-dom/client';
import { FlamGraph } from '/src/components/FlamWorkspace/FlamGraph.jsx';
import { createExampleAdventure } from '/src/store/flamAdventure/example.js';
import '/src/components/AdvancedGraphCanvas/AdvancedGraphCanvas.css';
import '/src/components/FlamWorkspace/FlamWorkspace.css';
createRoot(document.getElementById('root')).render(React.createElement(FlamGraph, {
  document: createExampleAdventure(), selection: { collection: 'scenes', id: 'depart' },
  onSelect() {}, onLayout() {}, projectEpoch: 1,
}));
</script><style>#root { height: 700px; display: flex; flex-direction: column; }
.flam-graph { height: 600px; flex: 1; }</style></body></html>`;

test('les prises FLAM rejoignent le bloc dans la même image pendant le déplacement et le zoom', async () => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'flam-ports-vite-'));
  const server = await createServer({
    configFile: false, cacheDir, root: fileURLToPath(new URL('../../', import.meta.url)),
    server: { port: 0, hmr: false }, plugins: [react(), {
      name: 'flam-ports-fixture',
      configureServer(vite) {
        vite.middlewares.use('/flam-ports-test', async (_request, response) => {
          response.setHeader('Content-Type', 'text/html');
          response.end(await vite.transformIndexHtml('/flam-ports-test', fixture));
        });
      },
    }],
  });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://localhost:${server.httpServer.address().port}/flam-ports-test`);
    await page.waitForSelector('[data-node-path="scenes:depart"]');
    const offsets = await page.evaluate(async () => {
      const host = document.querySelector('.advanced-canvas__host');
      const cy = host._cyreg.cy;
      const node = cy.getElementById('scenes:depart');
      const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));
      await nextFrame(); await nextFrame();
      const offsets = [];
      for (const mode of ['position', 'viewport']) {
        for (let i = 0; i < 8; i++) {
          if (mode === 'position') node.position({ x: node.position('x') + 20, y: node.position('y') + 10 });
          else cy.viewport({ zoom: cy.zoom() * 1.05, pan: { x: cy.pan('x') + 4, y: cy.pan('y') + 3 } });
          // Le callback de publication est déjà programmé. Mesurer juste après,
          // avant que React puisse reporter les prises à une autre image.
          await nextFrame();
          const box = document.querySelector('[data-node-path="scenes:depart"]').getBoundingClientRect();
          const rect = host.getBoundingClientRect();
          const position = node.renderedPosition();
          offsets.push({ mode,
            center: Math.hypot(box.x + box.width / 2 - rect.x - position.x, box.y + box.height / 2 - rect.y - position.y),
            width: Math.abs(box.width - node.width() * cy.zoom()),
            height: Math.abs(box.height - node.height() * cy.zoom()),
          });
          await nextFrame();
        }
      }
      return offsets;
    });
    assert.deepEqual(errors, []);
    for (const offset of offsets) {
      assert.ok(offset.center < 0.1 && offset.width < 0.1 && offset.height < 0.1,
        `les prises sont décalées : ${JSON.stringify(offset)}`);
    }
  } finally {
    await browser?.close();
    await server.close();
    await rm(cacheDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});
