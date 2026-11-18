import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { installMountedDom, click } from './treeMountedDom.mjs';
import { useFlamInspector } from '../src/components/FlamWorkspace/useFlamInspector.js';

const propsOf = node => node[Object.keys(node).find(key => key.startsWith('__reactProps$'))];

test('onglets montés : clavier, défilements indépendants, fermeture et nouveau projet', async () => {
  const dom = installMountedDom();
  const host = dom.document.createElement('div');
  dom.document.body.appendChild(host);
  const root = createRoot(host);
  let inspector;
  function Panel({ open }) {
    const ref = useRef(null);
    inspector = useFlamInspector(open, ref);
    return React.createElement('div', { ref }, open && React.createElement(React.Fragment, null,
      React.createElement('div', { role: 'tablist' }, ['adventure', 'selection'].map(tab =>
        React.createElement('button', { key: tab, ...inspector.tabProps(tab) }, tab))),
      ...['adventure', 'selection'].map(tab => React.createElement('aside', { key: tab, ...inspector.panelProps(tab) },
        React.createElement('input', { defaultValue: tab })))));
  }
  const render = async (open = true, epoch = 1) => act(async () => root.render(React.createElement(Panel, { key: epoch, open })));
  const tabs = () => host.querySelectorAll('button');
  const panels = () => host.querySelectorAll('aside');
  const scroll = async (panel, top) => {
    panel.scrollTop = top;
    await act(async () => propsOf(panel).onScroll({ currentTarget: panel }));
  };
  try {
    await render();
    assert.equal(tabs()[0].getAttribute('aria-selected'), 'true');
    assert.equal(panels()[1].hasAttribute('hidden'), true);
    assert.equal(tabs()[1].getAttribute('tabindex'), '-1');
    assert.equal(tabs()[0].getAttribute('aria-controls'), panels()[0].getAttribute('id'));
    await scroll(panels()[0], 180);
    const input = panels()[1].querySelector('input');
    input.value = 'saisie conservée';
    await act(async () => click(tabs()[1]));
    assert.equal(panels()[0].hasAttribute('hidden'), true);
    await scroll(panels()[1], 420);
    await act(async () => click(tabs()[0]));
    assert.equal(panels()[0].scrollTop, 180);
    // Un navigateur peut remettre à zéro le panneau masqué et émettre scroll.
    await scroll(panels()[1], 0);
    await act(async () => click(tabs()[1]));
    assert.equal(panels()[1].scrollTop, 420);
    assert.equal(panels()[1].querySelector('input'), input);
    assert.equal(input.value, 'saisie conservée');
    await render(false);
    assert.equal(panels().length, 0);
    await render();
    assert.equal(tabs()[1].getAttribute('aria-selected'), 'true');
    assert.equal(panels()[1].scrollTop, 420);
    const key = async (index, value) => act(async () => {
      const node = tabs()[index];
      node.parentElement = node.parentNode;
      propsOf(node).onKeyDown({ key: value, currentTarget: node, preventDefault() {}, stopPropagation() {} });
    });
    await key(1, 'ArrowRight');
    assert.equal(dom.document.activeElement, tabs()[0]);
    assert.equal(tabs()[0].getAttribute('aria-selected'), 'true');
    await key(0, 'End');
    assert.equal(dom.document.activeElement, tabs()[1]);
    await key(1, 'Home');
    assert.equal(dom.document.activeElement, tabs()[0]);
    await key(0, 'ArrowLeft');
    assert.equal(dom.document.activeElement, tabs()[1]);
    await render(true, 2);
    assert.equal(tabs()[0].getAttribute('aria-selected'), 'true');
    assert.equal(panels()[0].scrollTop, 0);
  } finally { await act(async () => root.unmount()); dom.restore(); }
});

test('correction montée : panneau fermé, groupes repliés, focus et priorité sur le défilement', async () => {
  const dom = installMountedDom();
  const host = dom.document.createElement('div');
  dom.document.body.appendChild(host);
  const root = createRoot(host);
  let inspector;
  function attachTarget(panel, index) {
    if (!panel) return;
    const group = panel.querySelector('details');
    const target = group.querySelector('div');
    const input = target.querySelector('input');
    // Fournir les primitives absentes du DOM minimal, sans recopier la
    // logique produit de recherche du champ ou d’ouverture des groupes.
    target.dataset = { flamPath: index === 0 ? '/theme/background' : '/scenes/0' };
    target.parentElement = group;
    group.parentElement = panel;
    const query = panel.querySelectorAll.bind(panel);
    panel.querySelectorAll = selector => selector === '[data-flam-path]' ? [target] : query(selector);
    const find = target.querySelector.bind(target);
    target.querySelector = selector => selector === 'input, select, textarea, button' ? input : find(selector);
    target.scrollIntoView = () => { panel.scrollTop = 640; };
  }
  function Panel({ open }) {
    const ref = useRef(null);
    inspector = useFlamInspector(open, ref);
    return React.createElement('div', { ref }, open && ['adventure', 'selection'].map((tab, index) => {
      const panelProps = inspector.panelProps(tab);
      return React.createElement('aside', { ...panelProps, key: tab, ref: node => {
        panelProps.ref.current = node;
        attachTarget(node, index);
      } }, React.createElement('details', null, React.createElement('summary', null, tab),
        React.createElement('div', { tabIndex: -1 }, React.createElement('input'))));
    }));
  }
  const render = async open => act(async () => root.render(React.createElement(Panel, { open })));
  try {
    await render(true);
    await act(async () => inspector.reveal('selection', '/scenes/0/title'));
    let panel = host.querySelectorAll('aside')[1];
    assert.equal(panel.hasAttribute('hidden'), false);
    assert.equal(panel.querySelector('details').open, true);
    assert.equal(dom.document.activeElement, panel.querySelector('input'));
    assert.equal(panel.scrollTop, 640);
    await act(async () => inspector.tabProps('adventure').onClick());
    await act(async () => inspector.tabProps('selection').onClick());
    assert.equal(panel.scrollTop, 640, 'la correction devient la position retrouvée');
    await render(false);
    await act(async () => inspector.reveal('adventure', '/theme/background'));
    await render(true);
    panel = host.querySelectorAll('aside')[0];
    assert.equal(panel.hasAttribute('hidden'), false);
    assert.equal(panel.querySelector('details').open, true);
    assert.equal(dom.document.activeElement, panel.querySelector('input'));
    assert.equal(panel.scrollTop, 640);
  } finally { await act(async () => root.unmount()); dom.restore(); }
});
