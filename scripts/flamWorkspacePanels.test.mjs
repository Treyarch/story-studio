import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import cytoscape from 'cytoscape';
import { flamGraphControls, flamGraphOverview, filterFlamGraphEdges } from '../src/components/FlamWorkspace/flamGraphControls.js';
import { flamGraphElements } from '../src/components/FlamWorkspace/flamGraph.js';
import { createExampleAdventure } from '../src/store/flamAdventure/example.js';
const { mountSurface } = await import('./chromeBench.mjs');
const { GraphWorkspacePanels, GraphPanelHeader } = await import('../src/workspace/GraphWorkspacePanels.jsx');
const { GraphSurfaceControls } = await import('../src/components/AdvancedGraphCanvas/GraphSurfaceControls.jsx');

const N = 'advanced-node-list'; const G = 'advanced-graph'; const I = 'advanced-inspector';

test('le châssis commun conserve l’ordre, les poignées et les fermetures des panneaux FLAM', () => {
  const resized = []; const closed = [];
  const viewState = { showNodeList: true, showInspector: true, panelOrder: [I, G, N],
    nodeListPanelWidth: 260, inspectorPanelWidth: 480,
    setNodeListPanelWidth: width => resized.push(['list', width]),
    setInspectorPanelWidth: width => resized.push(['settings', width]) };
  const rendered = mountSurface(React.createElement(GraphWorkspacePanels, { viewState,
    renderPanel: (id, dragHandleProps) => React.createElement(GraphPanelHeader, { title: id, dragHandleProps, onClose: () => closed.push(id) }) }));
  assert.deepEqual(rendered.elements.filter(e => e.props?.['data-workspace-panel-id']).map(e => e.props['data-workspace-panel-id']), [I, G, N]);
  const handles = rendered.elements.filter(e => e.props?.role === 'separator');
  assert.equal(handles.length, 2);
  handles[0].props.onKeyDown({ key: 'ArrowRight', preventDefault() {} });
  assert.deepEqual(resized, [['settings', 496]]);
  rendered.elements.find(e => e.props?.className === 'advanced-panel-header__close').props.onClick();
  assert.deepEqual(closed, [I]);
  const hidden = mountSurface(React.createElement(GraphWorkspacePanels, { viewState: { ...viewState, showNodeList: false, showInspector: false }, renderPanel: id => React.createElement('div', null, id) }));
  assert.deepEqual(hidden.elements.filter(e => e.props?.['data-workspace-panel-id']).map(e => e.props['data-workspace-panel-id']), [G]);
  assert.equal(hidden.elements.filter(e => e.props?.role === 'separator').length, 0);
});

test('les commandes d’origine pilotent la caméra FLAM et filtrent ses propres familles de liens', () => {
  const document = createExampleAdventure();
  const cy = cytoscape({ headless: true, styleEnabled: true, elements: flamGraphElements(document, { start: 'Départ', ending: 'Fin', roll: 'Dé', untitled: '', conditional: 'Condition' }) });
  try {
    const adapter = flamGraphControls(cy);
    adapter.setViewport({ x: 120, y: -60, zoom: 0.5 });
    assert.deepEqual(adapter.getViewport(), { x: 120, y: -60, zoom: 0.5 });
    const frame = mountSurface(React.createElement(GraphSurfaceControls, {
      engineRef: { current: adapter }, hostRef: { current: { clientWidth: 800, clientHeight: 400 } },
      viewport: adapter.getViewport(), overviewOpen: false,
      edgeFilters: [{ group: 'conditions', text: 'Conditions FLAM', className: 'is-return' }],
      edgeVisibility: { conditions: true }, onEdgeVisibilityChange: next => filterFlamGraphEdges(cy, next),
      arrangement: { arrange() {}, folds: false },
    }));
    const zoom = frame.elements.find(e => e.type === 'button' && e.props.children === '+');
    zoom.props.onClick();
    assert.ok(cy.zoom() > 0.5);
    assert.equal(frame.elements.some(e => e.props?.className === 'advanced-layout-control__fold'), false);
    frame.elements.find(e => e.type === 'input' && e.props['aria-label'] === 'Conditions FLAM').props.onChange({ currentTarget: { checked: false } });
    assert.equal(cy.getElementById('choice:sentier:0').style('display'), 'none');
    assert.equal(cy.getElementById('outcome:rencontre:0').style('display'), 'element');
    cy.getElementById('scenes:depart').position({ x: -250, y: 600 });
    const overview = flamGraphOverview(cy);
    const mark = overview.marks.find(item => item.path === 'scenes:depart');
    const restored = overview.unproject(mark.px, mark.py);
    assert.ok(Math.abs(restored.x + 250) < 1e-8);
    assert.ok(Math.abs(restored.y - 600) < 1e-8);
    assert.equal(mark.tone, 'entry');
  } finally { cy.destroy(); }
});
