import assert from 'node:assert/strict';
import cytoscape from 'cytoscape';
import { characterSheetFixture } from './flamScreensFixture.mjs';
import { flamGraphElements } from '../src/components/FlamWorkspace/flamGraph.js';
import { filterFlamGraphEdges } from '../src/components/FlamWorkspace/flamGraphControls.js';
import { arrangeFlamGraph } from '../src/components/FlamWorkspace/flamGraphArrange.js';
import { captureFlamGraphLayout } from '../src/components/FlamWorkspace/flamGraphSync.js';
import { createFlamProject, withFlamGraphLayout } from '../src/store/flamAdventure/project.js';

export function unifiedGraphFixture() {
  const document = characterSheetFixture();
  document.screens.find(screen => screen.id === 'archives-b').links.push({ id: 'retour-a', label: 'Visiter A', screenId: 'archives-a' });
  document.screens.push(
    { id: 'affaires', type: 'grid', title: 'Tes affaires', text: '', image: null, links: [], source: 'inventory', detailScreenId: 'objet' },
    { id: 'objet', type: 'detail', contentSource: 'item', title: '', text: '', image: null, links: [] },
    { id: 'souvenirs', type: 'grid', title: 'Souvenirs', text: '', image: null, links: [], source: 'collection', entries: [
      { id: 'souvenir-partage', label: 'Carte découverte', image: null, screenId: 'carte', conditions: [{ type: 'event', eventId: 'porte-ouverte', present: true }], unavailable: 'disabled' },
    ] },
  );
  document.screens[0].links.push({ id: 'affaires', label: 'Tes affaires', screenId: 'affaires' }, { id: 'souvenirs', label: 'Souvenirs', screenId: 'souvenirs' });
  return document;
}

export function arrangedGraphProject() {
  const document = unifiedGraphFixture();
  const before = structuredClone(document);
  let project = createFlamProject({ document });
  const cy = cytoscape({ headless: true, styleEnabled: true, elements: flamGraphElements(document, { untitled: '' }) });
  try {
    for (const scope of ['all', 'story', 'consultation']) {
      filterFlamGraphEdges(cy, {}, scope);
      arrangeFlamGraph(cy);
      project = withFlamGraphLayout(project, captureFlamGraphLayout(cy));
    }
    assert.deepEqual(project.authoring.document, before);
    return project;
  } finally { cy.destroy(); }
}

export function arrangedGraphFixture() {
  return arrangedGraphProject().authoring.document;
}
