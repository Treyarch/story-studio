import { useEffect, useMemo, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { useCommonTranslation } from '../../i18n/commonPresentation.js';
import { useThemeEpoch } from '../AdvancedGraphCanvas/useThemeEpoch.js';
import { readEngineColors } from '../AdvancedGraphCanvas/engines/engineColors.js';
import { Button } from '../common/Button.jsx';
import { flamGraphElements } from './flamGraph.js';
import { syncFlamGraph, captureFlamGraphLayout, restoreFlamGraphLayout, bindFlamGraphLayout } from './flamGraphSync.js';

function styles(container) {
  const c = readEngineColors(container, {
    background: ['--bg1', '#242833'], text: ['--text', '#e6e8ed'],
    border: ['--border', '#687080'], accent: ['--accent', '#78a9ff'],
    muted: ['--muted', '#9aa3b2'],
  });
  return [
    { selector: 'node', style: {
      shape: 'round-rectangle', width: 190, height: 84,
      'background-color': c.background, 'border-color': c.border, 'border-width': 2,
      label: 'data(label)', color: c.text, 'font-size': 13,
      'text-wrap': 'wrap', 'text-max-width': 165, 'text-valign': 'center',
    } },
    { selector: 'node[collection = "rolls"]', style: { shape: 'diamond', width: 170, height: 110 } },
    { selector: 'node[?start]', style: { 'border-color': c.accent, 'border-width': 4 } },
    { selector: 'node[?ending]', style: { 'border-style': 'double', 'border-width': 6 } },
    { selector: 'edge', style: {
      width: 2, 'line-color': c.muted, 'target-arrow-color': c.muted,
      'target-arrow-shape': 'triangle', 'curve-style': 'bezier', label: 'data(label)',
      color: c.text, 'font-size': 11, 'text-wrap': 'wrap', 'text-max-width': 150,
      'text-background-color': c.background, 'text-background-opacity': 1, 'text-background-padding': 4,
      'loop-direction': '-45deg', 'loop-sweep': '65deg',
    } },
    { selector: 'edge[?conditional]', style: { 'line-style': 'dashed' } },
    { selector: ':selected', style: { 'border-color': c.accent, 'border-width': 4, 'line-color': c.accent, 'target-arrow-color': c.accent } },
  ];
}

function arrange(cy) {
  if (!cy?.nodes().length) return;
  cy.layout({ name: 'breadthfirst', directed: true, spacingFactor: 1.7, padding: 50,
    roots: cy.nodes().filter(node => node.data('start')), animate: false }).run();
}

export function FlamGraph({ document, selection, onSelect, onAddScene, onAddRoll, onConnect, projectEpoch, graphLayout, onLayout }) {
  const { t } = useCommonTranslation();
  const container = useRef(null);
  const engine = useRef(null);
  const select = useRef(onSelect);
  const saveLayout = useRef(onLayout);
  const lastLayout = useRef(undefined);
  const [linkSource, setLinkSource] = useState(null);
  const themeEpoch = useThemeEpoch();
  const elements = useMemo(() => flamGraphElements(document, {
    start: t('common:flam.graph.start'), ending: t('common:flam.graph.ending'),
    roll: t('common:flam.roll'), untitled: t('common:flam.untitled'),
    conditional: t('common:flam.graph.conditional'),
  }), [document, t]);

  const selectedScene = selection.collection === 'scenes' ? document.scenes.find(scene => scene.id === selection.id) : null;
  const activeSource = document.scenes.some(scene => scene.id === linkSource && !scene.ending) ? linkSource : null;
  useEffect(() => { saveLayout.current = onLayout; }, [onLayout]);
  useEffect(() => {
    select.current = target => {
      if (activeSource && ['scenes', 'rolls'].includes(target.collection)) {
        onConnect(activeSource, target.collection, target.id);
        setLinkSource(null);
      } else onSelect(target);
    };
  }, [onSelect, onConnect, activeSource]);
  useEffect(() => {
    const cy = cytoscape({ container: container.current, elements: [], style: styles(container.current),
      minZoom: 0.15, maxZoom: 2.5, wheelSensitivity: 1.0, boxSelectionEnabled: false });
    engine.current = cy;
    cy.on('tap', 'node, edge', event => {
      const data = event.target.data();
      select.current({ collection: data.collection, id: data.definitionId });
    });
    const unbindLayout = bindFlamGraphLayout(cy, positions => saveLayout.current(positions));
    const observer = new ResizeObserver(() => cy.resize());
    observer.observe(container.current);
    return () => { observer.disconnect(); unbindLayout(); cy.destroy(); engine.current = null; };
  }, [projectEpoch]);

  useEffect(() => {
    const cy = engine.current;
    if (!cy) return;
    const first = syncFlamGraph(cy, elements, selection);
    if (first || (lastLayout.current !== graphLayout && !graphLayout)) arrange(cy);
    if (first || lastLayout.current !== graphLayout) {
      if (graphLayout) restoreFlamGraphLayout(cy, graphLayout);
      if (first && graphLayout) cy.fit(undefined, 50);
      lastLayout.current = graphLayout;
    }
    const selected = cy.nodes(':selected');
    if (selected.length) {
      const box = selected.boundingBox();
      const extent = cy.extent();
      if (box.x2 < extent.x1 || box.x1 > extent.x2 || box.y2 < extent.y1 || box.y1 > extent.y2) cy.center(selected);
    }
  }, [elements, selection, projectEpoch, graphLayout]);

  useEffect(() => { engine.current?.style(styles(container.current)); }, [themeEpoch]);

  function zoom(factor) {
    const cy = engine.current;
    if (cy) cy.zoom({ level: cy.zoom() * factor, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
  }

  return <section className="flam-graph" aria-label={t('common:flam.graph.title')}>
    <div className="flam-graph-toolbar">
      <Button onClick={onAddScene}>{t('common:flam.graph.addScene')}</Button>
      <Button onClick={onAddRoll}>{t('common:flam.graph.addRoll')}</Button>
      <Button disabled={!selectedScene || selectedScene.ending}
        aria-pressed={Boolean(activeSource)} onClick={() => setLinkSource(activeSource ? null : selection.id)}>{t('common:flam.graph.connect')}</Button>
      {activeSource && <>
        <select aria-label={t('common:flam.graph.target')} value="" onChange={event => {
          const target = elements.find(element => element.data.id === event.target.value);
          if (target) select.current({ collection: target.data.collection, id: target.data.definitionId });
        }}>
          <option value="">{t('common:flam.graph.target')}</option>
          {elements.filter(element => !element.data.source).map(element => <option key={element.data.id} value={element.data.id}>{element.data.label}</option>)}
        </select>
        <Button onClick={() => setLinkSource(null)}>{t('common:dialog.cancel.label')}</Button>
      </>}
      <div className="flam-graph-camera">
        <Button onClick={() => zoom(1.25)} aria-label={t('common:flam.graph.zoomIn')}>+</Button>
        <Button onClick={() => zoom(0.8)} aria-label={t('common:flam.graph.zoomOut')}>−</Button>
        <Button onClick={() => engine.current?.fit(undefined, 50)}>{t('common:flam.graph.fit')}</Button>
        <Button onClick={() => {
          if (!engine.current) return;
          arrange(engine.current);
          saveLayout.current(captureFlamGraphLayout(engine.current));
        }}>{t('common:flam.graph.arrange')}</Button>
      </div>
    </div>
    <div className="flam-graph-canvas" ref={container} aria-hidden="true" />
    {!document.scenes.length && <p className="flam-graph-empty">{t('common:flam.graph.empty')}</p>}
    <p className="flam-graph-help" role="status">{activeSource ? t('common:flam.graph.connectHelp') : t('common:flam.graph.help')}</p>
  </section>;
}
