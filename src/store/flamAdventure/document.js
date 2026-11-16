import { adventureReferences } from './references.js';

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string';
const identifier = value => text(value) && value.trim().length > 0;
const reference = value => value === null || identifier(value);
const number = value => typeof value === 'number' && Number.isFinite(value);
const boolean = value => typeof value === 'boolean';
const positiveInteger = value => Number.isSafeInteger(value) && value > 0;
const oneOf = (...values) => value => values.includes(value);

export class AdventureDocumentError extends Error {
  constructor(code, path, references = []) {
    super(`${code}: ${path}`);
    this.name = 'AdventureDocumentError';
    Object.assign(this, { code, path, references });
  }
}

function check(value, rule, path) {
  const fail = () => { throw new AdventureDocumentError('INVALID_ADVENTURE_DOCUMENT', path); };
  if (typeof rule === 'function') {
    if (!rule(value, path)) fail();
  } else if (Array.isArray(rule)) {
    if (!Array.isArray(value)) fail();
    value.forEach((entry, index) => check(entry, rule[0], `${path}/${index}`));
  } else {
    if (!isObject(value)) fail();
    for (const key of Object.keys(value)) {
      if (!Object.hasOwn(rule, key)) throw new AdventureDocumentError('UNKNOWN_ADVENTURE_FIELD', `${path}/${key}`);
    }
    for (const [key, field] of Object.entries(rule)) check(value[key], field, `${path}/${key}`);
  }
}

function variant(shapes) {
  return (value, path) => {
    if (!isObject(value) || !Object.hasOwn(shapes, value.type)) return false;
    check(value, { type: oneOf(value.type), ...shapes[value.type] }, path);
    return true;
  };
}

const condition = variant({
  class: { classId: reference },
  item: { itemId: reference, quantity: number },
  event: { eventId: reference, present: boolean },
});
const effect = variant({
  chooseClass: { classId: reference },
  giveItem: { itemId: reference, quantity: number },
  consumeItem: { itemId: reference, quantity: number },
  setEvent: { eventId: reference },
});
const optional = rule => (value, path) => { if (value !== undefined) check(value, rule, path); return true; };
const media = value => value === null || text(value);
const presentation = {
  image: media, text,
  sections: [{ id: identifier, kind: oneOf('chapters', 'character', 'inventory', 'collection'), title: text,
    image: media, enabled: boolean, entries: [{ id: identifier, title: text, text, image: media, audio: media,
      conditions: [condition], unavailable: oneOf('hidden', 'disabled') }] }],
  chapters: [{ id: identifier, title: text, image: media,
    passages: [{ sceneId: reference, replayable: boolean, conditions: [condition] }] }],
  progress: { target: number, milestones: [{ id: identifier, conditions: [condition] }] },
};
const named = { id: identifier, name: text };
const definitions = {
  scenes: [{ id: identifier, title: text, text, audio: value => value === null || text(value),
    image: value => value === null || text(value), ending: boolean, choices: [identifier] }],
  choices: [{ id: identifier, label: text, destination: reference, conditions: [condition], effects: [effect],
    rewardId: reference, rollId: reference, replayAudioOnReturn: value => value === undefined || boolean(value), unavailable: { mode: oneOf('disabled', 'hidden'), explanation: text } }],
  classes: [named],
  items: [{ ...named, text: optional(text), image: optional(media), audio: optional(media) }],
  events: [named],
  rewards: [{ ...named, repeatable: boolean, effects: [effect] }],
  rolls: [{ ...named, outcomes: [{ min: number, max: number, destination: reference }] }],
};
export const ADVENTURE_COLLECTIONS = Object.freeze(Object.keys(definitions));

export function createAdventureDocument({ title = '' } = {}) {
  return { version: 1, id: crypto.randomUUID(), saveVersion: 1, title, startSceneId: null,
    ...Object.fromEntries(ADVENTURE_COLLECTIONS.map(key => [key, []])) };
}

// La forme est stricte ; les références et valeurs de règles incomplètes sont
// diagnostiquées séparément pour que l'auteur puisse conserver un brouillon.
export function assertAdventureDocument(document) {
  if (isObject(document) && document.version !== 1) {
    throw new AdventureDocumentError('UNSUPPORTED_ADVENTURE_VERSION', '/version');
  }
  check(document, {
    version: oneOf(1),
    id: value => text(value) && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
    saveVersion: positiveInteger, title: text, startSceneId: reference, presentation: optional(presentation), ...definitions,
  }, '');
  const ids = new Set();
  for (const collection of ADVENTURE_COLLECTIONS) {
    document[collection].forEach((entry, index) => {
      if (ids.has(entry.id)) throw new AdventureDocumentError('DUPLICATE_ADVENTURE_ID', `/${collection}/${index}/id`);
      ids.add(entry.id);
    });
  }
  for (const entry of presentationDefinitions(document)) {
    if (ids.has(entry.id)) throw new AdventureDocumentError('DUPLICATE_ADVENTURE_ID', '/presentation');
    ids.add(entry.id);
  }
  return document;
}

export function presentationDefinitions(document) {
  const view = document.presentation;
  return view ? [...view.sections, ...view.sections.flatMap(section => section.entries), ...view.chapters, ...view.progress.milestones] : [];
}

export function replaceAdventureDocument(previous, next) {
  assertAdventureDocument(previous);
  assertAdventureDocument(next);
  for (const key of ['id', 'saveVersion']) {
    if (previous[key] !== next[key]) throw new AdventureDocumentError('ADVENTURE_IDENTITY_CHANGE', `/${key}`);
  }
  const references = [...adventureReferences(next)];
  for (const collection of ADVENTURE_COLLECTIONS) {
    const remaining = new Set(next[collection].map(entry => entry.id));
    for (const [index, entry] of previous[collection].entries()) {
      if (remaining.has(entry.id)) continue;
      const used = references.filter(ref => ref.collection === collection && ref.id === entry.id);
      if (used.length) throw new AdventureDocumentError('REFERENCED_ADVENTURE_DEFINITION', `/${collection}/${index}`, used.map(ref => ref.path));
    }
  }
  return structuredClone(next);
}

// Un patch remplace des champs d'une définition ; null demande sa suppression.
// L'identifiant est celui de la commande, jamais une valeur renommable.
export function editAdventureDefinition(document, { collection, id, patch }) {
  assertAdventureDocument(document);
  if (!Object.hasOwn(definitions, collection) || !identifier(id) || (patch !== null && (!isObject(patch) || Object.hasOwn(patch, 'id')))) {
    throw new AdventureDocumentError('INVALID_ADVENTURE_EDIT', '/');
  }
  const next = structuredClone(document);
  const index = next[collection].findIndex(entry => entry.id === id);
  if (patch === null) {
    if (index < 0) throw new AdventureDocumentError('MISSING_ADVENTURE_DEFINITION', `/${collection}`);
    next[collection].splice(index, 1);
  } else if (index < 0) next[collection].push({ id, ...patch });
  else next[collection][index] = { ...next[collection][index], ...patch };
  return replaceAdventureDocument(document, next);
}
