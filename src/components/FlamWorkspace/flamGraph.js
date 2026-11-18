import { screenColors } from '../../store/flamAdventure/theme.js';
import { flamLinkPorts } from '../../store/flamAdventure/graphLinks.js';

// Projection de navigation uniquement : les règles restent dans le document FLAM.
export const graphNodeId = (collection, id) => `${collection}:${id}`;

export function flamGraphElements(document, labels) {
  const nodes = [
    ...(document.screens ?? []).map(screen => ({ data: {
      id: graphNodeId('screens', screen.id), collection: 'screens', definitionId: screen.id,
      linkPorts: flamLinkPorts(document, 'screens', screen.id),
      screenBackground: screenColors(document, screen).background, screenText: screenColors(document, screen).text,
      label: screen.title || labels.untitled, screenType: screen.type, consultation: true,
      start: screen.id === document.mainMenuId, narrative: screen.links.some(link => link.type === 'narrative'),
    } })),
    ...document.scenes.map(scene => ({ data: {
      id: graphNodeId('scenes', scene.id), collection: 'scenes', definitionId: scene.id,
      linkPorts: flamLinkPorts(document, 'scenes', scene.id),
      screenBackground: screenColors(document, scene).background, screenText: screenColors(document, scene).text,
      label: scene.title || labels.untitled,
      start: scene.id === document.startSceneId, ending: scene.ending,
    } })),
    ...document.rolls.map(roll => ({ data: {
      id: graphNodeId('rolls', roll.id), collection: 'rolls', definitionId: roll.id,
      linkPorts: flamLinkPorts(document, 'rolls', roll.id),
      label: roll.name || labels.untitled,
    } })),
  ];
  const ids = new Set(nodes.map(node => node.data.id));
  const choices = new Map(document.choices.map(choice => [choice.id, choice]));
  const edges = [];
  for (const scene of document.scenes) {
    for (const [index, choiceId] of scene.choices.entries()) {
      const choice = choices.get(choiceId);
      if (!choice) continue;
      const target = choice.rollId === null ? graphNodeId('scenes', choice.destination) : graphNodeId('rolls', choice.rollId);
      if (!ids.has(target)) continue; // Le diagnostic du brouillon reste accessible dans l'inspecteur.
      const selfLoop = choice.rollId === null && choice.destination === scene.id;
      edges.push({ data: {
        id: `choice:${scene.id}:${index}`, source: graphNodeId('scenes', scene.id), target,
        collection: 'choices', definitionId: choice.id, sourcePortKey: `choice:${choice.id}`,
        label: choice.label || labels.untitled,
        conditional: choice.conditions.length > 0,
        selfLoop,
      } });
    }
  }
  for (const roll of document.rolls) {
    for (const [index, outcome] of roll.outcomes.entries()) {
      const target = graphNodeId('scenes', outcome.destination);
      if (!ids.has(target)) continue;
      edges.push({ data: {
        id: `outcome:${roll.id}:${index}`, source: graphNodeId('rolls', roll.id), target,
        collection: 'rolls', definitionId: roll.id, sourcePortKey: `outcome:${index}`, selfLoop: false, label: `${outcome.min}–${outcome.max}`,
      } });
    }
  }
  for (const screen of document.screens ?? []) for (const link of screen.links) {
    if (link.type === 'narrative') {
      const choice = choices.get(link.choiceId);
      if (!choice) continue;
      const target = choice.rollId === null ? graphNodeId('scenes', choice.destination) : graphNodeId('rolls', choice.rollId);
      if (ids.has(target)) edges.push({ data: {
        id: `menu-choice:${screen.id}:${link.id}`, source: graphNodeId('screens', screen.id), target,
        collection: 'choices', definitionId: choice.id, sourcePortKey: `menu-choice:${link.id}`,
        conditional: choice.conditions.length > 0, label: choice.label || labels.untitled,
      } });
      continue;
    }
    const target = graphNodeId('screens', link.screenId);
    if (ids.has(target)) edges.push({ data: {
      id: `consult:${screen.id}:${link.id}`, source: graphNodeId('screens', screen.id), target,
      collection: 'screens', definitionId: screen.id, sourcePortKey: `consult:${link.id}`,
      consultation: true, label: link.label || labels.untitled,
    } });
  }
  for (const screen of document.screens ?? []) {
    const target = graphNodeId('screens', screen.detailScreenId);
    if (screen.type === 'grid' && screen.source === 'inventory' && ids.has(target)) edges.push({ data: {
      id: `grid-detail:${screen.id}`, source: graphNodeId('screens', screen.id), target,
      collection: 'screens', definitionId: screen.id, sourcePortKey: 'grid-detail', consultation: true,
      label: labels.itemDetail || labels.untitled,
    } });
  }
  for (const screen of document.screens ?? []) for (const entry of screen.entries ?? []) {
    const target = graphNodeId('screens', entry.screenId);
    if (screen.source === 'collection' && ids.has(target)) edges.push({ data: {
      id: `collection:${screen.id}:${entry.id}`, source: graphNodeId('screens', screen.id), target,
      collection: 'screens', definitionId: screen.id, sourcePortKey: `collection:${entry.id}`,
      consultation: true, conditional: entry.conditions.length > 0, label: entry.label || labels.untitled,
    } });
  }
  return [...nodes, ...edges];
}
