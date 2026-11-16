import { fixture } from './flamRuntimeFixture.mjs';

export function presentationFixture() {
  const document = fixture(true);
  document.title = 'Les archives des lucioles';
  document.scenes[0].image = 'village.jpg';
  document.presentation = {
    image: 'accueil.jpg', text: 'Une aventure à explorer',
    sections: [
      { id: 'chapitres', kind: 'chapters', title: 'Chapitres écoutés', image: 'livre.jpg', enabled: true, entries: [] },
      { id: 'personnage', kind: 'character', title: 'Ta fiche personnage', image: null, enabled: true, entries: [] },
      { id: 'affaires', kind: 'inventory', title: 'Tes affaires', image: null, enabled: true, entries: [] },
      { id: 'carnet', kind: 'collection', title: 'Ton carnet de reporter', image: null, enabled: true, entries: [
        { id: 'note-porte', title: 'La porte ouverte', text: 'Le chemin est libre.', image: 'note.jpg', audio: null,
          conditions: [{ type: 'event', eventId: 'porte-ouverte', present: true }], unavailable: 'hidden' },
      ] },
      { id: 'souvenirs', kind: 'collection', title: 'Tes souvenirs', image: null, enabled: true, entries: [] },
    ],
    chapters: document.scenes.map((scene, index) => ({ id: `chapitre-${index}`, title: scene.title, image: null,
      passages: [{ sceneId: scene.id, replayable: true, conditions: [] }] })),
    progress: { target: 2, milestones: [
      { id: 'jalon-classe', conditions: [{ type: 'class', classId: 'pisteur' }] },
      { id: 'jalon-autre-classe', conditions: [{ type: 'class', classId: 'ami' }] },
      { id: 'jalon-porte', conditions: [{ type: 'event', eventId: 'porte-ouverte', present: true }] },
    ] },
  };
  return document;
}
