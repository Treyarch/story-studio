import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import cytoscape from 'cytoscape';
import { useCommonTranslation } from '../../i18n/commonPresentation.js';
import { useThemeEpoch } from '../AdvancedGraphCanvas/useThemeEpoch.js';
import { readEngineColors } from '../AdvancedGraphCanvas/engines/engineColors.js';
import { Button } from '../common/Button.jsx';
import { GraphPanelHeader } from '../../workspace/GraphWorkspacePanels.jsx';
import { GraphSurfaceControls } from '../AdvancedGraphCanvas/GraphSurfaceControls.jsx';
import { CommandButton } from '../layout/ToolbarCommand.jsx';
import { Fullscreen, Dices, Link2 } from '../icons/LucideLocal.jsx';
import { WORKSPACE_MODE_FLAM } from '../../store/projectWorkState.js';
import { GRAPH_ZOOM_STEP, zoomedViewport } from '../../store/advancedGraphView/graphGeometry.js';
import { graphShortcutFor } from '../../store/advancedAuthoring/graphShortcuts.js';
import { getCurrentShortcuts } from '../../store/keyboardShortcuts.js';
import { useShortcutLabels } from '../../store/ShortcutLabelsContext.js';
import { createRevealHistory, recordVisit, goBack, goForward, canGoBack, canGoForward, pruneMissing } from '../../store/advancedGraphView/revealHistory.js';
import { cytoscapeGridStyle } from '../AdvancedGraphCanvas/engines/cytoscapeEngine.js';
import { flamGraphControls, flamGraphOverview, filterFlamGraphEdges } from './flamGraphControls.js';
import { isCurrentFlamLinkPort } from '../../store/flamAdventure/graphLinks.js';
import { flamGraphPortNodes, updateFlamLinkEndpoints } from './flamGraphLinks.js';
import { FlamGraphPorts } from './FlamGraphPorts.jsx';
import { FlamLinkDialog } from './FlamLinkDialog.jsx';
import { flamGraphStyles } from './flamGraphStyle.js';
import { flamGraphElements } from './flamGraph.js';
import { syncFlamGraph, captureFlamGraphLayout, restoreFlamGraphLayout, bindFlamGraphLayout } from './flamGraphSync.js';

function styles(container) {
  const c = readEngineColors(container, {
    background: ['--graph-card-bg', '#5d5c88'], text: ['--text', '#e6e8ed'],
    border: ['--border', '#687080'], accent: ['--accent', '#78a9ff'],
    muted: ['--muted', '#9aa3b2'], action: ['--graph-action-bg', '#52c0b9'],
    surface: ['--bg0', '#15181c'],
  });
  return flamGraphStyles(c);
}

function arrange(cy) {
  if (!cy?.nodes().length) return;
  cy.layout({ name: 'breadthfirst', directed: true, spacingFactor: 1.7, padding: 50,
    roots: cy.nodes().filter(node => node.data('start')), animate: false }).run();
}

export function FlamGraph({ document, selection, onSelect, onAddScene, onAddRoll, onLink, onCreateLinked, projectEpoch, graphLayout, onLayout, dragHandleProps = {}, panelViewState = null, surfaceTools = null, production = null }) {
  const { t, language } = useCommonTranslation();
  const container = useRef(null);
  const host = useRef(null);
  const controlsEngine = useRef(null);
  const hoveredNode = useRef(null);
  const publishFrame = useRef(() => {});
  const [frame, setFrame] = useState({ viewport: { x: 0, y: 0, zoom: 1 }, overview: null, nodes: [] });
  const [edgeVisibility, setEdgeVisibility] = useState({ choices: true, conditions: true, rolls: true });
  const [visits, setVisits] = useState(createRevealHistory);
  const shortcutLabels = useShortcutLabels();
  const engine = useRef(null);
  const select = useRef(onSelect);
  const saveLayout = useRef(onLayout);
  const lastLayout = useRef(undefined);
  const [armedPort, setArmedPort] = useState(null);
  const [createDrop, setCreateDrop] = useState(null);
  const themeEpoch = useThemeEpoch();
  const elements = useMemo(() => flamGraphElements(document, {
    untitled: t('common:flam.untitled'),
  }), [document, t, language]);

  const selectedScene = selection.collection === 'scenes' ? document.scenes.find(scene => scene.id === selection.id) : null;
  const activePort = isCurrentFlamLinkPort(document, armedPort) ? armedPort : null;
  useEffect(() => { saveLayout.current = onLayout; }, [onLayout]);
  useEffect(() => {
    select.current = target => {
      if (activePort && ['scenes', 'rolls'].includes(target.collection)) {
        onLink(activePort, target);
        setArmedPort(null);
      } else onSelect(target);
    };
  }, [onSelect, onLink, activePort]);
  useEffect(() => {
    const cy = cytoscape({ container: container.current, elements: [], style: styles(container.current),
      minZoom: 0.001, maxZoom: 4, wheelSensitivity: 1.0, boxSelectionEnabled: false });
    engine.current = cy;
    controlsEngine.current = flamGraphControls(cy);
    let pending = null;
    const publish = () => {
      if (pending !== null) return;
      pending = requestAnimationFrame(() => {
        pending = null;
        const nodes = flamGraphPortNodes(cy, hoveredNode.current);
        updateFlamLinkEndpoints(cy, nodes);
        // Le canvas est déjà peint dans cette image : les prises HTML doivent
        // être posées avant son affichage, sans attendre un rendu React différé.
        flushSync(() => setFrame({ viewport: controlsEngine.current.getViewport(), overview: flamGraphOverview(cy), nodes }));
      });
    };
    publishFrame.current = publish;
    cy.on('viewport position add remove data select unselect', publish);
    cy.on('mouseover', 'edge', event => event.target.addClass('is-hovered'));
    cy.on('mouseout', 'edge', event => event.target.removeClass('is-hovered'));
    cy.on('mouseover', 'node', event => { hoveredNode.current = event.target.id(); publish(); });
    cy.on('mouseout', 'node', () => { hoveredNode.current = null; publish(); });
    cy.on('tap', 'node, edge', event => {
      const data = event.target.data();
      select.current({ collection: data.collection, id: data.definitionId });
    });
    const unbindLayout = bindFlamGraphLayout(cy, positions => saveLayout.current(positions));
    const observer = new ResizeObserver(() => cy.resize());
    observer.observe(container.current);
    return () => {
      cy.off('viewport position add remove data select unselect', publish);
      publishFrame.current = () => {}; hoveredNode.current = null;
      if (pending !== null) cancelAnimationFrame(pending);
      observer.disconnect(); unbindLayout(); cy.destroy(); engine.current = null; controlsEngine.current = null;
    };
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
  useEffect(() => {
    if (engine.current) filterFlamGraphEdges(engine.current, edgeVisibility);
  }, [edgeVisibility, elements, themeEpoch]);

  const selectionPath = `${selection.collection}:${selection.id}`;
  const knownPaths = useMemo(() => new Set(elements.filter(element => !element.data.source).map(element => element.data.id)), [elements]);
  const navigation = useMemo(() => pruneMissing(visits, path => knownPaths.has(path)), [visits, knownPaths]);
  useEffect(() => {
    if (engine.current?.getElementById(selectionPath).isNode()) {
      setVisits(current => recordVisit(current, selectionPath, controlsEngine.current.getViewport()));
    }
  }, [selectionPath]);

  function visit(direction) {
    const result = direction === 'back' ? goBack(navigation) : goForward(navigation);
    if (!result.visit) return;
    setVisits(result.history);
    const node = engine.current.getElementById(result.visit.path);
    if (result.visit.viewport) controlsEngine.current.setViewport(result.visit.viewport);
    setArmedPort(null);
    onSelect({ collection: node.data('collection'), id: node.data('definitionId') });
  }

  function rearrange() {
    if (!engine.current) return;
    arrange(engine.current);
    saveLayout.current(captureFlamGraphLayout(engine.current));
  }

  useEffect(() => {
    const keydown = event => {
      const action = graphShortcutFor(event, { shortcuts: getCurrentShortcuts() });
      const commands = {
        graphZoomIn: () => zoom(GRAPH_ZOOM_STEP), graphZoomOut: () => zoom(1 / GRAPH_ZOOM_STEP),
        graphFit: () => controlsEngine.current?.fitContent(), graphArrange: rearrange,
        graphToggleOverview: panelViewState?.toggleOverview,
        graphVisitBack: () => visit('back'), graphVisitForward: () => visit('forward'),
        graphCreateStage: onAddScene, graphCreateAction: onAddRoll,
      };
      if (!commands[action]) return;
      event.preventDefault();
      commands[action]();
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  });

  function zoom(factor) {
    const adapter = controlsEngine.current;
    const cy = engine.current;
    if (!adapter || !cy) return;
    const next = zoomedViewport(adapter.getViewport(), { width: cy.width(), height: cy.height() }, factor);
    if (next) adapter.setViewport(next);
  }

  const command = (id, label, available = true, shortcut = null) => ({ id, label, available, shortcut, unavailableReason: t('common:flam.graph.selectSource') });
  return <>
    <GraphPanelHeader title={t('common:flam.graph.title')} dragHandleProps={dragHandleProps} actions={<>
      <CommandButton entry={command('flamAddScene', t('common:flam.graph.addScene'), true, shortcutLabels.graphCreateStage)}
        className="advanced-create-command" Icon={Fullscreen} onClick={onAddScene} />
      <CommandButton entry={command('flamAddRoll', t('common:flam.graph.addRoll'), true, shortcutLabels.graphCreateAction)}
        className="advanced-create-command" Icon={Dices} onClick={onAddRoll} />
      <CommandButton entry={command('flamConnect', t('common:flam.graph.connect'), Boolean(selectedScene && !selectedScene.ending))}
        className="advanced-create-command" Icon={Link2} onClick={() => setArmedPort(activePort ? null : { key: 'add', kind: 'add', sceneId: selection.id })} />
      {production}
    </>} />
    <section className="advanced-canvas__stage flam-graph" ref={host} aria-label={t('common:flam.graph.title')}>
      <div className="advanced-canvas__host" data-grid-engine="cytoscape" style={cytoscapeGridStyle(frame.viewport)} ref={container} aria-hidden="true" />
      <FlamGraphPorts cy={engine.current} hostRef={host} document={document} nodes={frame.nodes} zoom={frame.viewport.zoom}
        onBegin={() => setArmedPort(null)} onArm={setArmedPort}
        onHover={path => { hoveredNode.current = path; publishFrame.current(); }}
        onHighlight={(path, key) => {
          const cy = engine.current;
          if (!cy) return;
          cy.edges().removeClass('is-port-focused');
          if (path) cy.edges().filter(edge => edge.source().id() === path && edge.data('sourcePortKey') === key).addClass('is-port-focused');
        }}
        onSelect={target => select.current(target)} onDrop={drop => {
          if (drop.target) onLink(drop.port, drop.target);
          else setCreateDrop(drop);
        }} />
      <GraphSurfaceControls engineRef={controlsEngine} hostRef={host} viewport={frame.viewport}
        overviewModel={frame.overview} workspaceMode={WORKSPACE_MODE_FLAM} surfaceTools={surfaceTools}
        overviewOpen={panelViewState?.showOverview ?? true} onToggleOverview={panelViewState?.toggleOverview}
        arrangement={{ arrange: rearrange, disabled: !document.scenes.length, folds: false }}
        history={{ canBack: canGoBack(navigation), canForward: canGoForward(navigation), onBack: () => visit('back'), onForward: () => visit('forward') }}
        edgeVisibility={edgeVisibility} onEdgeVisibilityChange={setEdgeVisibility}
        edgeFilters={[
          { group: 'choices', text: t('common:flam.choices'), className: 'is-structure' },
          { group: 'conditions', text: t('common:flam.conditions'), className: 'is-return' },
          { group: 'rolls', text: t('common:flam.rolls'), className: 'is-random' },
        ]} />
      {activePort && <div className="flam-link-tools">
        <select aria-label={t('common:flam.graph.target')} value="" onChange={event => {
          const target = elements.find(element => element.data.id === event.target.value);
          if (target) select.current({ collection: target.data.collection, id: target.data.definitionId });
        }}>
          <option value="">{t('common:flam.graph.target')}</option>
          {elements.filter(element => !element.data.source && (activePort?.kind !== 'outcome' || element.data.collection === 'scenes')).map(element => <option key={element.data.id} value={element.data.id}>{element.data.label}</option>)}
        </select>
        <Button onClick={() => setArmedPort(null)}>{t('common:dialog.cancel.label')}</Button>
      </div>}
      {!document.scenes.length && <p className="flam-graph-empty">{t('common:flam.graph.empty')}</p>}
      {activePort && <p className="flam-graph-help" role="status">{t('common:flam.graph.connectHelp')}</p>}
    </section>
    {createDrop && <FlamLinkDialog drop={createDrop} onCancel={() => setCreateDrop(null)}
      onCreate={(collection, name) => {
        if (onCreateLinked(createDrop, collection, name)) setCreateDrop(null);
      }} />}
  </>;
}
