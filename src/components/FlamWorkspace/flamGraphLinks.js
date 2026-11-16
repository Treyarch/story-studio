import { autoPanVelocity, linkDropCandidate } from '../../store/advancedAuthoring/graphLinkDrag.js';
import { isCurrentFlamLinkPort } from '../../store/flamAdventure/graphLinks.js';
import { linkHandlePx } from '../AdvancedGraphCanvas/nodeOverlayMetrics.js';
import { captureFlamGraphLayout } from './flamGraphSync.js';

export function flamGraphPortNodes(cy, hovered = null) {
  const zoom = cy.zoom();
  const offset = Math.min(3, linkHandlePx(zoom) / 2 - 2);
  return cy.nodes().map(node => {
    const { x, y } = node.renderedPosition();
    const width = node.width() * zoom; const height = node.height() * zoom;
    const linkPorts = node.data('linkPorts') ?? [];
    const departures = linkPorts.filter(port => port.kind !== 'add');
    return {
      path: node.id(), collection: node.data('collection'), id: node.data('definitionId'),
      x, y, width, height, start: Boolean(node.data('start')), ending: Boolean(node.data('ending')), selected: node.selected(), hovered: node.id() === hovered,
      ports: [
        { key: 'arrival', role: 'arrival', dx: -width / 2 - offset, dy: 0 },
        ...departures.map((port, index) => ({
          key: port.key, role: 'departure', port, dx: width / 2 + offset,
          dy: (index - (departures.length - 1) / 2) * Math.max(16, 22 * zoom),
        })),
        ...linkPorts.filter(port => port.kind === 'add').map(port => ({
          key: port.key, role: 'departure', port, dx: 0, dy: height / 2 + offset,
        })),
      ],
    };
  });
}

// Une instance par surface. Le relâchement relit la cible et le document vivant ;
// aucun déplacement de pointeur ne modifie le projet avant ce relâchement.
export function createFlamLinkDrag({ cy, host, readDocument, onChange, onDrop,
  events = host.ownerDocument.defaultView }) {
  let active = null; let frame = null;
  const point = event => {
    const rect = host.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const inside = p => p.x >= 0 && p.y >= 0 && p.x <= host.clientWidth && p.y <= host.clientHeight;
  const current = () => active && isCurrentFlamLinkPort(readDocument(), active.port);
  const targetAt = (nodes, p) => linkDropCandidate(nodes, p, active.sourcePath, 8, linkHandlePx(cy.zoom()) / 2);
  const validTarget = target => target && (active.port.kind !== 'outcome' || target.collection === 'scenes');
  const snapshot = () => {
    const nodes = flamGraphPortNodes(cy);
    const source = nodes.find(node => node.path === active.sourcePath);
    const anchor = source?.ports.find(port => port.key === active.port.key);
    if (!source || !anchor) return null;
    const candidate = targetAt(nodes, active.pointer);
    return { port: active.port, sourcePath: active.sourcePath,
      anchor: { x: source.x + anchor.dx, y: source.y + anchor.dy },
      pointer: active.pointer, candidate, valid: Boolean(validTarget(candidate)) };
  };
  const clear = (notify = true) => {
    if (frame !== null) events.cancelAnimationFrame(frame);
    frame = null; active = null;
    events.removeEventListener('pointermove', move);
    events.removeEventListener('pointerup', release);
    events.removeEventListener('pointercancel', cancelPointer);
    events.removeEventListener('keydown', keydown);
    events.removeEventListener('blur', cancel);
    if (notify) onChange(null);
  };
  const tick = () => {
    frame = null;
    if (!current()) { clear(); return; }
    const velocity = autoPanVelocity(active.pointer, { width: host.clientWidth, height: host.clientHeight });
    if (velocity.x || velocity.y) cy.panBy(velocity);
    const state = snapshot();
    if (!state) { clear(); return; }
    onChange(state);
    frame = events.requestAnimationFrame(tick);
  };
  function move(event) {
    if (!active || event.pointerId !== active.pointerId) return;
    active.pointer = point(event);
  }
  function release(event) {
    if (!active || event.pointerId !== active.pointerId) return;
    const p = point(event);
    const nodes = flamGraphPortNodes(cy);
    const candidate = targetAt(nodes, p);
    const moved = Math.hypot(p.x - active.start.x, p.y - active.start.y) >= 4;
    const target = validTarget(candidate) ? { collection: candidate.collection, id: candidate.id } : null;
    const sourceHit = !candidate && linkDropCandidate(nodes, p, null, 8)?.path === active.sourcePath;
    const allowed = current() && inside(p) && moved && !sourceHit && (!candidate || target);
    const port = active.port;
    const pan = cy.pan(); const zoom = cy.zoom();
    const position = { x: (p.x - pan.x) / zoom, y: (p.y - pan.y) / zoom };
    const positions = captureFlamGraphLayout(cy);
    clear();
    if (allowed) onDrop({ port, target, position, positions });
  }
  function cancel() { clear(); }
  function cancelPointer(event) { if (active?.pointerId === event.pointerId) clear(); }
  function keydown(event) { if (event.key === 'Escape') { event.preventDefault(); clear(); } }
  return {
    start(event, node, anchor) {
      if ((event.button !== undefined && event.button !== 0) || !isCurrentFlamLinkPort(readDocument(), anchor.port)) return;
      clear(false);
      const p = point(event);
      active = { sourcePath: node.path, port: anchor.port, pointerId: event.pointerId, start: p, pointer: p };
      events.addEventListener('pointermove', move);
      events.addEventListener('pointerup', release);
      events.addEventListener('pointercancel', cancelPointer);
      events.addEventListener('keydown', keydown);
      events.addEventListener('blur', cancel);
      onChange(snapshot());
      frame = events.requestAnimationFrame(tick);
    },
    cancel,
    destroy: () => clear(false),
    get active() { return Boolean(active); },
  };
}

// Les traits et les prises lisent les mêmes coordonnées, y compris au dézoom.
export function updateFlamLinkEndpoints(cy, nodes) {
  const byPath = new Map(nodes.map(node => [node.path, node]));
  const zoom = cy.zoom();
  cy.edges().forEach(edge => {
    const source = byPath.get(edge.source().id());
    const target = byPath.get(edge.target().id());
    const departure = source?.ports.find(port => port.key === edge.data('sourcePortKey'));
    const arrival = target?.ports.find(port => port.role === 'arrival');
    if (!departure || !arrival) return;
    const endpoints = `${departure.dx / zoom} ${departure.dy / zoom}|${arrival.dx / zoom} ${arrival.dy / zoom}`;
    if (edge.scratch('_flamEndpoints') === endpoints) return;
    edge.scratch('_flamEndpoints', endpoints);
    const [from, to] = endpoints.split('|');
    edge.style({ 'source-endpoint': from, 'target-endpoint': to });
  });
}
