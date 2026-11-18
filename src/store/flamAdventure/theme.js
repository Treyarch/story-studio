// Contrat commun aux scènes et aux gabarits de consultation actuels et futurs.
export const FLAM_DEFAULT_COLORS = Object.freeze({ background: '#132e32', text: '#f3f0df', selection: '#53d9d1' });
export const FLAM_COLOR_FIELDS = Object.freeze(Object.keys(FLAM_DEFAULT_COLORS));
export const isFlamColor = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

export function screenColors(document, screen) {
  return Object.fromEntries(FLAM_COLOR_FIELDS.map(field => [field,
    [screen?.colors?.[field], document.theme?.[field], FLAM_DEFAULT_COLORS[field]].find(isFlamColor),
  ]));
}

// Projection d'auteur : aucune condition, transition ou partie simulée.
export function screenPreview(document, collection, id, labels, selection = 0) {
  const screen = ['scenes', 'screens'].includes(collection) && document[collection]?.find(entry => entry.id === id);
  if (!screen) return null;
  const colors = screenColors(document, screen);
  if (collection === 'screens' && (screen.type === 'grid' || screen.contentSource === 'item')) {
    const entries = screen.source === 'collection' ? (screen.entries ?? []).map(entry => ({ id: entry.id, name: entry.label, image: entry.image })) : document.items;
    const item = entries[Math.min(selection, entries.length - 1)];
    return { enhanced: true, layout: screen.type === 'grid' ? 'grid' : 'detail', entries, collection: screen.source === 'collection',
      title: screen.type === 'grid' ? screen.title : item?.name ?? screen.title,
      text: screen.type === 'grid' ? '' : item?.text ?? '', image: screen.type === 'grid' ? null : item?.image ?? null, audio: item?.audio ?? null, detailLayout: screen.layout ?? 'split',
      options: entries.length ? entries.map(item => item.name) : [screen.source === 'collection' ? labels.emptyCollection : labels.empty], colors };
  }
  if (collection === 'screens' && screen.type === 'character') return {
    enhanced: true, layout: 'detail', detailLayout: 'split', title: screen.title,
    text: [screen.text, ...(screen.information ?? []).map(info => info.text)].filter(Boolean).join('\n\n'),
    image: screen.image, options: [labels.back], colors, character: true,
  };
  if (collection === 'screens' && screen.type === 'detail') return {
    enhanced: true, layout: 'detail', detailLayout: screen.layout ?? 'split', title: screen.title, text: screen.text,
    image: screen.image, audio: screen.audio ?? null, options: screen.audio ? [labels.listen, labels.back] : [labels.back], colors,
  };
  const choices = new Map(document.choices.map(choice => [choice.id, choice]));
  const entries = collection === 'scenes'
    ? (screen.ending ? [] : screen.choices.map(id => ({ label: choices.get(id)?.label ?? labels.missing, image: choices.get(id)?.image })))
    : screen.links.map(link => ({ label: link.type === 'narrative' ? choices.get(link.choiceId)?.label ?? labels.missing : link.label, image: link.image }));
  if (collection === 'screens' && screen.id === document.mainMenuId) entries.unshift({ label: labels.resume });
  if (collection === 'screens' && screen.id === document.mainMenuId) entries.push({ label: labels.restart }, { label: labels.library });
  else entries.push({ label: collection === 'scenes' ? (document.mainMenuId || document.presentation ? labels.menu : labels.inventory) : labels.back });
  const image = screen.illustrationMode === 'selection' ? entries[Math.min(selection, entries.length - 1)]?.image || screen.image : screen.image;
  return { enhanced: Boolean(document.mainMenuId || document.presentation), title: screen.title, text: screen.text, image, audio: collection === 'scenes' ? screen.audio : null,
    options: entries.map(entry => entry.label), colors: screenColors(document, screen) };
}
