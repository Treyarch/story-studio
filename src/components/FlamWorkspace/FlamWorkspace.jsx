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
import { ChoiceEditor } from './ChoiceEditor.jsx';
import { RuleEditor } from './RuleEditor.jsx';
import { FlamProduction } from './FlamProduction.jsx';
import './FlamWorkspace.css';

function diagnosticText(diagnostic, t) {
  switch (diagnostic.code) {
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

export function FlamWorkspace({ project, projectEpoch, onEdit, onOpenMedia }) {
  const { t } = useCommonTranslation();
  const document = project.authoring.document;
  const [selection, setSelection] = useState({ collection: 'scenes', id: null });
  const [focusPath, setFocusPath] = useState(null);
  const rootRef = useRef(null);
  const { showErrorDialog, showConfirmDialog } = useErrorDialog();
  const { prepareMediaForProject, setGraphMediaTarget } = useMediaTransfer();
  const collections = [
    ['scenes', t('common:flam.scenes')], ['classes', t('common:flam.classes')],
    ['items', t('common:flam.items')], ['events', t('common:flam.events')],
    ['rewards', t('common:flam.rewards')], ['rolls', t('common:flam.rolls')],
    ['choices', t('common:flam.choices')],
  ];
  const collection = selection.collection;
  const entry = document[collection].find(entry => entry.id === selection.id) ?? document[collection][0] ?? null;
  const path = entry ? `/${collection}/${document[collection].indexOf(entry)}` : null;
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

  useEffect(() => {
    if (!focusPath) return;
    const targets = [...rootRef.current.querySelectorAll('[data-flam-path]')];
    let targetPath = focusPath;
    let target;
    while (targetPath && !target) {
      target = targets.find(element => element.dataset.flamPath === targetPath);
      targetPath = targetPath.slice(0, targetPath.lastIndexOf('/'));
    }
    if (target) {
      target.scrollIntoView?.({ block: 'center' });
      (target.querySelector('input, select, textarea, button') ?? target).focus();
    }
    setFocusPath(null);
  }, [focusPath, selection]);

  function add(collection, sceneId) {
    const id = crypto.randomUUID();
    if (edit({ type: 'add', collection, id, sceneId }) && collection !== 'choices') setSelection({ collection, id });
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
    if (target) setSelection(target);
    setFocusPath(diagnostic.path);
  }

  function choiceEditor(choice, removeFromScene = null) {
    return <ChoiceEditor key={choice.id} choice={choice} document={document}
      path={`/choices/${document.choices.indexOf(choice)}`}
      onPatch={changes => patchChoice(choice.id, changes)}
      onRemove={removeFromScene ? () => remove({ type: 'removeChoice', id: choice.id, sceneId: removeFromScene }) : null} />;
  }

  return <div className="flam-workspace" ref={rootRef}>
    <header className="flam-header">
      <div><h1>{t('common:flam.create.title')}</h1><p>{t('common:flam.editor.help')}</p></div>
      <Button onClick={onOpenMedia}>{t('common:flam.media.open')}</Button>
    </header>
    <div className="flam-columns">
      <nav className="flam-navigation" aria-label={t('common:flam.navigation')}>
        {collections.map(([key, label]) => <section key={key}>
          <h2><button type="button" aria-pressed={collection === key} onClick={() => setSelection({ collection: key, id: null })}>{label}</button></h2>
          <ul>{document[key].map(item => <li key={item.id}>
            <button type="button" aria-current={collection === key && entry?.id === item.id ? 'true' : undefined} onClick={() => setSelection({ collection: key, id: item.id })}>
              {item.title || item.name || item.label || t('common:flam.untitled')}
            </button>
          </li>)}</ul>
        </section>)}
      </nav>
      <main className="flam-content">
        <section className="flam-project flam-card">
          <TextField label={t('common:flam.title')} path="/title" value={document.title} onChange={title => edit({ type: 'document', patch: { title } })} />
          <ReferenceField label={t('common:flam.start')} path="/startSceneId" entries={document.scenes} value={document.startSceneId} onChange={startSceneId => edit({ type: 'document', patch: { startSceneId } })} />
        </section>
        <div className="flam-section-header">
          <h2>{collections.find(([key]) => key === collection)[1]}</h2>
          {collection !== 'choices' && <Button variant="primary" onClick={() => add(collection)}>{t('common:flam.add')}</Button>}
        </div>
        {!entry && <p>{t('common:flam.empty')}</p>}
        {entry && <div data-flam-path={path} tabIndex={-1} className="flam-definition">
          {collection === 'scenes' ? <>
            <TextField label={t('common:flam.scene.title')} path={`${path}/title`} value={entry.title} onChange={title => patch({ title })} />
            <TextField multiline label={t('common:flam.scene.text')} path={`${path}/text`} value={entry.text} onChange={text => patch({ text })} />
            <p className="flam-hint">{t('common:flam.scene.textHelp')}</p>
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
              return choice ? choiceEditor(choice, entry.id) : <div key={id} data-flam-path={`${path}/choices/${index}`} tabIndex={-1} className="flam-card">
                <p>{t('common:flam.reference.missing', { id })}</p>
                <Button onClick={() => patch({ choices: entry.choices.filter(choice => choice !== id) })}>{t('common:flam.choice.remove')}</Button>
              </div>;
            })}
            <Button onClick={() => add('choices', entry.id)}>{t('common:flam.choice.add')}</Button>
          </> : collection === 'choices' ? choiceEditor(entry) : <>
            <TextField label={t('common:flam.name')} path={`${path}/name`} value={entry.name} onChange={name => patch({ name })} />
            {collection === 'rewards' && <>
              <CheckField label={t('common:flam.reward.repeatable')} path={`${path}/repeatable`} checked={entry.repeatable} onChange={repeatable => patch({ repeatable })} />
              <p className="flam-hint">{t('common:flam.reward.help')}</p>
              <RuleEditor rules={entry.effects} document={document} path={`${path}/effects`} onChange={effects => patch({ effects })} />
            </>}
            {collection === 'rolls' && <section data-flam-path={`${path}/outcomes`} tabIndex={-1}>
              <p>{t('common:flam.roll.help')}</p>
              {entry.outcomes.map((outcome, index) => {
                const update = changes => patch({ outcomes: entry.outcomes.map((value, i) => i === index ? { ...value, ...changes } : value) });
                return <div className="flam-card" key={index} data-flam-path={`${path}/outcomes/${index}`} tabIndex={-1}>
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
      </main>
      <aside className="flam-diagnostics" aria-label={t('common:flam.diagnostics')}>
        <FlamProduction document={document} />
        <h2>{t('common:flam.diagnostics')}</h2>
        <p className="flam-hint">{t('common:flam.diagnostics.help')}</p>
        {diagnostics.length === 0 && <p>{t('common:flam.diagnostics.clear')}</p>}
        <ul>{diagnostics.map((diagnostic, index) => {
          const target = adventureDiagnosticTarget(document, diagnostic.path);
          const item = target ? document[target.collection].find(item => item.id === target.id) : null;
          return <li key={`${diagnostic.path}:${diagnostic.code}:${index}`} className={`flam-diagnostic flam-diagnostic--${diagnostic.severity}`}>
            <button type="button" onClick={() => reveal(diagnostic)}>
              <strong>{item?.title || item?.name || item?.label || t('common:flam.title')}</strong>
              <span>{diagnosticText(diagnostic, t)}</span>
            </button>
          </li>;
        })}</ul>
      </aside>
    </div>
  </div>;
}
