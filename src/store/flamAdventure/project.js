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
  return { ...project, authoring: { document: replaceAdventureDocument(project.authoring.document, document) } };
}
