import { useId } from 'react';
import { useCommonTranslation } from '../../i18n/commonPresentation.js';

export function Field({ label, path, children }) {
  const id = useId();
  return <div className="flam-field" data-flam-path={path} tabIndex={-1}>
    <label id={id} htmlFor={`${id}-control`}>{label}</label>
    {children(id)}
  </div>;
}

export function TextField({ label, path, value, onChange, multiline = false }) {
  const Control = multiline ? 'textarea' : 'input';
  return <Field label={label} path={path}>{id => <Control id={`${id}-control`} aria-labelledby={id} value={value} onChange={event => onChange(event.target.value)} />}</Field>;
}

export function NumberField({ label, path, value, onChange }) {
  return <Field label={label} path={path}>{id => <input type="number" step="1" id={`${id}-control`} aria-labelledby={id} value={value} onChange={event => onChange(Number(event.target.value))} />}</Field>;
}

export function ReferenceField({ label, path, value, entries, onChange }) {
  const { t } = useCommonTranslation();
  const missing = value !== null && !entries.some(entry => entry.id === value);
  return <Field label={label} path={path}>{id => <select id={`${id}-control`} aria-labelledby={id} value={value ?? ''} onChange={event => onChange(event.target.value || null)}>
    <option value="">{t('common:flam.reference.none')}</option>
    {missing && <option value={value}>{t('common:flam.reference.missing', { id: value })}</option>}
    {entries.map(entry => <option key={entry.id} value={entry.id}>{entry.title || entry.name || entry.label || t('common:flam.untitled')}</option>)}
  </select>}</Field>;
}

export function CheckField({ label, path, checked, onChange }) {
  return <label className="flam-check" data-flam-path={path} tabIndex={-1}>
    <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />{label}
  </label>;
}
