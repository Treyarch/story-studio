import test from 'node:test';
import assert from 'node:assert/strict';
import cytoscape from 'cytoscape';
import { createExampleAdventure } from '../src/store/flamAdventure/example.js';
import { flamGraphElements } from '../src/components/FlamWorkspace/flamGraph.js';
import { flamGraphStyles } from '../src/components/FlamWorkspace/flamGraphStyle.js';
import { flamGraphPortNodes, updateFlamLinkEndpoints } from '../src/components/FlamWorkspace/flamGraphLinks.js';

const colors = { background: '#555577', text: '#eeeeee', border: '#777788', accent: '#eeaa77', muted: '#9999aa', action: '#55aaaa', surface: '#111118' };
const quadratic = (a, b, c, t) => ({
  x: (1 - t) ** 2 * a.x + 2 * t * (1 - t) * b.x + t ** 2 * c.x,
  y: (1 - t) ** 2 * a.y + 2 * t * (1 - t) * b.y + t ** 2 * c.y,
});

test('les boucles calculées par le vrai moteur sortent à droite et reviennent par la gauche sans traverser la carte', () => {
  const cy = cytoscape({ headless: true, styleEnabled: true,
    elements: flamGraphElements(createExampleAdventure(), { untitled: '' }), style: flamGraphStyles(colors) });
  try {
    const node = cy.getElementById('scenes:clairiere'); node.position({ x: 0, y: 0 });
    const loops = cy.edges().filter(edge => edge.data('selfLoop'));
    const renderer = cytoscape('renderer', 'base').prototype;
    for (const zoom of [0.1, 0.3, 1, 1.75, 3]) {
      cy.zoom(zoom);
      updateFlamLinkEndpoints(cy, flamGraphPortNodes(cy));
      const pairInfo = { srcPos: node.position(), dirCounts: {} };
      const heights = [];
      loops.forEach((edge, i) => {
        // La même routine que le renderer canvas de Cytoscape : aucun calcul
        // de points de contrôle de production n'est recopié dans le test.
        renderer.findLoopPoints(edge, pairInfo, i, false);
        const [x1, y1, x2, y2] = edge._private.rscratch.ctrlpts;
        const from = edge.pstyle('source-endpoint').pfValue;
        const to = edge.pstyle('target-endpoint').pfValue;
        const start = { x: from[0], y: from[1] }; const end = { x: to[0], y: to[1] };
        const first = { x: x1, y: y1 }; const second = { x: x2, y: y2 };
        const middle = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
        assert.ok(first.x > start.x, 'le départ doit continuer vers la droite');
        assert.ok(second.x < end.x, 'le retour doit rester à gauche');
        assert.ok(middle.y < -node.height() / 2 - 12, 'le sommet doit rester au-dessus de la carte');
        heights.push(middle.y);
        for (let step = 1; step < 100; step++) {
          for (const p of [quadratic(start, first, middle, step / 100), quadratic(middle, second, end, step / 100)]) {
            assert.ok(Math.abs(p.x) >= node.width() / 2 - 3 || Math.abs(p.y) >= node.height() / 2 - 3,
              `la boucle traverse la carte à ${p.x}, ${p.y}, zoom ${zoom}`);
          }
        }
      });
      assert.ok(Math.abs(heights[0] - heights[1]) > 20, 'les deux boucles doivent emprunter des couloirs distincts');
    }
  } finally { cy.destroy(); }
});
