import { useCommonTranslation } from '../../i18n/commonPresentation.js';
import { createAdventurePresentation } from '../../store/flamAdventure/presentation.js';
import { Button } from '../common/Button.jsx';
import { ImageField } from '../editors/ImageField.jsx';
import { AudioField } from '../editors/AudioField.jsx';
import { CheckField, Field, NumberField, ReferenceField, TextField } from './Fields.jsx';
import { RuleEditor } from './RuleEditor.jsx';

export function PresentationMedia({ entry, path, onMedia, projectEpoch }) {
  const { t } = useCommonTranslation();
  return <section className="flam-media" key={entry.id ?? path}>
    <div data-flam-path={`${path}/image`}><ImageField fieldId={`flam-presentation:${entry.id ?? path}`} label={t('common:flam.scene.image')} file={entry.image}
      onPick={source => onMedia('image', source)} onClear={() => onMedia('image', null)} /></div>
    {Object.hasOwn(entry, 'audio') && <div data-flam-path={`${path}/audio`}><AudioField label={t('common:flam.scene.audio')} labelRef={{ key: 'common:flam.scene.audio' }} file={entry.audio} required={false}
      ttsTextSuggestion={entry.text} ttsFilenameHint={`rubrique-${entry.id}`} xttsTarget={{ kind: 'flamScene', projectEpoch, apply: source => onMedia('audio', source) }}
      onPick={source => onMedia('audio', source)} onClear={() => onMedia('audio', null)} /></div>}
  </section>;
}

function ListActions({ index, entries, onChange }) {
  const { t } = useCommonTranslation();
  function move(delta) {
    const next = [...entries];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange(next);
  }
  return <div className="flam-presentation-actions">
    <Button size="sm" disabled={index === 0} onClick={() => move(-1)}>{t('common:flam.presentation.up')}</Button>
    <Button size="sm" disabled={index === entries.length - 1} onClick={() => move(1)}>{t('common:flam.presentation.down')}</Button>
    <Button size="sm" onClick={() => onChange(entries.filter((_, i) => i !== index))}>{t('common:flam.rule.remove')}</Button>
  </div>;
}

export function PresentationEditor({ document, onEdit, prepareMedia, projectEpoch }) {
  const { t } = useCommonTranslation();
  const view = document.presentation;
  const labels = {
    title: t('common:flam.presentation.title'),
    help: t('common:flam.presentation.help'),
    enable: t('common:flam.presentation.enable'),
    welcome: t('common:flam.presentation.welcome'),
    sections: t('common:flam.presentation.sections'),
    chapters: t('common:flam.presentation.chapters'),
    character: t('common:flam.presentation.character'),
    inventory: t('common:flam.presentation.inventory'),
    journal: t('common:flam.presentation.journal'),
    memories: t('common:flam.presentation.memories'),
    collection: t('common:flam.presentation.collection'),
    label: t('common:flam.presentation.label'),
    kind: t('common:flam.presentation.kind'),
    visible: t('common:flam.presentation.visible'),
    hideLocked: t('common:flam.presentation.hideLocked'),
    up: t('common:flam.presentation.up'),
    down: t('common:flam.presentation.down'),
    addEntry: t('common:flam.presentation.addEntry'),
    addSection: t('common:flam.presentation.addSection'),
    addChapter: t('common:flam.presentation.addChapter'),
    passage: t('common:flam.presentation.passage'),
    replayable: t('common:flam.presentation.replayable'),
    addPassage: t('common:flam.presentation.addPassage'),
    progress: t('common:flam.presentation.progress'),
    target: t('common:flam.presentation.target'),
    milestone: t('common:flam.presentation.milestone'),
    addMilestone: t('common:flam.presentation.addMilestone'),
    progressHelp: t('common:flam.presentation.progressHelp'),
  };
  const key = name => labels[name];
  const update = patch => onEdit({ type: 'document', patch: { presentation: { ...view, ...patch } } });
  const patchSection = (index, patch) => update({ sections: view.sections.map((entry, i) => i === index ? { ...entry, ...patch } : entry) });
  const patchChapter = (index, patch) => update({ chapters: view.chapters.map((entry, i) => i === index ? { ...entry, ...patch } : entry) });
  const patchProgress = patch => update({ progress: { ...view.progress, ...patch } });
  const media = (entry, path) => <PresentationMedia entry={entry} path={path} projectEpoch={projectEpoch} onMedia={async (kind, source) => {
    const prepared = source && await prepareMedia(source);
    if (!source || prepared) onEdit({ type: 'presentationMedia', ownerId: entry.id ?? null, kind, value: prepared || null });
  }} />;
  const entryFields = (entry, path, patch) => <>
    <TextField label={key('label')} path={`${path}/title`} value={entry.title} onChange={title => patch({ title })} />
    <TextField multiline label={t('common:flam.scene.text')} path={`${path}/text`} value={entry.text} onChange={text => patch({ text })} />
    {media(entry, path)}
    <RuleEditor conditions rules={entry.conditions} document={document} path={`${path}/conditions`} onChange={conditions => patch({ conditions })} />
    <CheckField label={key('hideLocked')} path={`${path}/unavailable`} checked={entry.unavailable === 'hidden'} onChange={hidden => patch({ unavailable: hidden ? 'hidden' : 'disabled' })} />
  </>;
  return <details className="card flam-card flam-presentation" data-flam-path="/presentation">
    <summary>{key('title')}</summary>
    <p className="flam-hint">{key('help')}</p>
    {!view ? <Button onClick={() => onEdit({ type: 'document', patch: { presentation: createAdventurePresentation(() => crypto.randomUUID(), ['chapters', 'character', 'inventory', 'journal', 'memories'].map(key)) } })}>{key('enable')}</Button> : <>
      <TextField multiline label={key('welcome')} path="/presentation/text" value={view.text} onChange={text => update({ text })} />
      {media(view, '/presentation')}
      <h3>{key('sections')}</h3>
      {view.sections.map((section, index) => {
        const path = `/presentation/sections/${index}`;
        return <details className="card flam-card" key={section.id} data-flam-path={path}>
          <summary>{section.title || t('common:flam.untitled')}</summary>
          <TextField label={key('label')} path={`${path}/title`} value={section.title} onChange={title => patchSection(index, { title })} />
          <Field label={key('kind')} path={`${path}/kind`}>{id => <select id={`${id}-control`} aria-labelledby={id} value={section.kind} onChange={event => patchSection(index, { kind: event.target.value })}>
            {['chapters', 'character', 'inventory', 'collection'].map(kind => <option key={kind} value={kind}>{key(kind)}</option>)}
          </select>}</Field>
          <CheckField label={key('visible')} path={`${path}/enabled`} checked={section.enabled} onChange={enabled => patchSection(index, { enabled })} />
          {media(section, path)}
          {!['chapters', 'inventory'].includes(section.kind) && <>
            {section.entries.map((entry, j) => <details className="card flam-card" key={entry.id} data-flam-path={`${path}/entries/${j}`}>
              <summary>{entry.title || t('common:flam.untitled')}</summary>
              {entryFields(entry, `${path}/entries/${j}`, patch => patchSection(index, { entries: section.entries.map((item, i) => i === j ? { ...item, ...patch } : item) }))}
              <ListActions index={j} entries={section.entries} onChange={entries => patchSection(index, { entries })} />
            </details>)}
            <Button onClick={() => patchSection(index, { entries: [...section.entries, { id: crypto.randomUUID(), title: '', text: '', image: null, audio: null, conditions: [], unavailable: 'hidden' }] })}>{key('addEntry')}</Button>
          </>}
          <ListActions index={index} entries={view.sections} onChange={sections => update({ sections })} />
        </details>;
      })}
      <Button onClick={() => update({ sections: [...view.sections, { id: crypto.randomUUID(), kind: 'collection', title: '', image: null, enabled: true, entries: [] }] })}>{key('addSection')}</Button>
      <h3>{key('chapters')}</h3>
      {view.chapters.map((chapter, index) => {
        const path = `/presentation/chapters/${index}`;
        return <details className="card flam-card" key={chapter.id} data-flam-path={path}>
          <summary>{chapter.title || t('common:flam.untitled')}</summary>
          <TextField label={key('label')} path={`${path}/title`} value={chapter.title} onChange={title => patchChapter(index, { title })} />
          {media(chapter, path)}
          {chapter.passages.map((passage, j) => {
            const patch = changes => patchChapter(index, { passages: chapter.passages.map((item, i) => i === j ? { ...item, ...changes } : item) });
            return <section className="card flam-card" key={j} data-flam-path={`${path}/passages/${j}`}>
              <ReferenceField label={key('passage')} path={`${path}/passages/${j}/sceneId`} entries={document.scenes} value={passage.sceneId} onChange={sceneId => patch({ sceneId })} />
              <CheckField label={key('replayable')} path={`${path}/passages/${j}/replayable`} checked={passage.replayable} onChange={replayable => patch({ replayable })} />
              <RuleEditor conditions rules={passage.conditions} document={document} path={`${path}/passages/${j}/conditions`} onChange={conditions => patch({ conditions })} />
              <ListActions index={j} entries={chapter.passages} onChange={passages => patchChapter(index, { passages })} />
            </section>;
          })}
          <Button onClick={() => patchChapter(index, { passages: [...chapter.passages, { sceneId: null, replayable: true, conditions: [] }] })}>{key('addPassage')}</Button>
          <ListActions index={index} entries={view.chapters} onChange={chapters => update({ chapters })} />
        </details>;
      })}
      <Button onClick={() => update({ chapters: [...view.chapters, { id: crypto.randomUUID(), title: '', image: null, passages: [] }] })}>{key('addChapter')}</Button>
      <h3>{key('progress')}</h3>
      <p className="flam-hint">{key('progressHelp')}</p>
      <NumberField label={key('target')} path="/presentation/progress/target" value={view.progress.target} onChange={target => patchProgress({ target })} />
      {view.progress.milestones.map((milestone, index) => <section className="card flam-card" key={milestone.id} data-flam-path={`/presentation/progress/milestones/${index}`}>
        <h4>{key('milestone')} {index + 1}</h4>
        <RuleEditor conditions rules={milestone.conditions} document={document} path={`/presentation/progress/milestones/${index}/conditions`}
          onChange={conditions => patchProgress({ milestones: view.progress.milestones.map((item, i) => i === index ? { ...item, conditions } : item) })} />
        <ListActions index={index} entries={view.progress.milestones} onChange={milestones => patchProgress({ milestones })} />
      </section>)}
      <Button onClick={() => patchProgress({ milestones: [...view.progress.milestones, { id: crypto.randomUUID(), conditions: [] }] })}>{key('addMilestone')}</Button>
    </>}
  </details>;
}
