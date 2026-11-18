// Les références du document sont parcourues au même endroit pour les
// diagnostics et pour protéger une suppression, sans réécrire les règles.
export function* adventureReferences(document) {
  if (document.mainMenuId != null) yield { collection: 'screens', id: document.mainMenuId, path: '/mainMenuId' };
  for (const [i, screen] of (document.screens ?? []).entries()) {
    if (screen.type === 'grid' && screen.source === 'inventory') yield { collection: 'screens', id: screen.detailScreenId ?? null, path: `/screens/${i}/detailScreenId` };
  }
  for (const [i, screen] of (document.screens ?? []).entries()) for (const [j, link] of screen.links.entries()) {
    yield link.type === 'narrative'
      ? { collection: 'choices', id: link.choiceId, path: `/screens/${i}/links/${j}/choiceId` }
      : { collection: 'screens', id: link.screenId, path: `/screens/${i}/links/${j}/screenId` };
  }
  for (const [i, screen] of (document.screens ?? []).entries()) for (const [j, entry] of (screen.entries ?? []).entries()) {
    yield { collection: 'screens', id: entry.screenId, path: `/screens/${i}/entries/${j}/screenId` };
    yield* ruleReferences(entry.conditions, `/screens/${i}/entries/${j}/conditions`);
  }
  for (const [i, screen] of (document.screens ?? []).entries()) for (const [j, info] of (screen.information ?? []).entries()) {
    yield* ruleReferences(info.conditions, `/screens/${i}/information/${j}/conditions`);
  }
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
  const view = document.presentation;
  if (view) {
    for (const [i, section] of view.sections.entries()) for (const [j, entry] of section.entries.entries()) {
      yield* ruleReferences(entry.conditions, `/presentation/sections/${i}/entries/${j}/conditions`);
    }
    for (const [i, chapter] of view.chapters.entries()) for (const [j, passage] of chapter.passages.entries()) {
      yield { collection: 'scenes', id: passage.sceneId, path: `/presentation/chapters/${i}/passages/${j}/sceneId` };
      yield* ruleReferences(passage.conditions, `/presentation/chapters/${i}/passages/${j}/conditions`);
    }
    for (const [i, milestone] of view.progress.milestones.entries()) {
      yield* ruleReferences(milestone.conditions, `/presentation/progress/milestones/${i}/conditions`);
    }
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
