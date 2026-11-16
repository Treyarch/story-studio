import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { translateGraph as t, graphTranslationEngine } from '../i18n/graphPresentation.js';
import { getIntlLocale } from '../i18n/language.js';
import { X } from '../components/icons/LucideLocal.jsx';
import {
  ADVANCED_INSPECTOR_WIDTH_DEFAULT, ADVANCED_INSPECTOR_WIDTH_MAX, ADVANCED_INSPECTOR_WIDTH_MIN,
  ADVANCED_NODE_LIST_WIDTH_DEFAULT, ADVANCED_NODE_LIST_WIDTH_MAX, ADVANCED_NODE_LIST_WIDTH_MIN,
  ADVANCED_WORKSPACE_PANEL_IDS, DEFAULT_ADVANCED_WORKSPACE_PANEL_ORDER,
  getAdvancedWorkspaceResizeBoundaries, getVisibleAdvancedWorkspacePanelOrder,
} from './panelLayout.js';
import { PanelSortContext, SortablePanelItem } from './PanelSortContext.jsx';
import { PanelResizeHandle } from '../components/structure/PanelResizeHandle.jsx';
import '../components/AdvancedWorkspace/AdvancedWorkspace.css';

// Les commandes d'un panneau vivent dans **son** en-tête, pas dans la barre du
// haut : créer un nœud est un geste du graphe, et l'éloigner de la surface qu'il
// sert obligeait l'auteur à traverser l'écran pour un geste qu'il fait souvent.
//
// Elles arrêtent le pointeur : l'en-tête est la poignée de déplacement du
// panneau, et un appui sur un bouton ne doit pas amorcer un glisser.
export function GraphPanelHeader({ title, onClose = null, actions = null, dragHandleProps = {} }) {
  useTranslation('graph', { i18n: graphTranslationEngine() });
  return (
    <header
      className={`advanced-panel-header${actions ? ' has-actions' : ''}`}
      {...dragHandleProps}
    >
      <strong className="advanced-panel-header__title">{title}</strong>
      {actions ? (
        <>
          <div
            className="advanced-panel-header__actions"
            onPointerDown={(event) => event.stopPropagation()}
          >
            {actions}
          </div>
          {/* Le contrepoids du titre. Deux côtés de même souplesse encadrant la
              rangée, c'est ce qui la met au **centre de l'en-tête** et non au
              centre de la place qui reste à droite du titre. */}
          <span className="advanced-panel-header__balance" aria-hidden="true" />
        </>
      ) : null}
      {onClose ? (
        <button
          type="button"
          className="advanced-panel-header__close"
          aria-label={t("graph:workspace.fermer.label", { title: title.toLocaleLowerCase(getIntlLocale()) })}
          onClick={onClose}
        >
          <X aria-hidden="true" />
        </button>
      ) : null}
    </header>
  );
}

// Les deux ateliers passent par les mêmes panneaux, poignées et préférences.
export function GraphWorkspacePanels({ viewState = null, renderPanel, children = null }) {
  useTranslation('graph', { i18n: graphTranslationEngine() });
  const showNodeList = viewState?.showNodeList ?? true;
  const showInspector = viewState?.showInspector ?? true;
  const panelOrder = viewState?.panelOrder ?? DEFAULT_ADVANCED_WORKSPACE_PANEL_ORDER;
  const visibility = {
    [ADVANCED_WORKSPACE_PANEL_IDS.NODE_LIST]: showNodeList,
    [ADVANCED_WORKSPACE_PANEL_IDS.GRAPH]: true,
    [ADVANCED_WORKSPACE_PANEL_IDS.INSPECTOR]: showInspector,
  };
  const visiblePanelOrder = getVisibleAdvancedWorkspacePanelOrder(panelOrder, visibility);
  const resizeBoundaries = getAdvancedWorkspaceResizeBoundaries(visiblePanelOrder);
  const resizeBoundaryByPair = new Map(resizeBoundaries.map((boundary) => [boundary.id, boundary]));
  const nodeListPanelWidth = viewState?.nodeListPanelWidth ?? ADVANCED_NODE_LIST_WIDTH_DEFAULT;
  const inspectorPanelWidth = viewState?.inspectorPanelWidth ?? ADVANCED_INSPECTOR_WIDTH_DEFAULT;
  const workspaceStyle = {
    '--advanced-node-list-panel-width': `${nodeListPanelWidth}px`,
    '--advanced-inspector-panel-width': `${inspectorPanelWidth}px`,
  };

  const renderResizeHandle = (boundary) => {
    const nodeListConfig = {
      ariaLabel: t("graph:workspace.resizeTheNodeList.label"),
      panelClass: '.advanced-panel-slot--advanced-node-list',
      cssVar: '--advanced-node-list-panel-width',
      minWidth: ADVANCED_NODE_LIST_WIDTH_MIN,
      maxWidth: ADVANCED_NODE_LIST_WIDTH_MAX,
      value: nodeListPanelWidth,
      defaultValue: ADVANCED_NODE_LIST_WIDTH_DEFAULT,
      onResize: viewState?.setNodeListPanelWidth,
    };
    const inspectorConfig = {
      ariaLabel: t("common:workspace.settings.resize"),
      panelClass: '.advanced-panel-slot--advanced-inspector',
      cssVar: '--advanced-inspector-panel-width',
      minWidth: ADVANCED_INSPECTOR_WIDTH_MIN,
      maxWidth: ADVANCED_INSPECTOR_WIDTH_MAX,
      value: inspectorPanelWidth,
      defaultValue: ADVANCED_INSPECTOR_WIDTH_DEFAULT,
      onResize: viewState?.setInspectorPanelWidth,
    };
    const config = boundary.resizedPanelId === ADVANCED_WORKSPACE_PANEL_IDS.NODE_LIST
      ? nodeListConfig
      : inspectorConfig;
    if (!config.onResize) return null;
    return <PanelResizeHandle {...config} direction={boundary.direction} />;
  };

  return <div className="advanced-workspace" style={workspaceStyle}>
      <PanelSortContext items={visiblePanelOrder} onMove={viewState?.movePanel}>
        {visiblePanelOrder.map((panelId, index) => {
          const nextPanelId = visiblePanelOrder[index + 1];
          const boundary = nextPanelId
            ? resizeBoundaryByPair.get(`${panelId}-${nextPanelId}`)
            : null;
          return (
            <Fragment key={panelId}>
              <SortablePanelItem
                id={panelId}
                activation="header"
                className={`advanced-panel-slot advanced-panel-slot--${panelId}`}
              >
                {({ dragHandleProps }) => renderPanel(panelId, dragHandleProps)}
              </SortablePanelItem>
              {boundary ? renderResizeHandle(boundary) : null}
            </Fragment>
          );
        })}
      </PanelSortContext>
    {children}
  </div>;
}
