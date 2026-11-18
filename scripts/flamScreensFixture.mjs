import { fixture } from './flamRuntimeFixture.mjs';

export function screensFixture() {
  const document = fixture(true);
  document.title = 'Les archives du village';
  document.mainMenuId = 'accueil';
  document.screens = [
    { id: 'accueil', type: 'menu', title: 'Le bureau du village', text: 'Tes archives.', image: 'menu.png', links: [
      { id: 'carte', label: 'Voir la carte', screenId: 'carte' },
      { id: 'note', label: 'Lire la note', screenId: 'note' },
    ] },
    { id: 'carte', type: 'detail', title: 'La carte du village', text: 'Le vieux pont.', image: 'carte.png', links: [] },
    { id: 'note', type: 'detail', title: 'Une note', text: 'Bienvenue.', image: null, links: [] },
  ];
  return document;
}

export function mixedMenusFixture() {
  const document = screensFixture();
  const main = document.screens[0];
  main.links.push(
    { id: 'a', label: 'Parcours A', screenId: 'archives-a' },
    { id: 'b', label: 'Parcours B', screenId: 'archives-b' },
    ...Array.from({ length: 5 }, (_, i) => ({ id: `note-${i}`, label: `Note ${i}`, screenId: 'note' })),
    { id: 'depart-menu', type: 'narrative', choiceId: 'depart-menu' },
  );
  document.screens.push(
    { id: 'archives-a', type: 'menu', title: 'Archives A', text: '', image: null, links: [
      { id: 'carte', label: 'Carte partagée', screenId: 'carte' },
      { id: 'b', label: 'Visiter B', screenId: 'archives-b' },
      { id: 'impossible', type: 'narrative', choiceId: 'deux-cles' },
      { id: 'ouvrir', type: 'narrative', choiceId: 'passer-cle' },
      { id: 'cache', type: 'narrative', choiceId: 'commande-cachee' },
    ] },
    { id: 'archives-b', type: 'menu', title: 'Archives B', text: '', image: null, links: [
      { id: 'carte', label: 'Carte partagée', screenId: 'carte' },
      { id: 'jet', type: 'narrative', choiceId: 'lancer-de' },
    ] },
  );
  const command = (id, label, destination, effects, conditions = []) => ({
    id, label, destination, effects, conditions, rewardId: null, rollId: null,
    unavailable: { mode: 'disabled', explanation: 'Accès refusé' },
  });
  document.choices.push(
    command('depart-menu', 'Partir comme pisteur', 'clairiere', [{ type: 'chooseClass', classId: 'pisteur' }]),
    command('passer-cle', 'Passer avec la clé', 'sentier', [
      { type: 'consumeItem', itemId: 'cle', quantity: 1 },
      { type: 'setEvent', eventId: 'porte-ouverte' },
    ], [{ type: 'item', itemId: 'cle', quantity: 1 }, { type: 'event', eventId: 'porte-ouverte', present: false }]),
    command('deux-cles', 'Payer deux clés', 'sentier', [
      { type: 'giveItem', itemId: 'jeton:"é\\', quantity: 1 },
      { type: 'consumeItem', itemId: 'cle', quantity: 2 },
    ]),
    { ...command('commande-cachee', 'Commande cachée', 'sentier', [], [{ type: 'class', classId: 'ami' }]), unavailable: { mode: 'hidden', explanation: '' } },
  );
  return document;
}

export function themedScreensFixture() {
  const document = mixedMenusFixture();
  document.theme = { background: '#112233', text: '#ffeecc', selection: '#ff7700' };
  document.screens[0].colors = { background: '#203040' };
  document.screens.find(screen => screen.id === 'carte').colors = { text: '#00ddaa' };
  document.scenes.find(scene => scene.id === 'clairiere').colors = { background: '#101112', selection: '#abcdef' };
  return document;
}

export function inventoryGridFixture() {
  const document = screensFixture();
  document.screens[0].links.push({ id: 'affaires', label: 'Tes affaires', screenId: 'affaires' });
  document.screens.push(
    { id: 'affaires', type: 'grid', title: 'Tes affaires', text: '', image: null, links: [], source: 'inventory', detailScreenId: 'objet', colors: { selection: '#aabbcc' } },
    { id: 'objet', type: 'detail', title: 'Fiche type', text: '', image: null, links: [], contentSource: 'item', colors: { background: '#223344' } },
  );
  Object.assign(document.items.find(item => item.id === 'cle'), { text: 'Une clé dorée.', image: 'cle.png' });
  document.items.push(
    { id: 'corde', name: 'Corde', text: 'Une corde solide.', image: 'corde.png' },
    { id: 'boussole', name: 'Boussole', text: 'Elle montre le nord.' },
    { id: 'lanterne', name: 'Lanterne', text: 'Une douce lumière.', image: null },
    { id: 'galet', name: 'Galet', text: 'Un galet lisse.', image: 'galet.png' },
    { id: 'carte-objet', name: 'Carte', text: 'Le plan du port.', image: 'carte-objet.png' },
  );
  for (const [id, label, type] of [['equiper', 'Tout recevoir', 'giveItem'], ['deposer', 'Tout déposer', 'consumeItem']]) {
    document.scenes.find(scene => scene.id === 'clairiere').choices.push(id);
    document.choices.push({ id, label, destination: 'clairiere', conditions: [],
      effects: ['cle', 'corde', 'boussole', 'lanterne', 'galet', 'carte-objet'].map(itemId => ({ type, itemId, quantity: 1 })),
      rewardId: null, rollId: null, unavailable: { mode: 'disabled', explanation: '' } });
  }
  return document;
}

export function collectionsFixture() {
  const document = inventoryGridFixture();
  document.events.push({ id: 'cle-decouverte', name: 'Clé découverte' });
  document.rewards.find(reward => reward.id === 'coffre').effects.push({ type: 'setEvent', eventId: 'cle-decouverte' });
  const entry = (id, label, conditions = [], unavailable = 'hidden', screenId = 'carte', image = null) => ({ id, label, conditions, unavailable, screenId, image });
  document.screens[0].links.push(
    { id: 'souvenirs', label: 'Tes souvenirs', screenId: 'souvenirs' },
    { id: 'secrets-masques', label: 'Secrets invisibles', screenId: 'secrets-masques' },
  );
  document.screens.push(
    { id: 'souvenir-cle', type: 'detail', title: 'Souvenir de la clé', text: 'Une clé autrefois.', image: 'souvenir-cle.png', links: [] },
    { id: 'secret', type: 'detail', title: 'Le passage secret', text: 'Le chemin libre.', image: null, links: [] },
    { id: 'souvenirs', type: 'grid', title: 'Tes souvenirs', text: '', image: null, links: [], source: 'collection', detailScreenId: null,
      entries: [
        entry('entree-village', 'Village', [], 'hidden', 'carte', 'village.png'),
        entry('entree-secret', 'Passage secret', [{ type: 'event', eventId: 'porte-ouverte', present: true }], 'disabled', 'secret', 'secret.png'),
        entry('entree-decouverte', 'Clé découverte', [{ type: 'event', eventId: 'cle-decouverte', present: true }], 'hidden', 'souvenir-cle', 'memoire.png'),
        entry('entree-possession', 'Clé possédée', [{ type: 'item', itemId: 'cle', quantity: 1 }]),
        ...['Pont', 'Bois', 'Port', 'Archives'].map((label, index) => entry(`entree-libre-${index}`, label)),
        entry('entree-classe', 'Voix des bêtes', [{ type: 'class', classId: 'ami' }]),
      ] },
    { id: 'secrets-masques', type: 'grid', title: 'Secrets invisibles', text: '', image: null, links: [], source: 'collection', detailScreenId: null,
      entries: [entry('seul-secret', 'Voix des bêtes', [{ type: 'class', classId: 'ami' }])] },
  );
  return document;
}

export function selectionIllustrationsFixture() {
  const document = mixedMenusFixture();
  const main = document.screens[0];
  main.illustrationMode = 'selection'; main.image = 'main-common.png';
  for (const link of main.links) link.image = link.id === 'note' ? null : `main-${link.id}.png`;
  const a = document.screens.find(screen => screen.id === 'archives-a');
  a.illustrationMode = 'common'; a.image = 'a-common.png';
  for (const link of a.links) link.image = `a-${link.id}.png`;
  const b = document.screens.find(screen => screen.id === 'archives-b');
  b.illustrationMode = 'selection'; b.image = null; b.links[0].image = 'b-carte.png';
  const start = document.scenes.find(scene => scene.id === 'depart');
  start.illustrationMode = 'common'; start.image = 'start-common.png';
  document.choices.find(choice => choice.id === 'choisir-pisteur').image = 'pisteur.png';
  document.choices.find(choice => choice.id === 'choisir-ami').image = 'ami.png';
  document.choices.find(choice => choice.id === 'depart-menu').image = 'scene-command.png';
  const scene = document.scenes.find(scene => scene.id === 'clairiere');
  scene.illustrationMode = 'selection'; scene.image = 'scene-common.png';
  for (const [id, image] of [['prendre-cle','key.png'], ['ouvrir-porte','door.png'], ['bonus-choix','token.png']]) document.choices.find(choice => choice.id === id).image = image;
  document.choices.push({ id: 'image-cachee', label: 'Image cachée', destination: 'clairiere', conditions: [{ type: 'class', classId: 'ami' }], effects: [],
    rewardId: null, rollId: null, image: 'hidden.png', unavailable: { mode: 'hidden', explanation: '' } });
  const first = ['image-cachee', 'bonus-silencieux', 'prendre-cle', 'bonus-choix', 'ouvrir-porte'];
  scene.choices = [...first, ...scene.choices.filter(id => !first.includes(id))];
  return document;
}

export function richDetailsFixture() {
  const document = collectionsFixture();
  document.presentation = { image: null, text: '', sections: [], chapters: [], progress: { target: 1,
    milestones: [{ id: 'fiche-jalon', conditions: [{ type: 'event', eventId: 'porte-ouverte', present: true }] }] } };
  const description = [...Array.from({ length: 20 }, (_, index) => `Ligne${String(index).padStart(2, '0')}é`), 'ABCDéFGHIJKLMNOPQRSTUV', 'TERMINUS'].join('\n');
  document.screens.push(
    { id: 'fiche-enrichie', type: 'detail', title: 'Les archives', text: description, image: 'archive.png', audio: 'description-stereo.mp3', layout: 'split', links: [], colors: { background: '#334455' } },
    { id: 'carnet-image', type: 'detail', title: '', text: 'Une note de carnet.\nFINCARNET', image: 'journal.png', audio: null, layout: 'fullImage', links: [] },
    { id: 'fiche-vide', type: 'detail', title: '', text: '', image: null, audio: null, layout: 'fullImage', links: [] },
  );
  document.screens[0].links.push(
    { id: 'archives-detail', label: 'Consulter les archives', screenId: 'fiche-enrichie' },
    { id: 'carnet-image', label: 'Lire le carnet', screenId: 'carnet-image' },
    { id: 'fiche-vide', label: 'Fiche sans média', screenId: 'fiche-vide' },
  );
  Object.assign(document.items.find(item => item.id === 'cle'), { text: description, audio: 'cle-description-stereo.mp3' });
  document.screens.find(screen => screen.id === 'objet').layout = 'fullImage';
  document.screens.find(screen => screen.id === 'souvenirs').entries.find(entry => entry.id === 'entree-decouverte').screenId = 'fiche-enrichie';
  return document;
}

export function characterSheetFixture() {
  const document = mixedMenusFixture();
  document.theme = { background: '#112233', text: '#ffeecc', selection: '#ff7700' };
  document.screens[0].links.push({ id: 'personnage', label: 'Ton personnage', screenId: 'personnage' });
  document.screens.find(s => s.id === 'archives-a').links.push({ id: 'personnage', label: 'Portrait partagé', screenId: 'personnage' });
  document.screens.push({ id: 'personnage', type: 'character', title: 'Ton personnage', text: 'Voyageur du village.', image: 'portrait.png', links: [], colors: { background: '#334455' }, information: [
    { id: 'info-pisteur', text: 'PISTEUR', conditions: [{ type: 'class', classId: 'pisteur' }] },
    { id: 'info-ami', text: 'AMI', conditions: [{ type: 'class', classId: 'ami' }] },
    { id: 'info-porte', text: 'DECOUV', conditions: [{ type: 'event', eventId: 'porte-ouverte', present: true }] },
    { id: 'info-secret', text: 'SECRET', conditions: [{ type: 'class', classId: 'ami' }, { type: 'event', eventId: 'porte-ouverte', present: true }] },
    { id: 'info-cle', text: 'PORTEUR', conditions: [{ type: 'item', itemId: 'cle', quantity: 1 }] },
    { id: 'info-long', text: Array.from({ length: 24 }, (_, i) => `Texte${String(i).padStart(2,'0')}é`).join('\n') + '\nFINPERSO', conditions: [] },
  ] });
  document.screens.push({ id: 'personnage-vide', type: 'character', title: '', text: '', image: null, links: [], information: [] });
  document.screens[0].links.push({ id: 'vide', label: 'Portrait sans média', screenId: 'personnage-vide' });
  return document;
}
