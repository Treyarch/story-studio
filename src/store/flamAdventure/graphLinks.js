// Les prises décrivent les liens d'auteur ; aucune règle de partie n'est exécutée.
export function flamLinkPorts(document, collection, id) {
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
  if (port.kind === 'add' || port.kind === 'choice') {
    const scene = document.scenes.find(scene => scene.id === port.sceneId);
    return Boolean(scene && !scene.ending && (port.kind === 'add'
      || (scene.choices.includes(port.choiceId) && document.choices.some(choice => choice.id === port.choiceId))));
  }
  if (port.kind !== 'outcome') return false;
  const outcome = document.rolls.find(roll => roll.id === port.rollId)?.outcomes[port.index];
  return Boolean(outcome && port.expected && ['min', 'max', 'destination'].every(key => outcome[key] === port.expected[key]));
}

export function planFlamGraphLink(document, port, target, newChoiceId) {
  if (!isCurrentFlamLinkPort(document, port) || !target
    || !['scenes', 'rolls'].includes(target.collection)
    || !document[target.collection].some(entry => entry.id === target.id)
    || (port.kind === 'outcome' && target.collection !== 'scenes')) return null;
  if (port.kind === 'add') return {
    command: { type: 'connect', id: newChoiceId, sceneId: port.sceneId, targetCollection: target.collection, targetId: target.id },
    selection: { collection: 'choices', id: newChoiceId },
  };
  if (port.kind === 'choice') return {
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
