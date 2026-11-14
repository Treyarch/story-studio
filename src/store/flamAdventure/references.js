// Les références du document sont parcourues au même endroit pour les
// diagnostics et pour protéger une suppression, sans réécrire les règles.
export function* adventureReferences(document) {
  yield { collection: 'scenes', id: document.startSceneId, path: '/startSceneId' };
  for (const [index, scene] of document.scenes.entries()) {
    for (const [choiceIndex, id] of scene.choices.entries()) {
      yield { collection: 'choices', id, path: `/scenes/${index}/choices/${choiceIndex}` };
    }
  }
  for (const [index, choice] of document.choices.entries()) {
    const path = `/choices/${index}`;
    if (choice.rollId !== null) yield { collection: 'rolls', id: choice.rollId, path: `${path}/rollId` };
    if (choice.rollId === null || choice.destination !== null) yield { collection: 'scenes', id: choice.destination, path: `${path}/destination` };
    if (choice.rewardId !== null) yield { collection: 'rewards', id: choice.rewardId, path: `${path}/rewardId` };
    yield* ruleReferences(choice.conditions, `${path}/conditions`);
    yield* ruleReferences(choice.effects, `${path}/effects`);
  }
  for (const [index, reward] of document.rewards.entries()) {
    yield* ruleReferences(reward.effects, `/rewards/${index}/effects`);
  }
  for (const [index, roll] of document.rolls.entries()) {
    for (const [outcomeIndex, outcome] of roll.outcomes.entries()) {
      yield { collection: 'scenes', id: outcome.destination, path: `/rolls/${index}/outcomes/${outcomeIndex}/destination` };
    }
  }
}

function* ruleReferences(rules, path) {
  for (const [index, rule] of rules.entries()) {
    for (const [field, collection] of [['classId', 'classes'], ['itemId', 'items'], ['eventId', 'events']]) {
      if (Object.hasOwn(rule, field)) yield { collection, id: rule[field], path: `${path}/${index}/${field}` };
    }
  }
}
