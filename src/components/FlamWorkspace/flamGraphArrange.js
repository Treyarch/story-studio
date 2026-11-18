import { flamVisibleNodes } from './flamGraphScope.js';

// Réduire les cycles avant de calculer les colonnes : une sortie d'un cycle
// reste à droite, une fiche partagée ne se duplique jamais.
export function arrangeFlamGraph(cy) {
  const nodes = flamVisibleNodes(cy);
  if (!nodes.length) return;
  const edges = cy.edges().filter(edge => edge.style('display') !== 'none'
    && nodes.contains(edge.source()) && nodes.contains(edge.target()));
  const { components } = nodes.union(edges).tarjanStronglyConnected();
  const owner = new Map();
  components.forEach((component, index) => component.nodes().forEach(node => owner.set(node.id(), index)));
  const successors = components.map(() => new Set());
  const incoming = components.map(() => 0);
  const rank = components.map(() => 0);
  edges.forEach(edge => {
    const from = owner.get(edge.source().id()), to = owner.get(edge.target().id());
    if (from !== to && !successors[from].has(to)) { successors[from].add(to); incoming[to] += 1; }
  });
  const queue = incoming.flatMap((count, index) => count === 0 ? [index] : []);
  for (let i = 0; i < queue.length; i += 1) {
    const from = queue[i];
    for (const to of successors[from]) {
      rank[to] = Math.max(rank[to], rank[from] + 1);
      incoming[to] -= 1;
      if (incoming[to] === 0) queue.push(to);
    }
  }
  const bottom = new Map();
  cy.batch(() => nodes.forEach(node => {
    const column = rank[owner.get(node.id())];
    const height = node.outerHeight();
    const top = bottom.get(column) ?? 50;
    node.position({ x: 145 + column * 350, y: top + height / 2 });
    bottom.set(column, top + height + 90);
  }));
  cy.fit(nodes, 50);
}
