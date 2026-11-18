import { useCommonTranslation } from '../../i18n/commonPresentation.js';
import { Field } from './Fields.jsx';

export function IllustrationModeField({ value, path, onChange }) {
  const { t } = useCommonTranslation();
  return <>
    <Field label={t('common:flam.illustration.mode')} path={path}>{id => <select id={`${id}-control`} aria-labelledby={id} value={value ?? 'common'} onChange={event => onChange(event.target.value)}>
      <option value="common">{t('common:flam.illustration.common')}</option>
      <option value="selection">{t('common:flam.illustration.selection')}</option>
    </select>}</Field>
    {value === 'selection' && <p className="flam-hint">{t('common:flam.illustration.help')}</p>}
  </>;
}
