// Les menus mixtes participent au récit par leurs commandes narratives.
// La consultation n'ajoute aucune scène et ne change aucune destination.
export function filterFlamGraphElements(elements, scope = 'all') {
  const nodes = elements.filter(({ data }) => !data.source && (scope === 'all'
    || (scope === 'consultation' ? data.consultation : !data.consultation || data.narrative)));
  const ids = new Set(nodes.map(({ data }) => data.id));
  return [...nodes, ...elements.filter(({ data }) => data.source && ids.has(data.source) && ids.has(data.target)
    && (scope === 'all' || Boolean(data.consultation) === (scope === 'consultation')))];
}

export function flamVisibleNodes(cy) {
  return cy.nodes().filter(node => node.style('display') !== 'none');
}

export function flamVisiblePorts(node) {
  const scope = node.cy().scratch('_flamScope') ?? 'all';
  return (node.data('linkPorts') ?? []).filter(port => scope === 'all'
    || ['consult', 'consult-add', 'grid-detail', 'collection-entry'].includes(port.kind) === (scope === 'consultation'));
}
