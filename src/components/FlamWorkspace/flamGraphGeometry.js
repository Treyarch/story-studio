export const FLAM_PORT_SPACING = 48;
const PORT_VERTICAL_MARGIN = 24;

export function flamGraphNodeHeight(node) {
  const departures = (node.data('linkPorts') ?? []).filter(port => !['add', 'consult-add'].includes(port.kind));
  const minimum = node.data('collection') === 'rolls' ? 110 : 84;
  return Math.max(minimum, (departures.length - 1) * FLAM_PORT_SPACING + 2 * PORT_VERTICAL_MARGIN);
}
