// Les anciens projets restent sans présentation explicite jusqu'à activation.
export function createAdventurePresentation(makeId, labels) {
  return {
    image: null, text: '',
    sections: ['chapters', 'character', 'inventory', 'collection', 'collection'].map((kind, i) => ({
      id: makeId(), kind, title: labels[i], image: null, enabled: true, entries: [],
    })),
    chapters: [], progress: { target: 1, milestones: [] },
  };
}

export function* adventureMediaOwners(document) {
  yield* document.scenes;
  yield* document.items;
  const view = document.presentation;
  if (!view) return;
  yield view;
  for (const section of view.sections) { yield section; yield* section.entries; }
  yield* view.chapters;
}
