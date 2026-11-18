import { useCommonTranslation } from '../../i18n/commonPresentation.js';
import { Button } from '../common/Button.jsx';
import { CheckField, Field, ReferenceField, TextField } from './Fields.jsx';
import { ImageField } from '../editors/ImageField.jsx';
import { RuleEditor } from './RuleEditor.jsx';

export function ChoiceEditor({ choice, document, path, onPatch, onRemove, removeLabel, onMedia }) {
  const { t } = useCommonTranslation();
  return <section className="flam-card" data-flam-path={path} tabIndex={-1}>
    <TextField label={t('common:flam.choice.label')} path={`${path}/label`} value={choice.label} onChange={label => onPatch({ label })} />
    {onMedia && <div data-flam-path={`${path}/image`}><ImageField fieldId={`flam-choice:${choice.id}`} label={t('common:flam.illustration.choiceImage')} file={choice.image ?? null}
      onPick={source => onMedia(source)} onClear={() => onMedia(null)} /></div>}
    <Field label={t('common:flam.choice.transition')} path={`${path}/rollId`}>{id => <select id={`${id}-control`} aria-labelledby={id} value={choice.rollId === null ? 'scene' : 'roll'} onChange={event => onPatch(event.target.value === 'scene' ? { rollId: null, destination: null } : { rollId: document.rolls[0]?.id ?? null, destination: null })}>
      <option value="scene">{t('common:flam.choice.toScene')}</option>
      <option value="roll" disabled={!document.rolls.length}>{t('common:flam.choice.toRoll')}</option>
    </select>}</Field>
    {choice.rollId === null
      ? <ReferenceField label={t('common:flam.destination')} path={`${path}/destination`} entries={document.scenes} value={choice.destination} onChange={destination => onPatch({ destination })} />
      : <ReferenceField label={t('common:flam.roll')} path={`${path}/rollId`} entries={document.rolls} value={choice.rollId} onChange={rollId => onPatch({ rollId, destination: null })} />}
    <CheckField label={t('common:flam.choice.replayAudioOnReturn')} path={`${path}/replayAudioOnReturn`} checked={choice.replayAudioOnReturn !== false} onChange={replayAudioOnReturn => onPatch({ replayAudioOnReturn })} />
    <p className="flam-hint">{t('common:flam.choice.replayAudioOnReturnHelp')}</p>
    <ReferenceField label={t('common:flam.reward')} path={`${path}/rewardId`} entries={document.rewards} value={choice.rewardId} onChange={rewardId => onPatch({ rewardId })} />
    <RuleEditor conditions rules={choice.conditions} document={document} path={`${path}/conditions`} onChange={conditions => onPatch({ conditions })} />
    <RuleEditor rules={choice.effects} document={document} path={`${path}/effects`} onChange={effects => onPatch({ effects })} />
    <Field label={t('common:flam.unavailable')} path={`${path}/unavailable/mode`}>{id => <select id={`${id}-control`} aria-labelledby={id} value={choice.unavailable.mode} onChange={event => onPatch({ unavailable: { ...choice.unavailable, mode: event.target.value } })}>
      <option value="disabled">{t('common:flam.unavailable.disabled')}</option>
      <option value="hidden">{t('common:flam.unavailable.hidden')}</option>
    </select>}</Field>
    <TextField label={t('common:flam.unavailable.explanation')} path={`${path}/unavailable/explanation`} value={choice.unavailable.explanation} onChange={explanation => onPatch({ unavailable: { ...choice.unavailable, explanation } })} />
    {onRemove && <Button size="sm" variant="danger-outline" onClick={onRemove}>{removeLabel ?? t('common:flam.choice.remove')}</Button>}
  </section>;
}
