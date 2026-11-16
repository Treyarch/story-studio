import { useState } from 'react';
import { useCommonTranslation } from '../../i18n/commonPresentation.js';
import { AdvancedDialog } from '../AdvancedWorkspace/AdvancedDialog.jsx';
import { TextField } from './Fields.jsx';

export function FlamLinkDialog({ drop, onCancel, onCreate }) {
  const { t } = useCommonTranslation();
  const [collection, setCollection] = useState('scenes');
  const [name, setName] = useState('');
  return <AdvancedDialog title={t('common:flam.graph.port.createTitle')}
    onCancel={onCancel} confirmDisabled={!name.trim()}
    confirmLabel={t('common:flam.graph.port.createAction')} onConfirm={() => onCreate(collection, name.trim())}>
    <label className="flam-field">{t('common:flam.choice.transition')}
      <select value={collection} onChange={event => setCollection(event.target.value)}>
        <option value="scenes">{t('common:flam.scenes')}</option>
        {drop.port.kind !== 'outcome' && <option value="rolls">{t('common:flam.rolls')}</option>}
      </select>
    </label>
    <TextField label={t('common:flam.name')} value={name} onChange={setName} />
  </AdvancedDialog>;
}
