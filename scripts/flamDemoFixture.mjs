// Démonstration originale des écrans configurables, sans média officiel.
export function flamDemoFixture() {
  const image = id => `./images/${id}.png`;
  const audio = id => `./audio/${id}.wav`;
  const event = (eventId, present = true) => ({ type: 'event', eventId, present });
  const set = eventId => ({ type: 'setEvent', eventId });
  const owns = { type: 'item', itemId: 'cle', quantity: 1 };
  const choice = (id, label, destination, rest = {}) => ({ id, label, destination, conditions: [], effects: [], rewardId: null, rollId: null,
    unavailable: { mode: 'disabled', explanation: 'Cette possibilité attend une découverte.' }, ...rest });
  const link = (id, label, screenId, illustration = id) => ({ id, label, screenId, image: image(illustration) });
  const screen = (id, type, title, text = '', illustration = null, rest = {}) => ({ id, type, title, text, image: illustration ? image(illustration) : null, links: [], ...rest });
  const long = 'La petite lumière de la luciole guide les voyageurs. Chaque soir, elle dessine un nouveau chemin entre les arbres. '
    + 'Dans ton carnet, tu notes les arches, les ponts et les étoiles. Une clé utilisée peut quitter tes affaires ; son souvenir reste avec toi. '
    + 'Consulter cette page ne fait pas avancer le récit. Tu peux revenir à ton menu et reprendre ta scène depuis le début.\nDernier repère : la lanterne bleue.';
  const items = [['cle', 'Clé de cuivre'], ['corde', 'Corde'], ['boussole', 'Boussole'], ['lanterne', 'Lanterne'], ['galet', 'Galet bleu'], ['plume', 'Plume']]
    .map(([id, name]) => ({ id, name, text: id === 'cle' ? 'Cette clé ouvre l’atelier. Elle restera dans la serrure.\n' + long : `${name} accompagne ton voyage.`, image: image(id), audio: id === 'cle' ? audio('cle') : null }));
  const entry = (id, label, screenId, conditions = [], unavailable = 'hidden') => ({ id, label, screenId, image: image('souvenir'), conditions, unavailable });
  return {
    version: 1, id: '4f67c0b8-d1c9-4d51-9a46-9d290de13f11', saveVersion: 1, title: 'L’atelier des lucioles', startSceneId: 'depart', mainMenuId: 'accueil',
    theme: { background: '#132e32', text: '#f3f0df', selection: '#53d9d1' },
    classes: [{ id: 'pisteur', name: 'Pisteur' }, { id: 'ami', name: 'Ami des animaux' }], items,
    events: [{ id: 'cle-decouverte', name: 'Clé découverte' }, { id: 'atelier-ouvert', name: 'Atelier ouvert' }, { id: 'lumiere', name: 'Lumière retrouvée' }],
    rewards: [{ id: 'sac', name: 'Le sac du gardien', repeatable: false, effects: [...items.map(item => ({ type: 'giveItem', itemId: item.id, quantity: 1 })), set('cle-decouverte')] }],
    rolls: [{ id: 'lueurs', name: 'Le dé des lueurs', outcomes: [{ min: 1, max: 10, destination: 'fin-doree' }, { min: 11, max: 20, destination: 'fin-bleue' }] }],
    scenes: [
      { id: 'depart', title: 'Le rendez-vous', text: 'Les lucioles ont perdu la lumière de leur atelier. Choisis ton talent pour les aider : lire les traces ou comprendre les animaux.', image: image('accueil'), audio: audio('depart'), ending: false, choices: ['choisir-pisteur', 'choisir-ami'], illustrationMode: 'selection', colors: { background: '#172b4d' } },
      { id: 'cour', title: 'La cour du gardien', text: 'Un sac attend près de la porte fermée. Prends ses six objets, puis ouvre le menu avec Retour. La commande Ouvrir l’atelier utilisera ta clé.', image: image('cle'), audio: audio('cour'), ending: false, choices: ['prendre-sac'], colors: { background: '#3b283c' } },
      { id: 'atelier', title: 'L’atelier ouvert', text: 'La clé reste dans la serrure. Le souvenir de sa découverte reste dans ton carnet. Le portrait raconte maintenant que tu as ouvert l’atelier.', image: image('atelier'), audio: audio('atelier'), ending: false, choices: ['observer', 'ecouter', 'vider-sac'], colors: { background: '#193f35' } },
      { id: 'observatoire', title: 'Le dé des lueurs', text: 'Les lucioles te confient leur dé. Son résultat indique une couleur, sans mesurer ta force ni ton talent.', image: image('souvenir'), audio: audio('observatoire'), ending: false, choices: ['lancer'], colors: { background: '#26335b' } },
      { id: 'fin-doree', title: 'La lumière dorée', text: 'La lumière dorée rejoint les lucioles. Leur atelier peut enfin rouvrir. Tu peux encore consulter tes affaires, ton carnet et tes souvenirs.', image: image('lanterne'), audio: audio('fin-doree'), ending: true, choices: [], colors: { background: '#493a22' } },
      { id: 'fin-bleue', title: 'La lumière bleue', text: 'La lumière bleue rejoint les lucioles. Leur atelier peut enfin rouvrir. Tu peux encore consulter tes affaires, ton carnet et tes souvenirs.', image: image('galet'), audio: audio('fin-bleue'), ending: true, choices: [], colors: { background: '#233b58' } },
    ],
    choices: [
      choice('choisir-pisteur', 'Devenir Pisteur', 'cour', { effects: [{ type: 'chooseClass', classId: 'pisteur' }], image: image('portrait') }),
      choice('choisir-ami', 'Devenir Ami des animaux', 'cour', { effects: [{ type: 'chooseClass', classId: 'ami' }], image: image('plume') }),
      choice('prendre-sac', 'Prendre les six objets', 'cour', { rewardId: 'sac', replayAudioOnReturn: false, unavailable: { mode: 'disabled', explanation: 'Le sac est déjà vide. Ouvre le menu pour poursuivre.' } }),
      choice('ouvrir', 'Ouvrir l’atelier', 'atelier', { conditions: [owns, event('atelier-ouvert', false)], effects: [{ type: 'consumeItem', itemId: 'cle', quantity: 1 }, set('atelier-ouvert')] }),
      choice('observer', 'Lire les traces', 'observatoire', { conditions: [{ type: 'class', classId: 'pisteur' }] }),
      choice('ecouter', 'Écouter les lucioles', 'observatoire', { conditions: [{ type: 'class', classId: 'ami' }], unavailable: { mode: 'hidden', explanation: '' } }),
      choice('vider-sac', 'Déposer les cinq objets', 'atelier', { conditions: [{ type: 'item', itemId: 'corde', quantity: 1 }], effects: items.filter(item => item.id !== 'cle').map(item => ({ type: 'consumeItem', itemId: item.id, quantity: 1 })), replayAudioOnReturn: false }),
      choice('lancer', 'Lancer le dé des lueurs', null, { rollId: 'lueurs', effects: [set('lumiere')] }),
    ],
    screens: [
      screen('accueil', 'menu', 'L’atelier des lucioles', 'Tes chemins et tes découvertes.', 'accueil', { illustrationMode: 'selection', links: [
        link('affaires', 'Tes affaires', 'affaires', 'corde'), link('archives', 'Les archives', 'archives', 'carnet'),
        link('souvenirs', 'Tes souvenirs', 'souvenirs', 'souvenir'), link('personnage', 'Ton personnage', 'personnage', 'portrait'),
        link('carnet', 'Lire le carnet', 'carnet'), link('partage', 'Le message partagé', 'message', 'message'),
        { id: 'ouvrir', type: 'narrative', choiceId: 'ouvrir', image: image('cle') },
      ] }),
      screen('archives', 'menu', 'Les archives', 'Les notes du gardien.', 'carnet', { links: [link('commun', 'Message des archives', 'message', 'message'), link('plan', 'Le plan du carnet', 'carnet', 'carnet')] }),
      screen('affaires', 'grid', 'Tes affaires', '', null, { source: 'inventory', detailScreenId: 'objet' }),
      screen('objet', 'detail', 'Fiche des objets', '', null, { contentSource: 'item', layout: 'split' }),
      screen('message', 'detail', 'Le message du gardien', long, 'message', { layout: 'split', audio: audio('message'), colors: { background: '#392e46', selection: '#ffcc77' } }),
      screen('carnet', 'detail', '', 'Le chemin rejoint l’atelier. Les lucioles passent sous le pont.\nDernière ligne du carnet.', 'carnet', { layout: 'fullImage' }),
      screen('personnage', 'character', 'Ton personnage', 'Un voyageur des petites lumières.', 'portrait', { information: [
        { id: 'talent-pisteur', text: 'Talent : Pisteur. Tu reconnais les traces.', conditions: [{ type: 'class', classId: 'pisteur' }] },
        { id: 'talent-ami', text: 'Talent : Ami des animaux. Tu comprends les lucioles.', conditions: [{ type: 'class', classId: 'ami' }] },
        { id: 'fait-atelier', text: 'Découverte : tu as ouvert l’atelier.', conditions: [event('atelier-ouvert')] },
        { id: 'texte-personnage', text: long, conditions: [] },
      ] }),
      screen('souvenirs', 'grid', 'Tes souvenirs', '', null, { source: 'collection', entries: [
        entry('souvenir-message', 'Message du gardien', 'message'), entry('souvenir-carnet', 'Plan du chemin', 'carnet'),
        entry('souvenir-note-a', 'Le pont', 'message'), entry('souvenir-note-b', 'Les étoiles', 'message'), entry('souvenir-note-c', 'La lanterne', 'message'),
        entry('souvenir-cle', 'La clé découverte', 'message', [event('cle-decouverte')]),
        entry('souvenir-atelier', 'L’atelier secret', 'message', [event('atelier-ouvert')], 'disabled'),
        entry('souvenir-lumiere', 'La lumière retrouvée', 'message', [event('lumiere')]),
      ] }),
    ],
  };
}
