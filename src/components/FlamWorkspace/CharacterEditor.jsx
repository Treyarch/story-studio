import { useCommonTranslation } from '../../i18n/commonPresentation.js';
import { Button } from '../common/Button.jsx';
import { TextField } from './Fields.jsx';
import { RuleEditor } from './RuleEditor.jsx';

export function CharacterEditor({ information, document, path, onChange }) {
  const { t } = useCommonTranslation();
  const update = (index, patch) => onChange(information.map((info, i) => i === index ? { ...info, ...patch } : info));
  return <section data-flam-path={path}>
    <p className="flam-hint">{t('common:flam.character.help')}</p>
    {information.map((info, index) => <section className="card flam-card" key={info.id} data-flam-path={`${path}/${index}`}>
      <TextField multiline label={t('common:flam.character.information')} path={`${path}/${index}/text`} value={info.text} onChange={text => update(index, { text })} />
      <RuleEditor conditions rules={info.conditions} document={document} path={`${path}/${index}/conditions`} onChange={conditions => update(index, { conditions })} />
      <Button size="sm" onClick={() => onChange(information.filter((_, i) => i !== index))}>{t('common:flam.character.removeInformation')}</Button>
    </section>)}
    <Button onClick={() => onChange([...information, { id: crypto.randomUUID(), text: '', conditions: [] }])}>{t('common:flam.character.addInformation')}</Button>
  </section>;
}
