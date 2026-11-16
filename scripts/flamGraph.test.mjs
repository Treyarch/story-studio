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
