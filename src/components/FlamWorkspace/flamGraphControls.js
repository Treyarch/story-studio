import { buildOverviewFromNodes } from '../../store/advancedGraphView/graphOverview.js';

// Adaptateur du graphe FLAM vers les commandes de caméra partagées.
export function flamGraphControls(cy) {
  return {
    getViewport: () => ({ ...cy.pan(), zoom: cy.zoom() }),
    setViewport: ({ x, y, zoom }) => cy.viewport({ pan: { x, y }, zoom }),
    fitContent: () => cy.fit(undefined, 50),
  };
}

export function flamGraphOverview(cy) {
  return buildOverviewFromNodes(cy.nodes().map(node => ({
    path: node.id(), x: node.position('x'), y: node.position('y'),
    kind: node.data('collection') === 'rolls' ? 'roll' : 'scene',
    tone: node.data('start') ? 'entry' : null,
    halfWidth: node.width() / 2, halfHeight: node.height() / 2,
  })));
}

export function filterFlamGraphEdges(cy, visibility) {
  cy.edges().forEach(edge => {
    const group = edge.data('collection') === 'rolls' ? 'rolls' : edge.data('conditional') ? 'conditions' : 'choices';
    edge.style('display', visibility[group] === false ? 'none' : 'element');
  });
}
