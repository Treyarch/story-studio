import test from 'node:test';
import assert from 'node:assert/strict';
import { runner } from './reactHookDriver.mjs';
const { useFlamPreviewDrag } = await import('../src/components/FlamWorkspace/useFlamPreviewDrag.js');

test('déplacer l’aperçu, changer de scène et redimensionner le graphe', () => {
  const previousObserver = globalThis.ResizeObserver;
  let resize;
  globalThis.ResizeObserver = class {
    constructor(callback) { resize = callback; }
    observe() {}
    disconnect() {}
  };
  const host = { clientWidth: 1000, clientHeight: 700, clientLeft: 0, clientTop: 0, getBoundingClientRect: () => ({ left: 100, top: 50 }) };
  const panel = { offsetWidth: 320, offsetHeight: 300, getBoundingClientRect: () => ({ left: 750, top: 400 }) };
  let selection = 'scenes:a';
  const hostRef = { current: host };
  const ui = runner(() => useFlamPreviewDrag(hostRef, selection));
  const captured = new Set();
  const target = { focus() {}, setPointerCapture: id => captured.add(id), hasPointerCapture: id => captured.has(id), releasePointerCapture: id => captured.delete(id) };
  const event = extra => ({ pointerId: 1, isPrimary: true, button: 0, clientX: 800, clientY: 420, currentTarget: target, preventDefault() {}, stopPropagation() {}, ...extra });
  try {
    let preview = ui.render();
    preview.panelRef.current = panel;
    ui.flush();
    preview = ui.render();
    assert.equal(preview.panelStyle.left, 650);
    preview.dragHandleProps.onPointerDown(event({ button: 2 }));
    assert.equal(captured.size, 0);
    preview.dragHandleProps.onPointerDown(event());
    assert.ok(captured.has(1));
    preview.dragHandleProps.onPointerMove(event({ clientX: 250, clientY: 120 }));
    preview = ui.render();
    assert.deepEqual([preview.panelStyle.left, preview.panelStyle.top], [100, 50]);
    preview.dragHandleProps.onPointerUp(event());
    assert.equal(captured.size, 0);
    preview.dragHandleProps.onPointerMove(event({ clientX: 900 }));
    assert.equal(ui.render().panelStyle.left, 100);

    selection = 'scenes:b';
    preview = ui.render();
    preview.panelRef.current = { ...panel, offsetHeight: 350 };
    ui.flush();
    preview = ui.render();
    assert.deepEqual([preview.panelStyle.left, preview.panelStyle.top], [100, 50]);
    preview.dragHandleProps.onKeyDown(event({ key: 'ArrowRight', shiftKey: true }));
    assert.equal(ui.render().panelStyle.left, 140);
    preview.dragHandleProps.onPointerDown(event());
    preview.dragHandleProps.onPointerMove(event({ clientX: 3000, clientY: 3000 }));
    preview.dragHandleProps.onPointerCancel(event());
    preview = ui.render();
    assert.deepEqual([preview.panelStyle.left, preview.panelStyle.top], [680, 350]);
    host.clientWidth = 500;
    host.clientHeight = 400;
    resize();
    preview = ui.render();
    assert.deepEqual([preview.panelStyle.left, preview.panelStyle.top], [180, 50]);
  } finally {
    ui.unmount();
    globalThis.ResizeObserver = previousObserver;
  }
});
