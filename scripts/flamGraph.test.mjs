import test from 'node:test';
import assert from 'node:assert/strict';
import cytoscape from 'cytoscape';
import { createExampleAdventure } from '../src/store/flamAdventure/example.js';
import { flamGraphElements, graphNodeId } from '../src/components/FlamWorkspace/flamGraph.js';
import { syncFlamGraph } from '../src/components/FlamWorkspace/flamGraphSync.js';
const labels = { start: 'Départ', ending: 'Fin', roll: 'Dé', untitled: 'Sans titre', conditional: 'Condition' };

test('projection FLAM : scènes, fins, choix conditionnels, jet et plages, sans modifier le document', () => {
  const document = createExampleAdventure();
  const before = structuredClone(document);
  const elements = flamGraphElements(document, labels);
  const cy = cytoscape({ headless: true, elements });
  try {
    assert.equal(cy.nodes().length, document.scenes.length + document.rolls.length);
    assert.equal(cy.edges().length, document.choices.length + 2);
    assert.equal(cy.getElementById(graphNodeId('scenes', 'depart')).data('start'), true);
    assert.equal(cy.getElementById(graphNodeId('scenes', 'depart')).data('label'), document.scenes[0].title);
    assert.equal(cy.nodes().filter(n => n.data('ending')).length, 2);
    assert.equal(cy.getElementById('choice:sentier:0').data('conditional'), true);
    assert.equal(cy.getElementById('choice:rencontre-scene:0').target().id(), graphNodeId('rolls', 'rencontre'));
    assert.equal(cy.getElementById('outcome:rencontre:0').data('label'), '1–10');
    assert.deepEqual(document, before);
  } finally { cy.destroy(); }
});

test('modifier une destination déplace vraiment le lien sans perdre caméra ni position', () => {
  const document = createExampleAdventure();
  const cy = cytoscape({ headless: true, elements: [] });
  try {
    const selected = { collection: 'scenes', id: 'depart' };
    syncFlamGraph(cy, flamGraphElements(document, labels), selected);
    cy.getElementById('scenes:depart').position({ x: 321, y: 654 });
    cy.viewport({ zoom: 0.7, pan: { x: 50, y: 60 } });
    document.choices[0].destination = 'sentier';
    document.scenes[0].title = 'Nouveau titre';
    syncFlamGraph(cy, flamGraphElements(document, labels), { collection: 'choices', id: document.choices[0].id });
    assert.equal(cy.getElementById('choice:depart:0').target().id(), 'scenes:sentier');
    assert.deepEqual(cy.getElementById('scenes:depart').position(), { x: 321, y: 654 });
    assert.equal(cy.zoom(), 0.7);
    assert.deepEqual(cy.pan(), { x: 50, y: 60 });
    assert.equal(cy.edges(':selected').length, 1);
    document.choices[0].destination = null;
    document.scenes.splice(1, 1);
    syncFlamGraph(cy, flamGraphElements(document, labels), selected);
    assert.equal(cy.getElementById('choice:depart:0').length, 0);
    assert.equal(cy.getElementById('scenes:clairiere').length, 0);
    // Un brouillon incomplet garde ses autres scènes et le jet visibles.
    assert.equal(cy.nodes().length, document.scenes.length + document.rolls.length);
  } finally { cy.destroy(); }
});

const { flamGraphStyles } = await import('../src/components/FlamWorkspace/flamGraphStyle.js');

test('les boucles se révèlent au survol, les conditions restent lisibles sans répéter leur statut', () => {
  const document = createExampleAdventure();
  const colors = { background: '#555577', text: '#eeeeee', border: '#777788', accent: '#eeaa77', muted: '#9999aa', action: '#55aaaa', surface: '#111118' };
  const cy = cytoscape({ headless: true, styleEnabled: true, elements: flamGraphElements(document, labels), style: flamGraphStyles(colors) });
  try {
    const loops = cy.edges().filter(edge => edge.data('selfLoop'));
    assert.equal(loops.length, 2);
    assert.equal(loops[0].style('label'), '');
    loops[0].addClass('is-port-focused');
    assert.equal(loops[0].style('label'), loops[0].data('label'));
    loops[0].removeClass('is-port-focused');
    assert.equal(loops[0].style('label'), '');
    loops[0].select();
    assert.equal(loops[0].style('label'), loops[0].data('label'));
    const conditional = cy.getElementById('choice:sentier:0');
    assert.equal(conditional.style('line-style'), 'dashed');
    assert.equal(conditional.style('label'), 'Lire les traces');
    assert.ok(Number.parseFloat(cy.getElementById('scenes:depart').select().style('border-width')) < 4);
  } finally { cy.destroy(); }
});

const { unifiedGraphFixture } = await import('./flamArrangedGraphFixture.mjs');
const { filterFlamGraphElements, flamVisibleNodes } = await import('../src/components/FlamWorkspace/flamGraphScope.js');
const { filterFlamGraphEdges, flamGraphOverview } = await import('../src/components/FlamWorkspace/flamGraphControls.js');
const { flamGraphPortNodes } = await import('../src/components/FlamWorkspace/flamGraphLinks.js');
const { arrangeFlamGraph } = await import('../src/components/FlamWorkspace/flamGraphArrange.js');
const { captureFlamGraphLayout } = await import('../src/components/FlamWorkspace/flamGraphSync.js');

test('Tout, Récit et Consultation conservent les menus mixtes, les fiches partagées et les destinations', () => {
  const document = unifiedGraphFixture(); const before = structuredClone(document);
  const all = flamGraphElements(document, labels);
  const consultation = filterFlamGraphElements(all, 'consultation');
  assert.deepEqual(consultation.filter(e => !e.data.source).map(e => e.data.definitionId), document.screens.map(s => s.id));
  assert.ok(consultation.filter(e => e.data.source).every(e => e.data.consultation));
  const story = filterFlamGraphElements(all, 'story');
  assert.equal(story.filter(e => !e.data.source && e.data.collection === 'scenes').length, document.scenes.length);
  assert.equal(story.filter(e => !e.data.source && e.data.collection === 'rolls').length, document.rolls.length);
  assert.ok(story.some(e => e.data.id === 'screens:archives-a'));
  assert.ok(story.some(e => e.data.source === 'screens:archives-a' && e.data.target === 'scenes:sentier'));
  assert.ok(!story.some(e => e.data.id === 'screens:carte'));
  for (const scope of [all, story, consultation]) {
    const ids = new Set(scope.filter(e => !e.data.source).map(e => e.data.id));
    assert.ok(scope.filter(e => e.data.source).every(e => ids.has(e.data.source) && ids.has(e.data.target)));
  }
  assert.equal(consultation.filter(e => e.data.id === 'screens:carte').length, 1);
  assert.ok(consultation.filter(e => e.data.target === 'screens:carte').length >= 3);
  assert.deepEqual(filterFlamGraphElements(all), all);
  assert.deepEqual(document, before);
});

test('les filtres pilotent aussi les prises, la vue d’ensemble et les familles de liens sans déplacer les cartes', () => {
  const document = unifiedGraphFixture();
  const cy = cytoscape({ headless: true, styleEnabled: true, elements: flamGraphElements(document, labels), style: flamGraphStyles({}) });
  try {
    const before = captureFlamGraphLayout(cy);
    filterFlamGraphEdges(cy, {}, 'consultation');
    assert.ok(flamGraphPortNodes(cy).every(node => node.collection === 'screens'));
    assert.ok(flamGraphPortNodes(cy).flatMap(node => node.ports).every(anchor => anchor.port?.kind !== 'menu-choice'));
    assert.equal(flamGraphOverview(cy).marks.length, document.screens.length);
    assert.equal(cy.getElementById('collection:souvenirs:souvenir-partage').style('line-style'), 'dotted');
    filterFlamGraphEdges(cy, { conditions: false }, 'all');
    assert.equal(cy.getElementById('collection:souvenirs:souvenir-partage').style('display'), 'element');
    assert.equal(cy.getElementById('choice:sentier:0').style('display'), 'none');
    filterFlamGraphEdges(cy, { consultation: false });
    assert.equal(cy.getElementById('consult:accueil:carte').style('display'), 'none');
    assert.equal(cy.getElementById('menu-choice:accueil:depart-menu').style('display'), 'element');
    filterFlamGraphEdges(cy, {}, 'story');
    const menu = flamGraphPortNodes(cy).find(n => n.id === 'archives-a');
    assert.ok(menu.ports.filter(p => p.port).every(p => p.port.kind === 'menu-choice'));
    assert.ok(!flamGraphOverview(cy).marks.some(mark => mark.path === 'screens:carte'));
    filterFlamGraphEdges(cy, {}, 'all');
    assert.deepEqual(captureFlamGraphLayout(cy), before);
    assert.equal(flamVisibleNodes(cy).length, document.scenes.length + document.screens.length + document.rolls.length);
  } finally { cy.destroy(); }
});

test('ranger les cartes visibles place les sorties à droite des cycles et des menus, sans doublon ni chevauchement', () => {
  const document = unifiedGraphFixture();
  const cy = cytoscape({ headless: true, styleEnabled: true, elements: flamGraphElements(document, labels), style: flamGraphStyles({}) });
  try {
    cy.getElementById('scenes:depart').position({ x: -999, y: -777 });
    filterFlamGraphEdges(cy, {}, 'consultation'); arrangeFlamGraph(cy);
    assert.deepEqual(cy.getElementById('scenes:depart').position(), { x: -999, y: -777 });
    const x = id => cy.getElementById(`screens:${id}`).position('x');
    assert.ok(x('accueil') < x('archives-a'));
    assert.equal(x('archives-a'), x('archives-b'));
    assert.ok(x('archives-a') < x('carte'));
    assert.ok(x('affaires') < x('objet'));
    assert.ok(x('souvenirs') < x('carte'));
    const before = captureFlamGraphLayout(cy); arrangeFlamGraph(cy);
    assert.deepEqual(captureFlamGraphLayout(cy), before);
    const nodes = flamVisibleNodes(cy);
    nodes.forEach(a => nodes.forEach(b => {
      if (a.id() === b.id()) return;
      assert.ok(Math.abs(a.position('x') - b.position('x')) >= (a.outerWidth() + b.outerWidth()) / 2
        || Math.abs(a.position('y') - b.position('y')) >= (a.outerHeight() + b.outerHeight()) / 2);
    }));
    assert.equal(nodes.filter(node => node.id() === 'screens:carte').length, 1);
    filterFlamGraphEdges(cy, {}, 'story'); arrangeFlamGraph(cy);
    assert.equal(cy.getElementById('rolls:rencontre').position('x'), cy.getElementById('scenes:rencontre-scene').position('x'));
    assert.ok(cy.getElementById('rolls:rencontre').position('x') > cy.getElementById('scenes:sentier').position('x'));
  } finally { cy.destroy(); }
});
