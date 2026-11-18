import { filterFlamGraphElements, flamVisibleNodes } from './flamGraphScope.js';
import { buildOverviewFromNodes } from '../../store/advancedGraphView/graphOverview.js';

// Adaptateur du graphe FLAM vers les commandes de caméra partagées.
export function flamGraphControls(cy) {
  return {
    getViewport: () => ({ ...cy.pan(), zoom: cy.zoom() }),
    setViewport: ({ x, y, zoom }) => cy.viewport({ pan: { x, y }, zoom }),
    fitContent: () => cy.fit(flamVisibleNodes(cy), 50),
  };
}

export function flamGraphOverview(cy) {
  return buildOverviewFromNodes(flamVisibleNodes(cy).map(node => ({
    path: node.id(), x: node.position('x'), y: node.position('y'),
    kind: node.data('collection') === 'rolls' ? 'roll' : 'scene',
    tone: node.data('start') ? 'entry' : null,
    halfWidth: node.width() / 2, halfHeight: node.height() / 2,
  })));
}

export function filterFlamGraphEdges(cy, visibility, scope = 'all') {
  const visible = new Set(filterFlamGraphElements(cy.elements().map(element => ({ data: element.data() })), scope).map(element => element.data.id));
  cy.scratch('_flamScope', scope);
  cy.batch(() => {
    cy.nodes().forEach(node => node.style('display', visible.has(node.id()) ? 'element' : 'none'));
    cy.edges().forEach(edge => {
      const group = edge.data('consultation') ? 'consultation' : edge.data('collection') === 'rolls' ? 'rolls' : edge.data('conditional') ? 'conditions' : 'choices';
      edge.style('display', visible.has(edge.id()) && visibility[group] !== false ? 'element' : 'none');
    });
  });
}
