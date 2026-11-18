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
import { Fullscreen, Dices, Link2, Plus, ChevronDown, List, Grid2X2, BookOpenText, Info } from '../icons/LucideLocal.jsx';
import { MenuItem, MenuPopover } from '../layout/MenuPopover.jsx';
import { WORKSPACE_MODE_FLAM } from '../../store/projectWorkState.js';
import { GRAPH_ZOOM_STEP, zoomedViewport } from '../../store/advancedGraphView/graphGeometry.js';
import { graphShortcutFor } from '../../store/advancedAuthoring/graphShortcuts.js';
import { getCurrentShortcuts } from '../../store/keyboardShortcuts.js';
import { createRevealHistory, recordVisit, goBack, goForward, canGoBack, canGoForward, pruneMissing } from '../../store/advancedGraphView/revealHistory.js';
import { cytoscapeGridStyle } from '../AdvancedGraphCanvas/engines/cytoscapeEngine.js';
import { flamGraphControls, flamGraphOverview, filterFlamGraphEdges } from './flamGraphControls.js';
import { isCurrentFlamLinkPort, isFlamLinkTarget } from '../../store/flamAdventure/graphLinks.js';
import { flamGraphPortNodes, updateFlamLinkEndpoints } from './flamGraphLinks.js';
import { FlamScreenPreview } from './FlamScreenPreview.jsx';
import { useFlamPreviewDrag } from './useFlamPreviewDrag.js';
import { FlamGraphPorts } from './FlamGraphPorts.jsx';
import { FlamLinkDialog } from './FlamLinkDialog.jsx';
import { arrangeFlamGraph } from './flamGraphArrange.js';
import { filterFlamGraphElements, flamVisibleNodes } from './flamGraphScope.js';
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

export function FlamGraph({ document, selection, onSelect, onAddScene, onAddRoll, onAddScreen, onLink, onCreateLinked, projectEpoch, graphLayout, onLayout, dragHandleProps = {}, panelViewState = null, surfaceTools = null, production = null }) {
  const { t, language } = useCommonTranslation();
  const addTrigger = useRef(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const container = useRef(null);
  const host = useRef(null);
  const previewDrag = useFlamPreviewDrag(host, `${selection.collection}:${selection.id}`);
  const controlsEngine = useRef(null);
  const hoveredNode = useRef(null);
  const publishFrame = useRef(() => {});
  const [frame, setFrame] = useState({ viewport: { x: 0, y: 0, zoom: 1 }, overview: null, nodes: [] });
  const [edgeVisibility, setEdgeVisibility] = useState({ choices: true, conditions: true, rolls: true, consultation: true });
  const [scope, setScope] = useState('all');
  const [visits, setVisits] = useState(createRevealHistory);
  const engine = useRef(null);
  const select = useRef(onSelect);
  const saveLayout = useRef(onLayout);
  const lastLayout = useRef(undefined);
  const [armedPort, setArmedPort] = useState(null);
  const [createDrop, setCreateDrop] = useState(null);
  const themeEpoch = useThemeEpoch();
  const elements = useMemo(() => flamGraphElements(document, {
    untitled: t('common:flam.untitled'), itemDetail: t('common:flam.grid.detail'),
  }), [document, t, language]);

  const visibleElements = useMemo(() => filterFlamGraphElements(elements, scope), [elements, scope]);
  const selectedScene = scope !== 'consultation' && selection.collection === 'scenes' ? document.scenes.find(scene => scene.id === selection.id) : null;
  const activePort = isCurrentFlamLinkPort(document, armedPort) ? armedPort : null;
  useEffect(() => { saveLayout.current = onLayout; }, [onLayout]);
  useEffect(() => {
    select.current = target => {
      if (activePort && ['scenes', 'rolls', 'screens'].includes(target.collection)) {
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
    filterFlamGraphEdges(cy, edgeVisibility, scope);
    if (first || (lastLayout.current !== graphLayout && !graphLayout)) arrangeFlamGraph(cy);
    if (first || lastLayout.current !== graphLayout) {
      if (graphLayout) restoreFlamGraphLayout(cy, graphLayout);
      if (first && graphLayout) cy.fit(flamVisibleNodes(cy), 50);
      lastLayout.current = graphLayout;
    }
    const selected = flamVisibleNodes(cy).filter(':selected');
    if (selected.length) {
      const box = selected.boundingBox();
      const extent = cy.extent();
      if (box.x2 < extent.x1 || box.x1 > extent.x2 || box.y2 < extent.y1 || box.y1 > extent.y2) cy.center(selected);
    }
  }, [elements, selection, projectEpoch, graphLayout, edgeVisibility, scope]);

  useEffect(() => { engine.current?.style(styles(container.current)); }, [themeEpoch]);
  useEffect(() => {
    if (engine.current) filterFlamGraphEdges(engine.current, edgeVisibility, scope);
    publishFrame.current();
  }, [edgeVisibility, elements, themeEpoch, scope]);

  const selectionPath = `${selection.collection}:${selection.id}`;
  const knownPaths = useMemo(() => new Set(visibleElements.filter(element => !element.data.source).map(element => element.data.id)), [visibleElements]);
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
    arrangeFlamGraph(engine.current);
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
      <MenuPopover open={addMenuOpen} onOpenChange={setAddMenuOpen} activation="click"
        label={t('common:structure.add.label')} placementBoundary=".advanced-panel"
        trigger={() => <button ref={addTrigger} type="button" className="chrome-toolbar-btn"
          aria-haspopup="menu" aria-expanded={addMenuOpen}
          onClick={() => setAddMenuOpen(open => !open)}
          onKeyDown={event => {
            if (event.key === 'ArrowDown') { event.preventDefault(); setAddMenuOpen(true); }
          }}>
          <Plus className="chrome-icon" aria-hidden="true" />
          <span className="chrome-toolbar-btn-label">{t('common:structure.add.label')}</span>
          <ChevronDown className="chrome-icon" aria-hidden="true" />
        </button>}>
        {[
          { id: 'flamAddScene', label: t('common:flam.graph.addScene'), Icon: Fullscreen, add: onAddScene },
          { id: 'flamAddRoll', label: t('common:flam.graph.addRoll'), Icon: Dices, add: onAddRoll },
          { id: 'flamAddMenu', label: t('common:flam.screens.addMenu'), Icon: List, add: () => onAddScreen('menu') },
          { id: 'flamAddGrid', label: t('common:flam.grid.add'), Icon: Grid2X2, add: () => onAddScreen('grid') },
          { id: 'flamAddDetail', label: t('common:flam.screens.addDetail'), Icon: BookOpenText, add: () => onAddScreen('detail') },
          { id: 'flamAddCharacter', label: t('common:flam.character.add'), Icon: Info, add: () => onAddScreen('character') },
        ].map(({ id, label, Icon, add }) => <MenuItem key={id} toolbarId={id} Icon={Icon} label={label}
          onClick={() => { setAddMenuOpen(false); addTrigger.current?.focus(); add(); }} />)}
      </MenuPopover>
      <CommandButton entry={command('flamConnect', t('common:flam.graph.connect'), Boolean(selectedScene && !selectedScene.ending))}
        className="advanced-create-command" Icon={Link2} onClick={() => setArmedPort(activePort ? null : { key: 'add', kind: 'add', sceneId: selection.id })} />
      {production}
    </>} />
    <div className="flam-graph-scopes" role="group" aria-label={t('common:flam.graph.scope')}>
      {[["all", t('common:flam.graph.all')], ["story", t('common:flam.graph.story')], ["consultation", t('common:flam.graph.consultation')]].map(([value, label]) => <Button key={value} size="sm" aria-pressed={scope === value} onClick={() => { setScope(value); setArmedPort(null); setCreateDrop(null); }}>{label}</Button>)}
    </div>
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
        arrangement={{ arrange: rearrange, disabled: !visibleElements.some(element => !element.data.source), folds: false }}
        history={{ canBack: canGoBack(navigation), canForward: canGoForward(navigation), onBack: () => visit('back'), onForward: () => visit('forward') }}
        edgeVisibility={edgeVisibility} onEdgeVisibilityChange={setEdgeVisibility}
        edgeFilters={[
          { group: 'consultation', text: t('common:flam.graph.consultation'), className: 'is-structure' },
          { group: 'choices', text: t('common:flam.choices'), className: 'is-structure' },
          { group: 'conditions', text: t('common:flam.conditions'), className: 'is-return' },
          { group: 'rolls', text: t('common:flam.rolls'), className: 'is-random' },
        ]} />
      {activePort && <div className="flam-link-tools">
        <select aria-label={t('common:flam.graph.target')} value="" onChange={event => {
          const target = visibleElements.find(element => element.data.id === event.target.value);
          if (target) select.current({ collection: target.data.collection, id: target.data.definitionId });
        }}>
          <option value="">{t('common:flam.graph.target')}</option>
          {visibleElements.filter(element => !element.data.source && isFlamLinkTarget(document, activePort, { collection: element.data.collection, id: element.data.definitionId })).map(element => <option key={element.data.id} value={element.data.id}>{element.data.label}</option>)}
        </select>
        <Button onClick={() => setArmedPort(null)}>{t('common:dialog.cancel.label')}</Button>
      </div>}
      <FlamScreenPreview key={`${selection.collection}:${selection.id}`} document={document} collection={selection.collection} id={selection.id} {...previewDrag} />
      {!visibleElements.some(element => !element.data.source) && <p className="flam-graph-empty">{t('common:flam.graph.empty')}</p>}
      {activePort && <p className="flam-graph-help" role="status">{t('common:flam.graph.connectHelp')}</p>}
    </section>
    {createDrop && <FlamLinkDialog drop={createDrop} onCancel={() => setCreateDrop(null)}
      onCreate={(collection, name) => {
        if (onCreateLinked(createDrop, collection, name)) setCreateDrop(null);
      }} />}
  </>;
}
