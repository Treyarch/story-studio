import { useCommonTranslation } from '../../i18n/commonPresentation.js';
import { Button } from '../common/Button.jsx';
import { ImageField } from '../editors/ImageField.jsx';
import { Field, ReferenceField, TextField } from './Fields.jsx';
import { RuleEditor } from './RuleEditor.jsx';

export function CollectionEditor({ entries, document, path, onChange, onMedia }) {
  const { t } = useCommonTranslation();
  const update = (index, patch) => onChange(entries.map((entry, i) => i === index ? { ...entry, ...patch } : entry));
  return <section data-flam-path={path}>
    <p className="flam-hint">{t('common:flam.collection.help')}</p>
    {entries.map((entry, index) => <details className="card flam-card" key={entry.id} data-flam-path={`${path}/${index}`} open>
      <summary>{entry.label || t('common:flam.collection.entry')}</summary>
      <TextField label={t('common:flam.collection.label')} path={`${path}/${index}/label`} value={entry.label} onChange={label => update(index, { label })} />
      <div data-flam-path={`${path}/${index}/image`}><ImageField fieldId={`flam-collection:${entry.id}`} label={t('common:flam.scene.image')} file={entry.image}
        onPick={source => onMedia(entry.id, source)} onClear={() => onMedia(entry.id, null)} /></div>
      <ReferenceField label={t('common:flam.collection.detail')} path={`${path}/${index}/screenId`} value={entry.screenId}
        entries={(document.screens ?? []).filter(screen => screen.type === 'detail' && screen.contentSource !== 'item')} onChange={screenId => update(index, { screenId })} />
      <RuleEditor conditions rules={entry.conditions} document={document} path={`${path}/${index}/conditions`} onChange={conditions => update(index, { conditions })} />
      <Field label={t('common:flam.collection.unavailable')} path={`${path}/${index}/unavailable`}>{id => <select id={`${id}-control`} aria-labelledby={id}
        value={entry.unavailable} onChange={event => update(index, { unavailable: event.target.value })}>
        <option value="hidden">{t('common:flam.collection.hidden')}</option>
        <option value="disabled">{t('common:flam.collection.locked')}</option>
      </select>}</Field>
      <Button size="sm" onClick={() => onChange(entries.filter((_, i) => i !== index))}>{t('common:flam.rule.remove')}</Button>
    </details>)}
    <Button onClick={() => onChange([...entries, { id: crypto.randomUUID(), label: '', image: null, screenId: null, conditions: [], unavailable: 'hidden' }])}>{t('common:flam.collection.add')}</Button>
  </section>;
}
