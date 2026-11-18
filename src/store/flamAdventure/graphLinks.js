// Les prises décrivent les liens d'auteur ; aucune règle de partie n'est exécutée.
export function flamLinkPorts(document, collection, id) {
  if (collection === 'screens') {
    const screen = document.screens?.find(entry => entry.id === id);
    if (screen?.type === 'grid' && screen.source === 'collection') return (screen.entries ?? []).map(entry => ({
      key: `collection:${entry.id}`, kind: 'collection-entry', screenId: id, entryId: entry.id, label: entry.label, conditional: entry.conditions.length > 0,
    }));
    if (screen?.type === 'grid') return [{ key: 'grid-detail', kind: 'grid-detail', screenId: id }];
    if (screen?.type !== 'menu') return [];
    return [...screen.links.map(link => link.type === 'narrative' ? {
      key: `menu-choice:${link.id}`, kind: 'menu-choice', screenId: id, linkId: link.id, choiceId: link.choiceId,
      label: document.choices.find(choice => choice.id === link.choiceId)?.label,
      conditional: (document.choices.find(choice => choice.id === link.choiceId)?.conditions.length ?? 0) > 0,
    } : ({ key: `consult:${link.id}`, kind: 'consult', screenId: id, linkId: link.id, label: link.label })),
      { key: 'consult-add', kind: 'consult-add', screenId: id }];
  }
  if (collection === 'scenes') {
    const scene = document.scenes.find(entry => entry.id === id);
    if (!scene || scene.ending) return [];
    const choices = new Map(document.choices.map(choice => [choice.id, choice]));
    return [
      ...[...new Set(scene.choices)].filter(choiceId => choices.has(choiceId)).map(choiceId => ({
        key: `choice:${choiceId}`, kind: 'choice', sceneId: id, choiceId, label: choices.get(choiceId).label, conditional: choices.get(choiceId).conditions.length > 0,
      })),
      { key: 'add', kind: 'add', sceneId: id },
    ];
  }
  const roll = document.rolls.find(entry => entry.id === id);
  return (roll?.outcomes ?? []).map((outcome, index) => ({
    key: `outcome:${index}`, kind: 'outcome', rollId: id, index, expected: { ...outcome },
  }));
}

export function isCurrentFlamLinkPort(document, port) {
  if (!port) return false;
  if (port.kind === 'grid-detail') return document.screens?.some(screen => screen.id === port.screenId && screen.type === 'grid' && screen.source === 'inventory');
  if (port.kind === 'collection-entry') return document.screens?.some(screen => screen.id === port.screenId && screen.type === 'grid' && screen.source === 'collection' && screen.entries?.some(entry => entry.id === port.entryId));
  if (['consult', 'consult-add', 'menu-choice'].includes(port.kind)) {
    const screen = document.screens?.find(entry => entry.id === port.screenId);
    if (screen?.type !== 'menu') return false;
    if (port.kind === 'consult-add') return true;
    const link = screen.links.find(link => link.id === port.linkId);
    if (port.kind === 'menu-choice') return link?.type === 'narrative' && link.choiceId === port.choiceId
      && document.choices.some(choice => choice.id === port.choiceId);
    return Boolean(link && link.type !== 'narrative');
  }
  if (port.kind === 'add' || port.kind === 'choice') {
    const scene = document.scenes.find(scene => scene.id === port.sceneId);
    return Boolean(scene && !scene.ending && (port.kind === 'add'
      || (scene.choices.includes(port.choiceId) && document.choices.some(choice => choice.id === port.choiceId))));
  }
  if (port.kind !== 'outcome') return false;
  const outcome = document.rolls.find(roll => roll.id === port.rollId)?.outcomes[port.index];
  return Boolean(outcome && port.expected && ['min', 'max', 'destination'].every(key => outcome[key] === port.expected[key]));
}

// Une fiche alimentée par un objet exige le contexte transmis par une grille.
export function isFlamLinkTarget(document, port, target) {
  if (!port || !target || !document[target.collection]?.some(entry => entry.id === target.id)) return false;
  if (port.kind === 'collection-entry') return target.collection === 'screens'
    && document.screens.some(screen => screen.id === target.id && screen.type === 'detail' && screen.contentSource !== 'item');
  if (port.kind === 'grid-detail') return target.collection === 'screens'
    && document.screens.some(screen => screen.id === target.id && screen.type === 'detail' && screen.contentSource === 'item');
  if (['consult', 'consult-add'].includes(port.kind)) return target.collection === 'screens'
    && document.screens.some(screen => screen.id === target.id && screen.contentSource !== 'item');
  return ['scenes', 'rolls'].includes(target.collection) && (port.kind !== 'outcome' || target.collection === 'scenes');
}

export function planFlamGraphLink(document, port, target, newChoiceId) {
  if (!isCurrentFlamLinkPort(document, port) || !isFlamLinkTarget(document, port, target)) return null;
  if (port.kind === 'collection-entry') {
    const grid = document.screens.find(screen => screen.id === port.screenId);
    return { command: { type: 'patch', collection: 'screens', id: grid.id, patch: {
      entries: grid.entries.map(entry => entry.id === port.entryId ? { ...entry, screenId: target.id } : entry),
    } }, selection: { collection: 'screens', id: grid.id } };
  }
  if (port.kind === 'grid-detail') return {
    command: { type: 'patch', collection: 'screens', id: port.screenId, patch: { detailScreenId: target.id } },
    selection: { collection: 'screens', id: port.screenId },
  };
  if (isCurrentFlamLinkPort(document, port) && ['consult', 'consult-add'].includes(port.kind)) {
    const screen = document.screens.find(entry => entry.id === port.screenId);
    const detail = target?.collection === 'screens' && document.screens.find(entry => entry.id === target.id);
    if (!detail) return null;
    const links = port.kind === 'consult-add'
      ? [...screen.links, { id: newChoiceId, label: detail.title, screenId: detail.id }]
      : screen.links.map(link => link.id === port.linkId ? { ...link, screenId: detail.id } : link);
    return { command: { type: 'patch', collection: 'screens', id: screen.id, patch: { links } }, selection: { collection: 'screens', id: screen.id } };
  }
  if (!isCurrentFlamLinkPort(document, port) || !target
    || !['scenes', 'rolls'].includes(target.collection)
    || !document[target.collection].some(entry => entry.id === target.id)
    || (port.kind === 'outcome' && target.collection !== 'scenes')) return null;
  if (port.kind === 'add') return {
    command: { type: 'connect', id: newChoiceId, sceneId: port.sceneId, targetCollection: target.collection, targetId: target.id },
    selection: { collection: 'choices', id: newChoiceId },
  };
  if (['choice', 'menu-choice'].includes(port.kind)) return {
    command: { type: 'patch', collection: 'choices', id: port.choiceId,
      patch: { destination: target.collection === 'scenes' ? target.id : null, rollId: target.collection === 'rolls' ? target.id : null } },
    selection: { collection: 'choices', id: port.choiceId },
  };
  const roll = document.rolls.find(entry => entry.id === port.rollId);
  return {
    command: { type: 'patch', collection: 'rolls', id: roll.id,
      patch: { outcomes: roll.outcomes.map((outcome, index) => index === port.index ? { ...outcome, destination: target.id } : outcome) } },
    selection: { collection: 'rolls', id: roll.id },
  };
}
