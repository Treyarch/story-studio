import { flamDemoFixture } from './flamDemoFixture.mjs';
import { arrangedGraphFixture } from './flamArrangedGraphFixture.mjs';
import { diagnoseAdventureDocument } from '../src/store/flamAdventure/diagnostics.js';
import { assertAdventureDocument } from '../src/store/flamAdventure/document.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, copyFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { compileAdventureData } from '../src/flamRuntime/compile.js';
import { screensFixture, mixedMenusFixture, themedScreensFixture, inventoryGridFixture, collectionsFixture, selectionIllustrationsFixture, richDetailsFixture, characterSheetFixture } from './flamScreensFixture.mjs';
import { presentationFixture } from './flamPresentationFixture.mjs';

test('le pack illustré propose son menu sans perdre la partie pendant la consultation', async () => {
  const folder = await mkdtemp(path.join(tmpdir(), 'flam-presentation-'));
  try {
    const source = new URL('../src/flamRuntime/lua/', import.meta.url);
    for (const name of await readdir(source)) await copyFile(new URL(name, source), path.join(folder, name));
    await writeFile(path.join(folder, 'adventure_data.lua'), compileAdventureData(presentationFixture()));
    const result = spawnSync('lua', ['scripts/check-flam-presentation.lua', folder], { encoding: 'utf8' });
    assert.equal(result.status, 0, `${result.error || ''}\n${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /OK : menu illustré/);
  } finally { await rm(folder, { recursive: true, force: true }); }
});

test('un objectif exigeant les jalons de deux classes exclusives est refusé avant génération', () => {
  const document = presentationFixture();
  document.presentation.progress.target = 3;
  assert.throws(() => compileAdventureData(document), error => error.diagnostics.some(diagnostic => diagnostic.code === 'INVALID_PROGRESS'));
});

async function checkScreens(factory, expected) {
  const folder = await mkdtemp(path.join(tmpdir(), 'flam-screens-'));
  try {
    const source = new URL('../src/flamRuntime/lua/', import.meta.url);
    for (const name of await readdir(source)) await copyFile(new URL(name, source), path.join(folder, name));
    await writeFile(path.join(folder, 'adventure_data.lua'), compileAdventureData(factory()));
    const result = spawnSync('lua', ['scripts/check-flam-presentation.lua', folder], { encoding: 'utf8' });
    assert.equal(result.status, 0, `${result.error || ''}\n${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, expected);
  } finally { await rm(folder, { recursive: true, force: true }); }
}

test('menu et fiches du graphe conservent scène, récompenses, objets et jets dans le vrai lecteur', () => checkScreens(screensFixture, /OK : écrans du graphe/));
test('les sous-menus partagent une fiche et exécutent les commandes narratives atomiquement', () => checkScreens(mixedMenusFixture, /OK : sous-menus/));

test('les accès incomplets ou narratifs dans une consultation bloquent la génération', () => {
  const document = screensFixture();
  document.screens[0].links[0].screenId = 'absente';
  assert.throws(() => compileAdventureData(document), error => error.diagnostics.some(d => d.path === '/screens/0/links/0/screenId'));
  document.screens[0].links[0].screenId = 'depart';
  assert.throws(() => compileAdventureData(document), error => error.diagnostics.some(d => d.code === 'INVALID_CONSULTATION_LINK'));
  document.screens[0].links[0].screenId = 'carte';
  document.mainMenuId = 'carte';
  assert.throws(() => compileAdventureData(document), error => error.diagnostics.some(d => d.path === '/mainMenuId'));
  document.mainMenuId = 'accueil';
  document.screens[0].links[0].effects = [];
  assert.throws(() => compileAdventureData(document), error => error.code === 'UNKNOWN_ADVENTURE_FIELD');
});

test('une commande de menu doit référencer un choix valide et ne peut mélanger les deux contrats', () => {
  const document = mixedMenusFixture();
  const link = document.screens.find(screen => screen.id === 'archives-a').links.find(link => link.type === 'narrative');
  link.choiceId = 'absent';
  assert.throws(() => compileAdventureData(document), error => error.diagnostics.some(d => d.path.endsWith('/choiceId')));
  link.choiceId = 'deux-cles'; link.screenId = 'carte';
  assert.throws(() => compileAdventureData(document), error => error.code === 'UNKNOWN_ADVENTURE_FIELD');
});

test('le lecteur applique les couleurs héritées et remplacées sur menus, fiches et scènes', () => checkScreens(themedScreensFixture, /OK : thème/));

test('les couleurs invalides restent diagnostiquées avant génération pour le thème et les écrans', () => {
  for (const value of ['', '#fff', 'red', '#11223344', '#gg0000', ' #112233']) {
    for (const scope of ['theme', 'scenes', 'screens']) {
      const document = themedScreensFixture();
      if (scope === 'theme') document.theme.text = value;
      else document[scope][0].colors = { text: value };
      const path = scope === 'theme' ? '/theme/text' : `/${scope}/0/colors/text`;
      assert.throws(() => compileAdventureData(document), error => error.diagnostics.some(d => d.code === 'INVALID_COLOR' && d.path === path));
    }
  }
  const document = themedScreensFixture(); document.theme.selection = '#AbCdEf';
  assert.doesNotThrow(() => compileAdventureData(document));
});

test('le vrai lecteur pagine l’inventaire par quatre et réutilise les données de la fiche type', () => checkScreens(inventoryGridFixture, /OK : grille 2 × 2/));

test('la génération refuse une grille sans fiche type valide ou une fiche d’objet ouverte sans contexte', () => {
  const document = inventoryGridFixture();
  const grid = document.screens.find(screen => screen.type === 'grid');
  grid.detailScreenId = null;
  assert.throws(() => compileAdventureData(document), error => error.diagnostics.some(d => d.code === 'INVALID_GRID_DETAIL'));
  grid.detailScreenId = 'carte';
  assert.throws(() => compileAdventureData(document), error => error.diagnostics.some(d => d.code === 'INVALID_GRID_DETAIL'));
  grid.detailScreenId = 'objet';
  document.screens[0].links.push({ id: 'sans-objet', label: 'Fiche sans contexte', screenId: 'objet' });
  assert.throws(() => compileAdventureData(document), error => error.diagnostics.some(d => d.code === 'INVALID_CONSULTATION_LINK'));
});

test('le lecteur filtre les collections et garde les souvenirs après consommation', () => checkScreens(collectionsFixture, /OK : collections/));

test('les collections refusent références, quantités et effets invalides avant génération', () => {
  const document = collectionsFixture();
  const entry = document.screens.find(screen => screen.id === 'souvenirs').entries[0];
  entry.screenId = 'objet';
  assert.throws(() => compileAdventureData(document), error => error.diagnostics.some(d => d.code === 'INVALID_COLLECTION_DETAIL'));
  entry.screenId = 'carte'; entry.conditions = [{ type: 'item', itemId: 'absent', quantity: 1 }];
  assert.throws(() => compileAdventureData(document), error => error.diagnostics.some(d => d.code === 'MISSING_REFERENCE' && d.path.includes('/entries/0/conditions')));
  entry.conditions = [{ type: 'item', itemId: 'cle', quantity: 0 }];
  assert.throws(() => compileAdventureData(document), error => error.diagnostics.some(d => d.code === 'INVALID_QUANTITY'));
  entry.conditions = []; entry.effects = [];
  assert.throws(() => compileAdventureData(document), error => error.code === 'UNKNOWN_ADVENTURE_FIELD' && error.path.endsWith('/entries/0/effects'));
});

test('le lecteur conserve l’image commune ou suit le bon choix sans déclencher d’action', () => checkScreens(selectionIllustrationsFixture, /OK : illustrations communes/));

test('les modes d’illustration et images de choix sont validés avant génération', () => {
  const document = selectionIllustrationsFixture();
  document.scenes[0].illustrationMode = 'inconnu';
  assert.throws(() => compileAdventureData(document), error => error.code === 'INVALID_ADVENTURE_DOCUMENT' && error.path === '/scenes/0/illustrationMode');
  document.scenes[0].illustrationMode = 'selection';
  const detail = document.screens.find(screen => screen.id === 'carte'); detail.illustrationMode = 'selection';
  assert.throws(() => compileAdventureData(document), error => error.diagnostics.some(d => d.code === 'INVALID_ILLUSTRATION_MODE'));
  delete detail.illustrationMode; document.choices[0].image = 42;
  assert.throws(() => compileAdventureData(document), error => error.code === 'INVALID_ADVENTURE_DOCUMENT' && error.path === '/choices/0/image');
});

test('le lecteur rend les fiches enrichies et protège le cycle audio sans changer la partie', () => checkScreens(richDetailsFixture, /OK : fiches split/));

test('les compositions et audios de fiche sont validés avant génération', () => {
  const document = richDetailsFixture();
  const detail = document.screens.find(screen => screen.id === 'fiche-enrichie');
  detail.layout = 'autre';
  assert.throws(() => compileAdventureData(document), error => error.code === 'INVALID_ADVENTURE_DOCUMENT' && error.path.endsWith('/layout'));
  detail.layout = 'split'; document.screens[0].audio = null;
  assert.throws(() => compileAdventureData(document), error => error.diagnostics.some(d => d.code === 'INVALID_DETAIL_LAYOUT'));
  delete document.screens[0].audio; detail.audio = 42;
  assert.throws(() => compileAdventureData(document), error => error.code === 'INVALID_ADVENTURE_DOCUMENT' && error.path.endsWith('/audio'));
});


test('la fiche personnage filtre ses informations et conserve le récit dans le vrai lecteur', () => checkScreens(characterSheetFixture, /OK : fiche personnage/));

test('les informations de personnage protègent leurs références et refusent les mécaniques étrangères', () => {
  const document = characterSheetFixture();
  document.screens.at(-2).information[0].conditions[0].classId = 'absente';
  assert.ok(diagnoseAdventureDocument(document).some(d => d.path.endsWith('/information/0/conditions/0/classId')));
  document.screens.at(-2).information[0].conditions[0].classId = 'pisteur';
  document.screens[0].information = [];
  assert.ok(diagnoseAdventureDocument(document).some(d => d.code === 'INVALID_CHARACTER'));
  delete document.screens[0].information;
  document.screens.at(-2).information[1].id = document.screens.at(-2).information[0].id;
  assert.throws(() => assertAdventureDocument(document), /DUPLICATE_ADVENTURE_ID/);
  document.screens.at(-2).information[1].id = 'info-ami';
  const info = document.screens.at(-2).information[0];
  info.conditions = [{ type: 'item', itemId: 'cle', quantity: 0 }];
  assert.throws(() => compileAdventureData(document), error => error.diagnostics.some(d => d.path.endsWith('/information/0/conditions/0/quantity')));
  info.conditions = [];
  info.effects = [];
  assert.throws(() => assertAdventureDocument(document), /UNKNOWN_ADVENTURE_FIELD/);
  delete info.effects;
  document.screens.at(-2).statistics = { strength: 10 };
  assert.throws(() => assertAdventureDocument(document), /UNKNOWN_ADVENTURE_FIELD/);
});

test('un projet filtré et rangé joue la même aventure avec le vrai lecteur', () => checkScreens(arrangedGraphFixture, /OK : fiche personnage/));

test('la démonstration complète combine tous les écrans dans le vrai lecteur', () => checkScreens(flamDemoFixture, /OK : démonstration complète/));

test('l’aperçu de la démonstration couvre tous les gabarits, leurs couleurs et les images sélectionnées', async () => {
  const { screenPreview } = await import('../src/store/flamAdventure/theme.js');
  const document = flamDemoFixture();
  const before = structuredClone(document);
  const labels = { back: 'Retour', resume: 'Reprendre', empty: 'Vide', emptyCollection: 'Vide', listen: 'Écouter' };
  for (const collection of ['scenes','screens']) for (const screen of document[collection]) {
    const view = screenPreview(document, collection, screen.id, labels);
    assert.ok(view);
    assert.equal(view.colors.background, screen.colors?.background ?? document.theme.background);
    if (screen.type === 'detail' || screen.type === 'character') assert.equal(view.layout,'detail');
    if (screen.type === 'grid') assert.equal(view.layout,'grid');
  }
  assert.equal(screenPreview(document,'scenes','depart',labels,0).image,document.choices[0].image);
  assert.equal(screenPreview(document,'scenes','depart',labels,1).image,document.choices[1].image);
  assert.equal(screenPreview(document,'screens','accueil',labels,1).image,document.screens[0].links[0].image);
  assert.equal(screenPreview(document,'screens','objet',labels,0).audio,document.items[0].audio);
  assert.equal(screenPreview(document,'screens','carnet',labels).detailLayout,'fullImage');
  assert.equal(screenPreview(document,'screens','carnet',labels).title,'');
  const character = screenPreview(document,'screens','personnage',labels);
  assert.ok(character.character && character.text.includes('Talent : Pisteur') && character.text.includes('Talent : Ami des animaux'));
  assert.deepEqual(document,before);
});
