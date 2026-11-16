import { flamLinkPorts } from '../../store/flamAdventure/graphLinks.js';

// Projection de navigation uniquement : les règles restent dans le document FLAM.
export const graphNodeId = (collection, id) => `${collection}:${id}`;

export function flamGraphElements(document, labels) {
  const nodes = [
    ...document.scenes.map(scene => ({ data: {
      id: graphNodeId('scenes', scene.id), collection: 'scenes', definitionId: scene.id,
      linkPorts: flamLinkPorts(document, 'scenes', scene.id),
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
  return [...nodes, ...edges];
}
