import { planFlamGraphLink } from '../../store/flamAdventure/graphLinks.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCommonTranslation } from '../../i18n/commonPresentation.js';
import { diagnoseAdventureDocument } from '../../store/flamAdventure/diagnostics.js';
import { adventureDiagnosticTarget } from '../../store/flamAdventure/editing.js';
import { useMediaTransfer } from '../../store/MediaTransferContext.js';
import { useErrorDialog } from '../common/Dialog.jsx';
import { Button } from '../common/Button.jsx';
import { AudioField } from '../editors/AudioField.jsx';
import { ImageField } from '../editors/ImageField.jsx';
import { CheckField, NumberField, ReferenceField, TextField } from './Fields.jsx';
import { IllustrationModeField } from './IllustrationEditor.jsx';
import { ThemeEditor } from './ThemeEditor.jsx';
import { useFlamInspector } from './useFlamInspector.js';
import { ScreenEditor } from './ScreenEditor.jsx';
import { ChoiceEditor } from './ChoiceEditor.jsx';
import { RuleEditor } from './RuleEditor.jsx';
import { PresentationEditor, PresentationMedia } from './PresentationEditor.jsx';
import { FlamProduction } from './FlamProduction.jsx';
import { FlamGraph } from './FlamGraph.jsx';
import { GraphWorkspacePanels, GraphPanelHeader } from '../../workspace/GraphWorkspacePanels.jsx';
import { ADVANCED_WORKSPACE_PANEL_IDS } from '../../workspace/panelLayout.js';
import { GraphNodeListActions } from '../AdvancedGraphCanvas/GraphSearchPanel.jsx';
import { TreeSearchBar } from '../TreePanel/TreeSearchBar.jsx';
import { useProjectActions } from '../../store/ProjectActionsContext.js';
import { WORKSPACE_MODE_FLAM } from '../../store/projectWorkState.js';
import { normalizeSearchText } from '../../utils/frenchText.js';
import { Fullscreen, Dices, Waypoints, Package } from '../icons/LucideLocal.jsx';
import '../AdvancedGraphCanvas/AdvancedGraphCanvas.css';
import '../AdvancedGraphCanvas/GraphSearchPanel.css';
import './FlamWorkspace.css';

function diagnosticText(diagnostic, t) {
  switch (diagnostic.code) {
    case 'INVALID_CHARACTER': return t('common:flam.character.invalid');
    case 'INVALID_DETAIL_LAYOUT': return t('common:flam.detail.invalid');
    case 'INVALID_ILLUSTRATION_MODE': return t('common:flam.illustration.invalid');
    case 'INVALID_COLLECTION_DETAIL': return t('common:flam.collection.invalidDetail');
    case 'INVALID_GRID': return t('common:flam.grid.invalid');
    case 'INVALID_GRID_DETAIL': return t('common:flam.grid.invalidDetail');
    case 'INVALID_COLOR': return t('common:flam.theme.invalid');
    case 'INVALID_MAIN_MENU': return t('common:flam.screens.invalidMain');
    case 'INVALID_CONSULTATION_LINK': return t('common:flam.screens.invalidLink');
    case 'INVALID_PROGRESS': return t('common:flam.presentation.invalidProgress');
    case 'EMPTY_CHAPTER': return t('common:flam.presentation.emptyChapter');
    case 'DUPLICATE_PASSAGE': return t('common:flam.presentation.duplicatePassage');
    case 'MISSING_START': return t('common:flam.diagnostic.start');
    case 'MISSING_REFERENCE': return t('common:flam.diagnostic.reference');
    case 'MISSING_LABEL': return t('common:flam.diagnostic.label');
    case 'MISSING_TITLE': return t('common:flam.diagnostic.title');
    case 'AMBIGUOUS_DESTINATION': return t('common:flam.diagnostic.destination');
    case 'INVALID_QUANTITY': return t('common:flam.diagnostic.quantity');
    case 'NO_EXIT': return t('common:flam.diagnostic.exit');
    case 'CONDITIONAL_EXITS': return t('common:flam.diagnostic.conditional');
    case 'INVALID_ROLL_RANGE': return t('common:flam.diagnostic.range');
    case 'ROLL_OVERLAP': return t('common:flam.diagnostic.overlap');
    case 'ROLL_GAP': return t('common:flam.diagnostic.gap');
    default: return diagnostic.code;
  }
}

export function FlamWorkspace({ project, projectEpoch, onEdit, panelViewState = null }) {
  const { t } = useCommonTranslation();
  const document = project.authoring.document;
  const [selection, setSelection] = useState({ collection: 'scenes', id: null });
  const rootRef = useRef(null);
  const inspector = useFlamInspector(panelViewState?.showInspector ?? true, rootRef);
  const searchInputRef = useRef(null);
  const [searchActive, setSearchActive] = useState(false);
  const [query, setQuery] = useState('');
  const actions = useProjectActions();
  const mediaTools = {
    onImportMedia: actions?.onImportMediaLibrary,
    onImportPodcast: actions?.onImportPodcast,
    onImportYoutube: actions?.onImportYoutube,
    onRecord: actions?.onRecord,
    onGenerateStoryTts: actions?.onGenerateStoryTts,
    canRecord: actions?.canRecord,
    canGenerateStoryTts: actions?.canGenerateStoryTts,
  };
  const selectDefinition = target => {
    setSelection(target);
    inspector.showSelection();
    if (panelViewState?.showInspector === false) panelViewState.toggleInspector();
  };
  const searchNodes = () => {
    if (panelViewState?.showNodeList === false) panelViewState.toggleNodeList();
    setSearchActive(true);
    searchInputRef.current?.focus();
  };
  useEffect(() => { if (searchActive) searchInputRef.current?.focus(); }, [searchActive, panelViewState?.showNodeList]);
  const { showErrorDialog, showConfirmDialog } = useErrorDialog();
  const { prepareMediaForProject, setGraphMediaTarget } = useMediaTransfer();
  const collections = [
    ['screens', t('common:flam.screens.title')],
    ['scenes', t('common:flam.scenes')], ['classes', t('common:flam.classes')],
    ['items', t('common:flam.items')], ['events', t('common:flam.events')],
    ['rewards', t('common:flam.rewards')], ['rolls', t('common:flam.rolls')],
    ['choices', t('common:flam.choices')],
  ];
  const collection = selection.collection;
  const entry = (document[collection] ?? []).find(entry => entry.id === selection.id)
    ?? (collection === 'scenes' ? document.scenes.find(scene => scene.id === document.startSceneId) : null)
    ?? (document[collection] ?? [])[0] ?? null;
  const path = entry ? `/${collection}/${document[collection].indexOf(entry)}` : null;
  const entryType = !entry ? t('common:flam.settings.selection') : collection === 'screens'
    ? (entry.type === 'menu' ? t('common:flam.screens.menu') : entry.type === 'grid' ? t('common:flam.grid.title') : entry.type === 'character' ? t('common:flam.character.title') : t('common:flam.screens.detail'))
    : { scenes: t('common:flam.scene'), classes: t('common:flam.class'), items: t('common:flam.item'),
      events: t('common:flam.event'), rewards: t('common:flam.reward'), rolls: t('common:flam.roll'), choices: t('common:flam.choices') }[collection];
  const diagnostics = diagnoseAdventureDocument(document);
  const edit = useCallback(command => {
    try {
      return onEdit(projectEpoch, command)?.status === 'applied';
    } catch (error) {
      showErrorDialog({
        get title() { return t('common:flam.edit.errorTitle'); },
        get message() { return error.code === 'REFERENCED_ADVENTURE_DEFINITION'
          ? t('common:flam.edit.referenced') : t('common:flam.edit.error'); },
        technicalDetail: [error.code, error.path, ...(error.references ?? [])].filter(Boolean).join('\n'),
      });
      return false;
    }
  }, [onEdit, projectEpoch, showErrorDialog, t]);
  const patch = changes => edit({ type: 'patch', collection, id: entry.id, patch: changes });
  const patchChoice = (id, changes) => edit({ type: 'patch', collection: 'choices', id, patch: changes });

  const assignMedia = useCallback(async (sceneId, kind, source) => {
    const prepared = await prepareMediaForProject(source);
    if (prepared) edit({ type: 'patch', collection: 'scenes', id: sceneId, patch: { [kind]: prepared } });
  }, [edit, prepareMediaForProject]);
  const sceneId = collection === 'scenes' ? entry?.id : null;
  const sceneTitle = collection === 'scenes' ? entry?.title : null;
  useEffect(() => {
    setGraphMediaTarget(sceneId ? {
      uuid: sceneId, label: sceneTitle || t('common:flam.untitled'),
      assign: ({ kind, path }) => assignMedia(sceneId, kind, path),
    } : null);
    return () => setGraphMediaTarget(null);
  }, [sceneId, sceneTitle, assignMedia, setGraphMediaTarget, t]);

  function add(collection, sceneId, screenType) {
    const id = crypto.randomUUID();
    if (edit({ type: 'add', collection, id, sceneId, screenType }) && collection !== 'choices') selectDefinition({ collection, id });
  }

  function link(port, target) {
    const plan = planFlamGraphLink(document, port, target, crypto.randomUUID());
    if (!plan) return false;
    const applied = edit(plan.command);
    if (applied) selectDefinition(plan.selection);
    return applied;
  }

  function createLinked(drop, targetCollection, name) {
    const targetId = crypto.randomUUID();
    const applied = edit({ type: 'linkNew', id: crypto.randomUUID(), targetId, targetCollection, name,
      port: drop.port, position: drop.position, positions: drop.positions });
    if (applied) selectDefinition({ collection: targetCollection, id: targetId });
    return applied;
  }

  async function remove(command) {
    const accepted = await showConfirmDialog({
      get title() { return t('common:flam.remove.title'); },
      get message() { return t('common:flam.remove.description'); },
      get okLabel() { return t('common:dialog.delete.label'); },
      okKind: 'danger',
    });
    if (accepted) edit(command);
  }

  function reveal(diagnostic) {
    const target = adventureDiagnosticTarget(document, diagnostic.path);
    if (target) selectDefinition(target);
    else if (panelViewState?.showInspector === false) panelViewState.toggleInspector();
    inspector.reveal(target ? 'selection' : 'adventure', diagnostic.path);
  }

  function choiceEditor(choice, removeFromScene = null) {
    return <ChoiceEditor key={choice.id} choice={choice} document={document}
      path={`/choices/${document.choices.indexOf(choice)}`}
      onMedia={async source => {
        const prepared = source && await prepareMediaForProject(source);
        if (!source || prepared) edit({ type: 'patch', collection: 'choices', id: choice.id, patch: { image: prepared || null } });
      }}
      onPatch={changes => patchChoice(choice.id, changes)}
      onRemove={removeFromScene ? () => remove({ type: 'removeChoice', id: choice.id, sceneId: removeFromScene }) : null} />;
  }

  const visibleDefinitions = (query ? collections : collections.filter(([key]) => key === collection))
    .flatMap(([key]) => (document[key] ?? []).map(item => ({ collection: key, item })))
    .filter(({ item }) => normalizeSearchText(`${item.title || item.name || item.label || ''} ${item.id}`).includes(normalizeSearchText(query)));

  function navigateDefinitions(event) {
    const delta = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    if (!delta && event.key !== 'Home' && event.key !== 'End') return;
    const buttons = [...event.currentTarget.closest('ul').querySelectorAll('button')];
    const current = buttons.indexOf(event.currentTarget);
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, current + delta));
    event.preventDefault(); event.stopPropagation();
    buttons[index]?.focus();
  }

  const renderNodeListPanel = dragHandleProps => <section className="advanced-panel advanced-panel--nodes">
    <GraphNodeListActions surfaceTools={mediaTools} onSearch={searchNodes}
      workspaceMode={WORKSPACE_MODE_FLAM} onClose={panelViewState?.toggleNodeList} dragHandleProps={dragHandleProps} />
    <nav className="advanced-search flam-navigation" aria-label={t('common:flam.navigation')}>
      {searchActive && <TreeSearchBar searchTerm={query} setSearchTerm={setQuery} setSearchActive={setSearchActive}
        inputRef={searchInputRef} usedColors={[]} selectedColors={new Set()} onToggleColor={() => {}}
        onClearSearch={() => { setQuery(''); setSearchActive(false); }} />}
      <div className="advanced-search__scopes" role="group" aria-label={t('common:flam.navigation')}>
        {collections.map(([key, label]) => <button key={key} type="button" className="advanced-search__scope"
          aria-pressed={collection === key} onClick={() => selectDefinition({ collection: key, id: null })}>{label}</button>)}
      </div>
      <p className="advanced-search__count">{document.title || t('common:flam.untitled')}</p>
      <ul className="advanced-search__list">
        {visibleDefinitions.map(({ collection: key, item }) => <li key={`${key}:${item.id}`}>
          <button type="button" className="advanced-search__item flam-node-row" onKeyDown={navigateDefinitions}
            data-focused={collection === key && entry?.id === item.id ? 'true' : undefined}
            aria-current={collection === key && entry?.id === item.id ? 'true' : undefined}
            onClick={() => selectDefinition({ collection: key, id: item.id })}>
            <span className="advanced-search__icon" aria-hidden="true">{key === 'scenes' ? <Fullscreen /> : key === 'rolls' ? <Dices /> : <Waypoints />}</span>
            <span className="advanced-search__identity"><span className="advanced-search__name">{item.title || item.name || item.label || t('common:flam.untitled')}</span>
              <span className="advanced-search__identifier">{collections.find(([name]) => name === key)[1]}</span></span>
          </button>
        </li>)}
        {!visibleDefinitions.length && <li className="advanced-search__empty">{t('common:flam.empty')}</li>}
      </ul>
    </nav>
  </section>;

  const renderInspectorPanel = dragHandleProps => <section className="advanced-panel advanced-panel--inspector flam-settings-panel" aria-label={t('common:flam.graph.inspector')}>
    <GraphPanelHeader title={t('common:workspace.settings.label')} onClose={panelViewState?.toggleInspector} dragHandleProps={dragHandleProps}
      actions={<div className="flam-settings-tabs" role="tablist" aria-label={t('common:workspace.settings.label')}>
        <button {...inspector.tabProps('adventure')}>{t('common:flam.settings.adventure')}</button>
        <button {...inspector.tabProps('selection')}>{entryType}</button>
      </div>} />
    <aside className="advanced-inspector advanced-inspector--editor flam-inspector" {...inspector.panelProps('adventure')}>
        <div className="advanced-editor flam-content">
          <section className="flam-project card flam-card">
            <TextField label={t('common:flam.title')} path="/title" value={document.title} onChange={title => edit({ type: 'document', patch: { title } })} />
            <ReferenceField label={t('common:flam.start')} path="/startSceneId" entries={document.scenes} value={document.startSceneId} onChange={startSceneId => edit({ type: 'document', patch: { startSceneId } })} />
          </section>
          <section className="card flam-card">
            <ReferenceField label={t('common:flam.screens.mainMenu')} path="/mainMenuId" entries={(document.screens ?? []).filter(screen => screen.type === 'menu')}
              value={document.mainMenuId ?? null} onChange={mainMenuId => edit({ type: 'document', patch: { mainMenuId } })} />
          </section>
          <ThemeEditor document={document} onChange={theme => edit({ type: 'document', patch: { theme } })} />
          {!document.screens?.length && <PresentationEditor document={document} onEdit={edit} prepareMedia={prepareMediaForProject} projectEpoch={projectEpoch} />}
        </div>
        <section className="flam-diagnostics" aria-label={t('common:flam.settings.problems')}>
          <h2>{t('common:flam.settings.problems')}</h2>
          <p className="flam-hint">{t('common:flam.diagnostics.help')}</p>
          {diagnostics.length === 0 && <p>{t('common:flam.diagnostics.clear')}</p>}
          <ul aria-label={t('common:flam.diagnostics')}>{diagnostics.map((diagnostic, index) => {
            const target = adventureDiagnosticTarget(document, diagnostic.path);
            const item = target ? document[target.collection].find(item => item.id === target.id) : null;
            return <li key={`${diagnostic.path}:${diagnostic.code}:${index}`} className={`flam-diagnostic flam-diagnostic--${diagnostic.severity}`}>
              <button type="button" onClick={() => reveal(diagnostic)}>
                <strong>{item?.title || item?.name || item?.label || t('common:flam.title')}</strong>
                <span>{diagnosticText(diagnostic, t)}</span>
              </button>
            </li>;
          })}</ul>
        </section>
    </aside>
    <aside className="advanced-inspector advanced-inspector--editor flam-inspector" {...inspector.panelProps('selection')}>
        <div className="advanced-editor flam-content">
          <div className="flam-section-header">
            <h2>{collections.find(([key]) => key === collection)[1]}</h2>
            {collection === 'screens' ? <><Button onClick={() => add('screens', null, 'menu')}>{t('common:flam.screens.addMenu')}</Button><Button onClick={() => add('screens', null, 'detail')}>{t('common:flam.screens.addDetail')}</Button><Button onClick={() => add('screens', null, 'grid')}>{t('common:flam.grid.add')}</Button><Button onClick={() => add('screens', null, 'character')}>{t('common:flam.character.add')}</Button></> : collection !== 'choices' && <Button variant="primary" onClick={() => add(collection)}>{t('common:flam.add')}</Button>}
          </div>
          {!entry && <p>{t('common:flam.settings.noSelection')}</p>}
          {entry && <div data-flam-path={path} tabIndex={-1} className="flam-definition">
            <div className="flam-selection-identity">
              <span>{entryType}</span>
              <h2>{entry.title || entry.name || entry.label || t('common:flam.untitled')}</h2>
            </div>
            {['scenes', 'screens'].includes(collection) && <ThemeEditor document={document} screen={entry} path={`${path}/colors`} onChange={colors => patch({ colors })} />}
            {collection === 'screens' ? <ScreenEditor screen={entry} document={document} path={path} onPatch={patch} projectEpoch={projectEpoch}
              onAudioMedia={async source => {
                const prepared = source && await prepareMediaForProject(source);
                if (!source || prepared) edit({ type: 'patch', collection: 'screens', id: entry.id, patch: { audio: prepared || null } });
              }}
              onLinkMedia={async (linkId, source) => {
                const prepared = source && await prepareMediaForProject(source);
                if (!source || prepared) edit({ type: 'menuLinkMedia', menuId: entry.id, linkId, value: prepared || null });
              }}
              onEntryMedia={async (ownerId, source) => {
                const prepared = source && await prepareMediaForProject(source);
                if (!source || prepared) edit({ type: 'presentationMedia', ownerId, kind: 'image', value: prepared || null });
              }}
              onAddCommand={() => edit({ type: 'add', collection: 'choices', id: crypto.randomUUID(), menuId: entry.id, linkId: crypto.randomUUID() })}
              onPatchChoice={patchChoice} onRemoveCommand={link => remove({ type: 'removeChoice', id: link.choiceId, menuId: entry.id, linkId: link.id })}
              onMedia={async source => { const prepared = await prepareMediaForProject(source); if (prepared) edit({ type: 'patch', collection: 'screens', id: entry.id, patch: { image: prepared } }); }} /> : collection === 'scenes' ? <>
              <TextField label={t('common:flam.scene.title')} path={`${path}/title`} value={entry.title} onChange={title => patch({ title })} />
              <TextField multiline label={t('common:flam.scene.text')} path={`${path}/text`} value={entry.text} onChange={text => patch({ text })} />
              <p className="flam-hint">{t('common:flam.scene.textHelp')}</p>
              <IllustrationModeField value={entry.illustrationMode} path={`${path}/illustrationMode`} onChange={illustrationMode => patch({ illustrationMode })} />
              <CheckField label={t('common:flam.scene.ending')} path={`${path}/ending`} checked={entry.ending} onChange={ending => patch({ ending })} />
              <section className="flam-media" key={entry.id}>
                <div data-flam-path={`${path}/image`} tabIndex={-1}><ImageField fieldId={`flam:${entry.id}:image`} label={t('common:flam.scene.image')} file={entry.image} onPick={source => assignMedia(entry.id, 'image', source)} onClear={() => patch({ image: null })} /></div>
                <div data-flam-path={`${path}/audio`} tabIndex={-1}><AudioField label={t('common:flam.scene.audio')} labelRef={{ key: 'common:flam.scene.audio' }} file={entry.audio} required={false} ttsTextSuggestion={entry.text} ttsFilenameHint={`scene-${entry.id}`}
                  xttsTarget={{ kind: 'flamScene', projectEpoch, apply: source => assignMedia(entry.id, 'audio', source) }}
                  onPick={source => assignMedia(entry.id, 'audio', source)} onClear={() => patch({ audio: null })} /></div>
              </section>
              <h3>{t('common:flam.choices')}</h3>
              {entry.choices.map((id, index) => {
                const choice = document.choices.find(choice => choice.id === id);
                return choice ? choiceEditor(choice, entry.id) : <div key={id} data-flam-path={`${path}/choices/${index}`} tabIndex={-1} className="card flam-card">
                  <p>{t('common:flam.reference.missing', { id })}</p>
                  <Button onClick={() => patch({ choices: entry.choices.filter(choice => choice !== id) })}>{t('common:flam.choice.remove')}</Button>
                </div>;
              })}
              <Button onClick={() => add('choices', entry.id)}>{t('common:flam.choice.add')}</Button>
            </> : collection === 'choices' ? choiceEditor(entry) : <>
              <TextField label={t('common:flam.name')} path={`${path}/name`} value={entry.name} onChange={name => patch({ name })} />
              {collection === 'items' && <>
                <TextField multiline label={t('common:flam.scene.text')} path={`${path}/text`} value={entry.text ?? ''} onChange={text => patch({ text })} />
                <PresentationMedia entry={{ ...entry, image: entry.image ?? null, audio: entry.audio ?? null }} path={path} projectEpoch={projectEpoch}
                  onMedia={async (kind, source) => { const prepared = source && await prepareMediaForProject(source); if (!source || prepared) edit({ type: 'patch', collection: 'items', id: entry.id, patch: { [kind]: prepared || null } }); }} />
              </>}
              {collection === 'rewards' && <>
                <CheckField label={t('common:flam.reward.repeatable')} path={`${path}/repeatable`} checked={entry.repeatable} onChange={repeatable => patch({ repeatable })} />
                <p className="flam-hint">{t('common:flam.reward.help')}</p>
                <RuleEditor rules={entry.effects} document={document} path={`${path}/effects`} onChange={effects => patch({ effects })} />
              </>}
              {collection === 'rolls' && <section data-flam-path={`${path}/outcomes`} tabIndex={-1}>
                <p>{t('common:flam.roll.help')}</p>
                {entry.outcomes.map((outcome, index) => {
                  const update = changes => patch({ outcomes: entry.outcomes.map((value, i) => i === index ? { ...value, ...changes } : value) });
                  return <div className="card flam-card" key={index} data-flam-path={`${path}/outcomes/${index}`} tabIndex={-1}>
                    <NumberField label={t('common:flam.roll.min')} path={`${path}/outcomes/${index}/min`} value={outcome.min} onChange={min => update({ min })} />
                    <NumberField label={t('common:flam.roll.max')} path={`${path}/outcomes/${index}/max`} value={outcome.max} onChange={max => update({ max })} />
                    <ReferenceField label={t('common:flam.roll.outcome')} path={`${path}/outcomes/${index}/destination`} entries={document.scenes} value={outcome.destination} onChange={destination => update({ destination })} />
                    <Button size="sm" onClick={() => patch({ outcomes: entry.outcomes.filter((_, i) => i !== index) })}>{t('common:flam.roll.remove')}</Button>
                  </div>;
                })}
                <Button onClick={() => patch({ outcomes: [...entry.outcomes, { min: 1, max: 20, destination: null }] })}>{t('common:flam.roll.add')}</Button>
              </section>}
            </>}
            <div className="flam-delete"><Button variant="danger-outline" onClick={() => remove({ type: 'remove', collection, id: entry.id })}>{t('common:flam.remove.title')}</Button></div>
          </div>}
        </div>
    </aside>
  </section>;

  const renderPanel = (panelId, dragHandleProps) => {
    if (panelId === ADVANCED_WORKSPACE_PANEL_IDS.NODE_LIST) return renderNodeListPanel(dragHandleProps);
    if (panelId === ADVANCED_WORKSPACE_PANEL_IDS.INSPECTOR) return renderInspectorPanel(dragHandleProps);
    return <section className="advanced-panel advanced-panel--graph">
      <FlamGraph document={document} projectEpoch={projectEpoch} graphLayout={project.authoring.graphLayout}
        onLayout={positions => edit({ type: 'layout', positions })}
        selection={{ collection, id: entry?.id ?? null }} onSelect={selectDefinition}
        onAddScreen={screenType => add('screens', null, screenType)} onAddScene={() => add('scenes')} onAddRoll={() => add('rolls')} onLink={link} onCreateLinked={createLinked}
        dragHandleProps={dragHandleProps} panelViewState={panelViewState}
        surfaceTools={panelViewState?.showNodeList === false ? { ...mediaTools, onSearch: searchNodes } : null}
        production={<details className="flam-production-menu">
          <summary className="chrome-toolbar-btn"><Package className="chrome-icon" aria-hidden="true" /><span className="chrome-toolbar-btn-label">{t('common:flam.production.title')}</span></summary>
          <FlamProduction document={document} />
        </details>} />
    </section>;
  };

  return <div className="flam-workspace" ref={rootRef}>
    <GraphWorkspacePanels viewState={panelViewState} renderPanel={renderPanel} />
  </div>;
}
