import { useCommonTranslation } from '../../i18n/commonPresentation.js';
import { Button } from '../common/Button.jsx';
import { CheckField, Field, NumberField, ReferenceField } from './Fields.jsx';

function ruleShape(type) {
  if (type === 'class' || type === 'chooseClass') return { type, classId: null };
  if (['item', 'giveItem', 'consumeItem'].includes(type)) return { type, itemId: null, quantity: 1 };
  if (type === 'event') return { type, eventId: null, present: true };
  return { type: 'setEvent', eventId: null };
}

export function ruleSummary(rule, document, t) {
  const name = (collection, id) => document[collection].find(entry => entry.id === id)?.name || t('common:flam.reference.none');
  const params = { name: name(rule.classId !== undefined ? 'classes' : rule.itemId !== undefined ? 'items' : 'events', rule.classId ?? rule.itemId ?? rule.eventId), quantity: rule.quantity };
  switch (rule.type) {
    case 'class': return t('common:flam.summary.class', params);
    case 'item': return t('common:flam.summary.item', params);
    case 'event': return rule.present ? t('common:flam.summary.eventPresent', params) : t('common:flam.summary.eventAbsent', params);
    case 'chooseClass': return t('common:flam.summary.chooseClass', params);
    case 'giveItem': return t('common:flam.summary.giveItem', params);
    case 'consumeItem': return t('common:flam.summary.consumeItem', params);
    case 'setEvent': return t('common:flam.summary.setEvent', params);
    default: return '';
  }
}

export function RuleEditor({ rules, conditions = false, document, path, onChange }) {
  const { t } = useCommonTranslation();
  const types = conditions
    ? [['class', t('common:flam.rule.class')], ['item', t('common:flam.rule.item')], ['event', t('common:flam.rule.event')]]
    : [['chooseClass', t('common:flam.rule.chooseClass')], ['giveItem', t('common:flam.rule.giveItem')], ['consumeItem', t('common:flam.rule.consumeItem')], ['setEvent', t('common:flam.rule.setEvent')]];
  const change = (index, patch) => onChange(rules.map((rule, i) => i === index ? { ...rule, ...patch } : rule));
  return <section className="flam-rules" data-flam-path={path} tabIndex={-1}>
    <h4>{conditions ? t('common:flam.conditions') : t('common:flam.effects')}</h4>
    {conditions && <p className="flam-hint">{t('common:flam.conditions.help')}</p>}
    {rules.map((rule, index) => <div className="flam-rule" key={index}>
      <Field label={t('common:flam.rule.type')} path={`${path}/${index}`}>{id => <select id={`${id}-control`} aria-labelledby={id} value={rule.type} onChange={event => onChange(rules.map((entry, i) => i === index ? ruleShape(event.target.value) : entry))}>
        {types.map(([type, label]) => <option key={type} value={type}>{label}</option>)}
      </select>}</Field>
      {Object.hasOwn(rule, 'classId') && <ReferenceField label={t('common:flam.class')} path={`${path}/${index}/classId`} entries={document.classes} value={rule.classId} onChange={classId => change(index, { classId })} />}
      {Object.hasOwn(rule, 'itemId') && <ReferenceField label={t('common:flam.item')} path={`${path}/${index}/itemId`} entries={document.items} value={rule.itemId} onChange={itemId => change(index, { itemId })} />}
      {Object.hasOwn(rule, 'eventId') && <ReferenceField label={t('common:flam.event')} path={`${path}/${index}/eventId`} entries={document.events} value={rule.eventId} onChange={eventId => change(index, { eventId })} />}
      {Object.hasOwn(rule, 'quantity') && <NumberField label={t('common:flam.quantity')} path={`${path}/${index}/quantity`} value={rule.quantity} onChange={quantity => change(index, { quantity })} />}
      {Object.hasOwn(rule, 'present') && <CheckField label={t('common:flam.event.present')} path={`${path}/${index}/present`} checked={rule.present} onChange={present => change(index, { present })} />}
      <Button size="sm" onClick={() => onChange(rules.filter((_, i) => i !== index))}>{t('common:flam.rule.remove')}</Button>
      <p className="flam-rule-summary">{ruleSummary(rule, document, t)}</p>
    </div>)}
    <Button size="sm" onClick={() => onChange([...rules, ruleShape(conditions ? 'class' : 'giveItem')])}>{t('common:flam.rule.add')}</Button>
  </section>;
}
