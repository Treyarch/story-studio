import { pruneFlamGraphLayout } from './graphLayout.js';
import { createProjectStorage } from '../projectStorage.js';
import { assertAdventureDocument, createAdventureDocument, replaceAdventureDocument } from './document.js';
import { isFlamProject, readProjectEnvelope } from '../projectModel/envelope.js';

export function createFlamProject({ document = createAdventureDocument(), projectName = '', storage = createProjectStorage() } = {}) {
  assertAdventureDocument(document);
  return {
    schemaVersion: 5,
    authoringMode: 'flam',
    projectType: 'flam',
    projectName,
    storage,
    rootEntries: [],
    authoring: { document: structuredClone(document) },
  };
}

export function withFlamDocument(project, document) {
  readProjectEnvelope(project);
  if (!isFlamProject(project)) throw new TypeError('FLAM_PROJECT_REQUIRED');
  const nextDocument = replaceAdventureDocument(project.authoring.document, document);
  return { ...project, authoring: { ...project.authoring, document: nextDocument,
    ...(project.authoring.graphLayout ? { graphLayout: pruneFlamGraphLayout(project.authoring.graphLayout, nextDocument) } : {}),
  } };
}

export function withFlamGraphLayout(project, positions) {
  readProjectEnvelope(project);
  if (!isFlamProject(project)) throw new TypeError('FLAM_PROJECT_REQUIRED');
  const graphLayout = { version: 1, positions: structuredClone(positions) };
  const next = { ...project, authoring: { ...project.authoring, graphLayout } };
  readProjectEnvelope(next);
  return JSON.stringify(project.authoring.graphLayout) === JSON.stringify(graphLayout) ? project : next;
}
