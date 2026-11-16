import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import cytoscape from 'cytoscape';
import { createExampleAdventure } from '../src/store/flamAdventure/example.js';
import { flamGraphElements } from '../src/components/FlamWorkspace/flamGraph.js';
import { flamGraphPortNodes } from '../src/components/FlamWorkspace/flamGraphLinks.js';
const { mountSurface } = await import('./chromeBench.mjs');
const { FlamGraphPorts } = await import('../src/components/FlamWorkspace/FlamGraphPorts.jsx');
const { GraphNodeOverlays } = await import('../src/components/AdvancedGraphCanvas/GraphNodeOverlays.jsx');
const { GraphLinkPort } = await import('../src/components/AdvancedGraphCanvas/GraphLinkPort.jsx');
const { GRAPH_LINK_PORTS } = await import('../src/store/advancedAuthoring/graphLinkDraft.js');

test('les prises FLAM restent visibles, accessibles au clavier et utilisent le bouton commun', () => {
  const document = createExampleAdventure();
  const cy = cytoscape({ headless: true, elements: flamGraphElements(document, { start: '', ending: '', roll: '', untitled: '', conditional: '' }) });
  const armed = []; const selected = []; const highlighted = [];
  try {
    const result = mountSurface(React.createElement(FlamGraphPorts, {
      cy: null, hostRef: { current: null }, document, nodes: flamGraphPortNodes(cy), zoom: 1,
      onArm: port => armed.push(port), onSelect: node => selected.push(node), onBegin() {}, onHighlight: (...args) => highlighted.push(args),
    }));
    const common = result.elements.filter(e => e.type === GraphLinkPort);
    assert.ok(common.length > document.scenes.length);
    assert.ok(result.elements.some(e => e.props?.className === 'flam-node-badge is-start'));
    const add = result.elements.find(e => e.type === 'button' && e.props.className.includes('is-add'));
    add.props.onClick({ detail: 0, preventDefault() {}, stopPropagation() {} });
    assert.equal(armed[0].kind, 'add');
    add.props.onFocus();
    assert.equal(highlighted[0][1], 'add');
    const arrival = result.elements.find(e => e.type === 'button' && e.props.className.includes('is-arrival'));
    arrival.props.onClick({ detail: 0, preventDefault() {}, stopPropagation() {} });
    assert.equal(selected[0].collection, 'scenes');
    assert.ok(result.elements.some(e => e.type === 'button' && /1.*10/.test(e.props['aria-label'])));
  } finally { cy.destroy(); }
});

test('les prises de l’éditeur d’origine transmettent toujours le même geste après mutualisation', () => {
  const calls = [];
  const port = { id: GRAPH_LINK_PORTS.STAGE_OK, active: true };
  const anchor = { id: port.id, dx: 54, dy: 0 };
  const node = { path: 'source', kind: 'stage', x: 100, y: 100, width: 104, height: 80,
    label: 'Départ', ports: [anchor], linkPorts: [port] };
  const rendered = mountSurface(React.createElement(GraphNodeOverlays, {
    overlay: { detailLevel: 'full', zoom: 1, nodes: [node] },
    onLinkPortPointerDown: (...args) => calls.push(args),
  }));
  let prevented = 0; let stopped = 0;
  const event = { preventDefault: () => prevented++, stopPropagation: () => stopped++ };
  const button = rendered.elements.find(e => e.type === 'button' && e.props.onPointerDown);
  button.props.onPointerDown(event);
  assert.equal(prevented, 1); assert.equal(stopped, 1);
  assert.deepEqual(calls, [[event, node, port, anchor]]);
});
