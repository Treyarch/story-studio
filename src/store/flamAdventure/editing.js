import { adventureMediaOwners } from './presentation.js';
import { planFlamGraphLink } from './graphLinks.js';
import { AdventureDocumentError, editAdventureDefinition, replaceAdventureDocument } from './document.js';
import { withFlamDocument, withFlamGraphLayout } from './project.js';

export function newAdventureDefinition(collection, id) {
  if (collection === 'screens') return { id, type: 'menu', title: '', text: '', image: null, links: [] };
  if (collection === 'scenes') return { id, title: '', text: '', audio: null, image: null, ending: false, choices: [] };
  if (collection === 'choices') return { id, label: '', destination: null, conditions: [], effects: [], rewardId: null, rollId: null, replayAudioOnReturn: true, unavailable: { mode: 'disabled', explanation: '' } };
  if (collection === 'rewards') return { id, name: '', repeatable: false, effects: [] };
  if (collection === 'rolls') return { id, name: '', outcomes: [{ min: 1, max: 20, destination: null }] };
  if (['classes', 'items', 'events'].includes(collection)) return { id, name: '' };
  throw new AdventureDocumentError('INVALID_ADVENTURE_EDIT', '/');
}

// Les gestes qui touchent plusieurs définitions sont atomiques : un choix et
// son rattachement à la scène forment une seule étape de l'historique commun.
export function editAdventure(document, command) {
  const { type, collection, id, patch, sceneId } = command;
  if (type === 'patch') return editAdventureDefinition(document, { collection, id, patch });
  const next = structuredClone(document);
  if (type === 'menuLinkMedia') {
    const link = next.screens?.find(screen => screen.id === command.menuId && screen.type === 'menu')?.links.find(link => link.id === command.linkId);
    if (!link) return document;
    link.image = command.value;
  } else if (type === 'presentationMedia') {
    const owner = [...adventureMediaOwners(next, false)].find(entry => command.ownerId === null ? entry === next.presentation : entry.id === command.ownerId);
    if (!owner || !['audio', 'image'].includes(command.kind) || !Object.hasOwn(owner, command.kind)) return document;
    owner[command.kind] = command.value;
  } else if (type === 'document') {
    for (const field of Object.keys(patch)) {
      if (!['title', 'startSceneId', 'presentation', 'mainMenuId', 'theme'].includes(field)) throw new AdventureDocumentError('INVALID_ADVENTURE_EDIT', `/${field}`);
    }
    Object.assign(next, patch);
  } else if (type === 'linkNew') {
    if (!['scenes', 'rolls'].includes(command.targetCollection)) throw new AdventureDocumentError('INVALID_ADVENTURE_EDIT', '/scenes');
    const target = newAdventureDefinition(command.targetCollection, command.targetId);
    if (command.targetCollection === 'scenes') target.title = command.name;
    else target.name = command.name;
    next[command.targetCollection].push(target);
    const plan = planFlamGraphLink(next, command.port, { collection: command.targetCollection, id: target.id }, id);
    if (!plan) throw new AdventureDocumentError('INVALID_ADVENTURE_EDIT', '/choices');
    return replaceAdventureDocument(document, editAdventure(next, plan.command));
  } else if (type === 'connect') {
    if (!['scenes', 'rolls'].includes(command.targetCollection)) throw new AdventureDocumentError('INVALID_ADVENTURE_EDIT', '/scenes');
    const scene = next.scenes.find(scene => scene.id === sceneId);
    const target = next[command.targetCollection].find(entry => entry.id === command.targetId);
    if (!scene || !target) {
      throw new AdventureDocumentError('MISSING_ADVENTURE_DEFINITION', '/scenes');
    }
    const choice = newAdventureDefinition('choices', id);
    choice.label = target.title || target.name || '';
    if (command.targetCollection === 'rolls') choice.rollId = target.id;
    else choice.destination = target.id;
    next.choices.push(choice);
    scene.choices.push(id);
  } else if (type === 'add') {
    const entry = newAdventureDefinition(collection, id);
    if (collection === 'screens' && command.screenType) {
      entry.type = command.screenType;
      if (entry.type === 'character') entry.information = [];
      if (entry.type === 'grid') Object.assign(entry, { source: 'inventory', detailScreenId: null });
    }
    next[collection] ??= [];
    next[collection].push(entry);
    if (collection === 'choices' && command.menuId) {
      const menu = next.screens?.find(screen => screen.id === command.menuId && screen.type === 'menu');
      if (!menu) throw new AdventureDocumentError('MISSING_ADVENTURE_DEFINITION', '/screens');
      menu.links.push({ id: command.linkId, type: 'narrative', choiceId: id });
    } else if (collection === 'choices') {
      const scene = next.scenes.find(scene => scene.id === sceneId);
      if (!scene) throw new AdventureDocumentError('MISSING_ADVENTURE_DEFINITION', '/scenes');
      scene.choices.push(id);
    }
  } else if (type === 'removeChoice') {
    if (command.menuId) {
      const menu = next.screens?.find(screen => screen.id === command.menuId && screen.type === 'menu');
      if (!menu) throw new AdventureDocumentError('MISSING_ADVENTURE_DEFINITION', '/screens');
      menu.links = menu.links.filter(link => link.id !== command.linkId || link.type !== 'narrative' || link.choiceId !== id);
    } else {
      const scene = next.scenes.find(scene => scene.id === sceneId);
      if (!scene) throw new AdventureDocumentError('MISSING_ADVENTURE_DEFINITION', '/scenes');
      scene.choices = scene.choices.filter(choice => choice !== id);
    }
    if (!next.scenes.some(scene => scene.choices.includes(id))
      && !(next.screens ?? []).some(screen => screen.links.some(link => link.type === 'narrative' && link.choiceId === id))) next.choices = next.choices.filter(choice => choice.id !== id);
  } else if (type === 'remove') {
    return editAdventureDefinition(document, { collection, id, patch: null });
  } else throw new AdventureDocumentError('INVALID_ADVENTURE_EDIT', '/');
  return replaceAdventureDocument(document, next);
}

// Les médias peuvent arriver après un dialogue ou une génération : lire le
// projet vivant et vérifier son époque évite toute écriture dans le suivant.
export function commitAdventureEdit(store, epoch, command) {
  if (store.workEpochRef.current !== epoch) return { status: 'stale' };
  const project = store.readProject();
  if (project?.authoringMode !== 'flam') return { status: 'stale' };
  if (command.type === 'menuLinkMedia' && !project.authoring.document.screens?.some(screen => screen.id === command.menuId && screen.type === 'menu' && screen.links.some(link => link.id === command.linkId))) return { status: 'stale' };
  if (command.type === 'layout') {
    const next = withFlamGraphLayout(project, command.positions);
    if (next === project) return { status: 'unchanged' };
    store.setProject(next);
    return { status: 'applied' };
  }
  if (['patch', 'remove', 'removeChoice'].includes(command.type)
    && !project.authoring.document[command.collection ?? 'choices']?.some(entry => entry.id === command.id)) return { status: 'stale' };
  const document = editAdventure(project.authoring.document, command);
  let nextProject = withFlamDocument(project, document);
  if (command.type === 'linkNew') {
    const positions = (project.authoring.graphLayout?.positions ?? command.positions ?? [])
      .filter(position => document[position.collection]?.some(entry => entry.id === position.id));
    nextProject = withFlamGraphLayout(nextProject, [...positions, {
      collection: command.targetCollection, id: command.targetId, ...command.position,
    }]);
  }
  store.setProject(nextProject);
  return { status: 'applied' };
}

export function adventureDiagnosticTarget(document, path) {
  const [, collection, index] = path.split('/');
  return document[collection]?.[Number(index)]?.id ? { collection, id: document[collection][Number(index)].id } : null;
}
