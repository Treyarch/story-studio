import { readFileSync } from 'node:fs';
const example = JSON.parse(readFileSync(new URL('../src/store/flamAdventure/example.json', import.meta.url), 'utf8'));

export function fixture(audio) {
  const document = structuredClone(example);
  // Des identifiants et noms additionnels vérifient l'absence de champs métier
  // fixes. Le texte inclut les caractères que JSON et Lua échappent différemment.
  document.title = 'Aventure "libre" \\ café\nDeuxième ligne\u0000fin';
  document.items.push({ id: 'jeton:"é\\', name: 'Jeton' });
  document.rewards.push({ id: 'bonus', name: 'Bonus', repeatable: true,
    effects: [{ type: 'giveItem', itemId: 'jeton:"é\\', quantity: 1 }] });
  document.rolls.push({ id: 'autre', name: 'Autre dé', outcomes: [{ min: 1, max: 20, destination: 'fin-renard' }] });
  const add = (sceneId, id, label, overrides = {}) => {
    document.scenes.find(scene => scene.id === sceneId).choices.push(id);
    document.choices.push({ id, label, destination: sceneId, conditions: [], effects: [],
      rewardId: null, rollId: null, unavailable: { mode: 'disabled', explanation: 'Action impossible' }, ...overrides });
  };
  add('clairiere', 'bonus-choix', 'Recevoir un jeton', { rewardId: 'bonus' });
  add('clairiere', 'meme-coffre', 'Reprendre autrement la clé', { rewardId: 'coffre' });
  add('clairiere', 'atomique', 'Tout ou rien', { effects: [
    { type: 'giveItem', itemId: 'jeton:"é\\', quantity: 1 },
    { type: 'consumeItem', itemId: 'cle', quantity: 2 },
    { type: 'setEvent', eventId: 'porte-ouverte' },
  ] });
  add('clairiere', 'classe-fixe', 'Changer de classe', { effects: [{ type: 'chooseClass', classId: 'ami' }] });
  add('rencontre-scene', 'autre-jet', 'Autre dé', { destination: null, rollId: 'autre' });
  for (const scene of document.scenes.filter(scene => scene.ending)) {
    scene.ending = false;
    add(scene.id, `retour-${scene.id}`, 'Revoir la rencontre', { destination: 'rencontre-scene' });
    add(scene.id, `terminer-${scene.id}`, 'Terminer', { destination: 'fin' });
  }
  document.scenes.push({ id: 'fin', title: 'Fin explicite', text: 'Terminé.', ending: true,
    choices: [], audio: null, image: null });
  if (audio) for (const scene of document.scenes) scene.audio = `${scene.id}-stereo.mp3`;
  return document;
}
