import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { runner } from './reactHookDriver.mjs';
import { KEYS } from '../src/store/persistentSettings.js';
register('./nodeSourceResolver.mjs', import.meta.url);
const { useAdvancedWorkspaceViewState } = await import('../src/workspace/useAdvancedWorkspaceViewState.js');

test('FLAM utilise les mêmes panneaux avec des préférences séparées et persistantes', () => {
  const previous = globalThis.localStorage;
  const entries = new Map();
  globalThis.localStorage = { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, String(value)) };
  const original = runner(() => useAdvancedWorkspaceViewState());
  let flam = runner(() => useAdvancedWorkspaceViewState({ scope: 'flam' }));
  try {
    const originalState = original.render(); original.flush();
    let state = flam.render(); flam.flush();
    assert.equal(state.nodeListPanelWidth, originalState.nodeListPanelWidth);
    state.toggleNodeList(); state.setInspectorPanelWidth(480); state.movePanel('advanced-inspector', 'advanced-node-list');
    state = flam.render(); flam.flush();
    assert.equal(state.showNodeList, false);
    assert.equal(original.render().showNodeList, true);
    assert.equal(entries.get(KEYS.ADVANCED_SHOW_NODE_LIST), 'true');
    assert.equal(entries.get(KEYS.FLAM_SHOW_NODE_LIST), 'false');
    flam.unmount();
    flam = runner(() => useAdvancedWorkspaceViewState({ scope: 'flam' }));
    const reopened = flam.render(); flam.flush();
    assert.equal(reopened.showNodeList, false);
    assert.equal(reopened.inspectorPanelWidth, 480);
    assert.equal(reopened.panelOrder[0], 'advanced-inspector');
  } finally { original.unmount(); flam.unmount(); globalThis.localStorage = previous; }
});
