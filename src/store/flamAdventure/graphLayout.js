// Les positions appartiennent au projet d'édition, hors du document joué sur FLAM.
export function isFlamGraphLayout(layout, document) {
  if (!layout || layout.version !== 1 || !Array.isArray(layout.positions)
    || Object.keys(layout).some(key => !['version', 'positions'].includes(key))) return false;
  const seen = new Set();
  return layout.positions.every(position => {
    if (!position || Object.keys(position).some(key => !['collection', 'id', 'x', 'y'].includes(key))
      || !['scenes', 'rolls', 'screens'].includes(position.collection) || typeof position.id !== 'string'
      || ![position.x, position.y].every(value => Number.isFinite(value) && Math.abs(value) <= 1e9)
      || !(document[position.collection] ?? []).some(entry => entry.id === position.id)) return false;
    const key = `${position.collection}:${position.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function pruneFlamGraphLayout(layout, document) {
  return { ...layout, positions: layout.positions.filter(position =>
    (document[position.collection] ?? []).some(entry => entry.id === position.id)) };
}
