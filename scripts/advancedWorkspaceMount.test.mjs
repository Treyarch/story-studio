import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { createTestI18n } from './i18nTestSetup.mjs';
import { registerHooks } from 'node:module';
import { existsSync, statSync } from 'node:fs';
const { mountSurface } = await import('./chromeBench.mjs');
const mountEditor = element => mountSurface(React.createElement(I18nextProvider, { i18n: createTestI18n() }, element));
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && context.parentURL) {
    const url = new URL(specifier, context.parentURL);
    if (!existsSync(url) || statSync(url).isDirectory()) {
      for (const suffix of ['.js', '.jsx', '/index.js', '/index.jsx']) {
        const candidate = new URL(`${specifier}${suffix}`, context.parentURL);
        if (existsSync(candidate) && statSync(candidate).isFile()) return next(candidate.href, context);
      }
    }
  }
  return next(specifier, context);
} });
const { AdvancedWorkspace } = await import('../src/components/AdvancedWorkspace/AdvancedWorkspace.jsx');
const { ProjectActionsContext } = await import('../src/store/ProjectActionsContext.js');
const { createAdvancedProject } = await import('../src/store/projectModel/authoring.js');

test('l’éditeur graphe d’origine monte ses trois panneaux avant la lecture native du document', () => {
  const project = createAdvancedProject({ payload: '{}' });
  const rendered = mountEditor(React.createElement(ProjectActionsContext.Provider, { value: {} },
    React.createElement(AdvancedWorkspace, { project, payload: '{}', projectEpoch: 1,
      authoring: { busy: false, locked: false, lastReport: null, refusal: null },
    })));
  assert.match(rendered.html, /advanced-panel--nodes/);
  assert.match(rendered.html, /advanced-panel--graph/);
  assert.match(rendered.html, /advanced-panel--inspector/);
});

const { default: GraphSearchPanel } = await import('../src/components/AdvancedGraphCanvas/GraphSearchPanel.jsx');
const { buildGraphIndex } = await import('../src/store/advancedGraphView/graphViewModel.js');
const { searchGraph } = await import('../src/store/advancedGraphView/graphSearch.js');
const { sampleView } = await import('./advancedViewFixtures.mjs');

test('la liste de l’éditeur d’origine affiche les nœuds après lecture du document, même sans vignette', () => {
  const index = buildGraphIndex(sampleView());
  const rendered = mountEditor(React.createElement(GraphSearchPanel, {
    search: options => searchGraph(index, options), focus: index.entries[0].path,
    onFocusPath() {}, counts: index.view.counts,
  }));
  assert.match(rendered.html, /Entrée/);
  assert.match(rendered.html, /Cible/);
  assert.ok(rendered.elements.some(element => element.props?.className === 'advanced-search__icon'));
});
