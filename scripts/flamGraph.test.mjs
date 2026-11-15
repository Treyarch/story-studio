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
    assert.match(cy.getElementById(graphNodeId('scenes', 'depart')).data('label'), /Départ/);
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
