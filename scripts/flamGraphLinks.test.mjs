import test from 'node:test';
import assert from 'node:assert/strict';
import cytoscape from 'cytoscape';
import { createExampleAdventure } from '../src/store/flamAdventure/example.js';
import { flamLinkPorts, planFlamGraphLink } from '../src/store/flamAdventure/graphLinks.js';
import { flamGraphElements } from '../src/components/FlamWorkspace/flamGraph.js';
import { createFlamLinkDrag, flamGraphPortNodes, updateFlamLinkEndpoints } from '../src/components/FlamWorkspace/flamGraphLinks.js';

function setup(extraRoll = false) {
  const document = createExampleAdventure();
  if (extraRoll) document.rolls.push({ id: 'autre', name: 'Autre dé', outcomes: [{ min: 1, max: 20, destination: 'fin-renard' }] });
  const cy = cytoscape({ headless: true, styleEnabled: true,
    style: [{ selector: 'node', style: { width: 190, height: 84 } }],
    elements: flamGraphElements(document, { start: 'Départ', ending: 'Fin', roll: 'Dé', untitled: '', conditional: 'Condition' }) });
  cy.nodes().forEach((node, i) => node.position({ x: 200 + i % 3 * 400, y: 200 + Math.floor(i / 3) * 350 }));
  cy.zoom(1); cy.pan({ x: 0, y: 0 });
  const listeners = new Map(); const frames = new Map(); let frameId = 0;
  const events = {
    addEventListener: (name, listener) => { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(listener); },
    removeEventListener: (name, listener) => listeners.get(name)?.delete(listener),
    requestAnimationFrame: fn => { frames.set(++frameId, fn); return frameId; },
    cancelAnimationFrame: id => frames.delete(id),
  };
  const host = { clientWidth: 1400, clientHeight: 1200, getBoundingClientRect: () => ({ left: 30, top: 40 }), ownerDocument: { defaultView: events } };
  const changes = []; const drops = [];
  const drag = createFlamLinkDrag({ cy, host, readDocument: () => document, onChange: change => changes.push(change), onDrop: drop => drops.push(drop) });
  const nodes = () => flamGraphPortNodes(cy);
  const event = (p, pointerId = 1) => ({ clientX: p.x + 30, clientY: p.y + 40, pointerId, button: 0 });
  const emit = (name, payload) => [...(listeners.get(name) ?? [])].forEach(listener => listener(payload));
  return { cy, document, drag, changes, drops, frames, listeners, nodes,
    start(path = 'scenes:depart', key = 'add') {
      const node = nodes().find(n => n.path === path); const anchor = node.ports.find(port => port.key === key);
      drag.start(event({ x: node.x + anchor.dx, y: node.y + anchor.dy }), node, anchor);
    },
    release: (p, id) => emit('pointerup', event(p, id)), move: p => emit('pointermove', event(p)), emit,
    tick() { const [id, fn] = frames.entries().next().value; frames.delete(id); fn(); },
    destroy() { drag.destroy(); cy.destroy(); },
  };
}

test('les prises couvrent les choix, les récompenses, les plages et les brouillons ; les fins ont seulement une arrivée', () => {
  const document = createExampleAdventure();
  assert.equal(flamLinkPorts(document, 'scenes', 'clairiere').length, 4);
  assert.equal(flamLinkPorts(document, 'scenes', 'fin-renard').length, 0);
  const choice = document.choices.find(c => c.id === 'prendre-cle'); choice.destination = null;
  assert.ok(flamLinkPorts(document, 'scenes', 'clairiere').some(port => port.choiceId === choice.id));
  assert.equal(flamLinkPorts(document, 'rolls', 'rencontre').length, 2);
});

test('le vrai glissement ne modifie rien avant le relâchement et relit la cible au dernier instant', () => {
  const f = setup();
  try {
    const before = structuredClone(f.document);
    f.start();
    const first = f.nodes().find(n => n.path === 'scenes:clairiere');
    f.move(first); f.tick();
    assert.equal(f.changes.at(-1).candidate.path, first.path);
    assert.deepEqual(f.document, before); assert.equal(f.drops.length, 0);
    const last = f.nodes().find(n => n.path === 'scenes:sentier');
    f.release(last, 2); assert.equal(f.drag.active, true);
    f.release(last);
    assert.equal(f.drops.length, 1);
    assert.deepEqual(f.drops[0].target, { collection: 'scenes', id: 'sentier' });
    assert.equal(f.drag.active, false); assert.equal(f.frames.size, 0);
    assert.ok([...f.listeners.values()].every(set => set.size === 0));
  } finally { f.destroy(); }
});

test('annulation, perte de focus, démontage et dépôt hors surface ne créent aucun lien', () => {
  const f = setup();
  try {
    f.start(); f.emit('keydown', { key: 'Escape', preventDefault() {} });
    assert.equal(f.drag.active, false);
    f.start(); f.emit('pointercancel', { pointerId: 1 });
    f.start(); f.emit('blur', {});
    f.start(); f.release({ x: -50, y: 100 });
    f.start(); f.drag.destroy();
    assert.equal(f.drops.length, 0); assert.equal(f.frames.size, 0);
    assert.ok([...f.listeners.values()].every(set => set.size === 0));
  } finally { f.destroy(); }
});

test('la caméra suit le pointeur au bord et un dépôt dans le vide propose une création à sa position', () => {
  const f = setup();
  try {
    f.start(); f.move({ x: 2, y: 600 }); f.tick();
    assert.ok(f.cy.pan().x > 0);
    f.cy.zoom(0.5); f.cy.pan({ x: 40, y: 50 });
    f.release({ x: 900, y: 1000 });
    assert.equal(f.drops.length, 1); assert.equal(f.drops[0].target, null);
    assert.deepEqual(f.drops[0].position, { x: 1720, y: 1900 });
    assert.equal(f.drops[0].positions.length, f.document.scenes.length + f.document.rolls.length);
  } finally { f.destroy(); }
});

test('une plage de dé refuse un autre dé, et une source modifiée pendant le geste ne produit rien', () => {
  const f = setup(true);
  try {
    f.start('rolls:rencontre', 'outcome:0');
    const invalid = f.nodes().find(n => n.path === 'rolls:autre');
    f.move(invalid); f.tick(); assert.equal(f.changes.at(-1).valid, false);
    f.release(invalid); assert.equal(f.drops.length, 0);
    f.start('rolls:rencontre', 'outcome:0');
    f.document.rolls[0].outcomes[0].min = 2;
    f.release(f.nodes().find(n => n.path === 'scenes:sentier'));
    assert.equal(f.drops.length, 0);
    f.start(); f.document.scenes[0].ending = true; f.tick();
    assert.equal(f.drag.active, false); assert.equal(f.drops.length, 0);
  } finally { f.destroy(); }
});

test('les liens utilisent les coordonnées exactes des prises, avant et après zoom', () => {
  const f = setup();
  try {
    for (const zoom of [1, 0.2, 2]) {
      f.cy.zoom(zoom);
      const nodes = f.nodes(); updateFlamLinkEndpoints(f.cy, nodes);
      const source = nodes.find(n => n.path === 'scenes:depart');
      const port = source.ports.find(p => p.key === 'choice:choisir-pisteur');
      const style = f.cy.getElementById('choice:depart:0').pstyle('source-endpoint');
      assert.deepEqual(style.pfValue, [port.dx / zoom, port.dy / zoom]);
    }
  } finally { f.destroy(); }
});

test('changer une destination conserve conditions, effets et récompense ; les plages restent inchangées', () => {
  const document = createExampleAdventure();
  const port = flamLinkPorts(document, 'scenes', 'clairiere').find(p => p.choiceId === 'prendre-cle');
  const plan = planFlamGraphLink(document, port, { collection: 'rolls', id: 'rencontre' });
  assert.deepEqual(plan.command.patch, { destination: null, rollId: 'rencontre' });
  const outcome = flamLinkPorts(document, 'rolls', 'rencontre')[0];
  const rewire = planFlamGraphLink(document, outcome, { collection: 'scenes', id: 'sentier' });
  assert.deepEqual(rewire.command.patch.outcomes[0], { min: 1, max: 10, destination: 'sentier' });
  assert.deepEqual(rewire.command.patch.outcomes[1], document.rolls[0].outcomes[1]);
});

test('la prise d’ajout est séparée des sorties et ne décale pas les liens existants', () => {
  const f = setup();
  try {
    const node = f.nodes().find(n => n.path === 'scenes:depart');
    const add = node.ports.find(p => p.key === 'add');
    const exits = node.ports.filter(p => p.role === 'departure' && p.port.kind !== 'add');
    assert.equal(add.dx, 0);
    assert.ok(add.dy > node.height / 2);
    assert.ok(exits.every(p => p.dx > node.width / 2));
    assert.equal(exits[0].dy, -exits[1].dy);
  } finally { f.destroy(); }
});
