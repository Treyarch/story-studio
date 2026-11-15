// Mise à jour incrémentale : modifier un texte ou une destination conserve
// les positions déplacées par l’auteur et la caméra.
export function syncFlamGraph(cy, elements, selection) {
  const first = cy.nodes().length === 0;
  const ids = new Set(elements.map(element => element.data.id));
  cy.batch(() => {
    cy.elements().filter(element => !ids.has(element.id())).remove();
    // Les nouvelles destinations doivent exister avant d'ajouter leurs liens.
    for (const element of elements) {
      const existing = cy.getElementById(element.data.id);
      if (existing.length) {
        if (existing.isEdge()) existing.move({ source: element.data.source, target: element.data.target });
        existing.data(element.data);
      } else cy.add({ ...element, position: { x: cy.extent().x1 + 130, y: cy.extent().y1 + 130 + cy.nodes().length * 110 } });
    }
    cy.elements().unselect();
    cy.elements().filter(element => element.data('collection') === selection.collection && element.data('definitionId') === selection.id).select();
  });
  return first;
}

export function captureFlamGraphLayout(cy) {
  return cy.nodes().map(node => ({
    collection: node.data('collection'), id: node.data('definitionId'),
    x: node.position('x'), y: node.position('y'),
  }));
}

export function restoreFlamGraphLayout(cy, layout) {
  cy.batch(() => {
    for (const { collection, id, x, y } of layout.positions) {
      cy.getElementById(`${collection}:${id}`).position({ x, y });
    }
  });
}

export function bindFlamGraphLayout(cy, onLayout) {
  const save = () => onLayout(captureFlamGraphLayout(cy));
  cy.on('dragfree', 'node', save);
  return () => cy.off('dragfree', 'node', save);
}
