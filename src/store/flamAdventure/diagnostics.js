import { ADVENTURE_COLLECTIONS, assertAdventureDocument } from './document.js';
import { adventureReferences } from './references.js';

export function diagnoseAdventureDocument(document) {
  assertAdventureDocument(document);
  const diagnostics = [];
  const report = (code, path, severity = 'error', params = {}) => diagnostics.push({ code, path, severity, params });
  const ids = Object.fromEntries(ADVENTURE_COLLECTIONS
    .map(collection => [collection, new Set(document[collection].map(entry => entry.id))]));
  for (const ref of adventureReferences(document)) {
    if (!ids[ref.collection].has(ref.id)) {
      report(ref.path === '/startSceneId' && ref.id === null ? 'MISSING_START' : 'MISSING_REFERENCE', ref.path,
        'error', { collection: ref.collection, id: ref.id });
    }
  }
  for (const [index, choice] of document.choices.entries()) {
    if (!choice.label.trim()) report('MISSING_LABEL', `/choices/${index}/label`);
    if (choice.rollId !== null && choice.destination !== null) report('AMBIGUOUS_DESTINATION', `/choices/${index}`);
    for (const field of ['conditions', 'effects']) diagnoseQuantities(choice[field], `/choices/${index}/${field}`, report);
  }
  for (const [index, reward] of document.rewards.entries()) {
    diagnoseQuantities(reward.effects, `/rewards/${index}/effects`, report);
  }
  const choices = new Map(document.choices.map(choice => [choice.id, choice]));
  const rewards = new Map(document.rewards.map(reward => [reward.id, reward]));
  for (const [index, scene] of document.scenes.entries()) {
    if (!scene.title.trim()) report('MISSING_TITLE', `/scenes/${index}/title`);
    if (!scene.ending && scene.choices.length === 0) report('NO_EXIT', `/scenes/${index}`);
    else if (!scene.ending && scene.choices.every(id => {
      const choice = choices.get(id);
      return choice && (choice.conditions.length > 0 || rewards.get(choice.rewardId)?.repeatable === false);
    })) {
      report('CONDITIONAL_EXITS', `/scenes/${index}`, 'warning');
    }
  }
  for (const [index, roll] of document.rolls.entries()) {
    const covered = new Set();
    for (const [outcomeIndex, outcome] of roll.outcomes.entries()) {
      const path = `/rolls/${index}/outcomes/${outcomeIndex}`;
      if (!Number.isInteger(outcome.min) || !Number.isInteger(outcome.max)
        || outcome.min < 1 || outcome.max > 20 || outcome.min > outcome.max) {
        report('INVALID_ROLL_RANGE', path);
        continue;
      }
      let overlap = false;
      for (let value = outcome.min; value <= outcome.max; value += 1) {
        if (covered.has(value)) overlap = true;
        covered.add(value);
      }
      if (overlap) report('ROLL_OVERLAP', path);
    }
    if (covered.size !== 20) report('ROLL_GAP', `/rolls/${index}/outcomes`);
  }
  const view = document.presentation;
  if (view) {
    if (!Number.isSafeInteger(view.progress.target) || view.progress.target <= 0
      || view.progress.target > view.progress.milestones.length) report('INVALID_PROGRESS', '/presentation/progress/target');
    for (const [i, milestone] of view.progress.milestones.entries()) {
      if (!milestone.conditions.length) report('INVALID_PROGRESS', `/presentation/progress/milestones/${i}`);
      diagnoseQuantities(milestone.conditions, `/presentation/progress/milestones/${i}/conditions`, report);
    }
    for (const [i, section] of view.sections.entries()) {
      if (!section.title.trim()) report('MISSING_TITLE', `/presentation/sections/${i}/title`);
      for (const [j, entry] of section.entries.entries()) {
        if (!entry.title.trim()) report('MISSING_TITLE', `/presentation/sections/${i}/entries/${j}/title`);
        diagnoseQuantities(entry.conditions, `/presentation/sections/${i}/entries/${j}/conditions`, report);
      }
    }
    for (const [i, chapter] of view.chapters.entries()) {
      if (!chapter.title.trim()) report('MISSING_TITLE', `/presentation/chapters/${i}/title`);
      const seen = new Set();
      if (!chapter.passages.length) report('EMPTY_CHAPTER', `/presentation/chapters/${i}/passages`);
      for (const [j, passage] of chapter.passages.entries()) {
        if (seen.has(passage.sceneId)) report('DUPLICATE_PASSAGE', `/presentation/chapters/${i}/passages/${j}`);
        seen.add(passage.sceneId);
        diagnoseQuantities(passage.conditions, `/presentation/chapters/${i}/passages/${j}/conditions`, report);
      }
    }
  }
  return diagnostics;
}

function diagnoseQuantities(rules, path, report) {
  rules.forEach((rule, index) => {
    if (Object.hasOwn(rule, 'quantity') && (!Number.isSafeInteger(rule.quantity) || rule.quantity <= 0)) {
      report('INVALID_QUANTITY', `${path}/${index}/quantity`);
    }
  });
}
