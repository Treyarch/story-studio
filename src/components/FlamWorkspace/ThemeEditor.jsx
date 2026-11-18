import { useCommonTranslation } from '../../i18n/commonPresentation.js';
import { FLAM_COLOR_FIELDS, screenColors } from '../../store/flamAdventure/theme.js';
import { CheckField, Field } from './Fields.jsx';

export function ThemeEditor({ document, screen = null, path = '/theme', onChange }) {
  const { t } = useCommonTranslation();
  const colors = screen ? screen.colors ?? {} : document.theme ?? {};
  const effective = screenColors(document, screen);
  const labels = { background: t('common:flam.theme.background'), text: t('common:flam.theme.text'), selection: t('common:flam.theme.selection') };
  function change(field, value) {
    const next = { ...colors };
    if (value === undefined) delete next[field];
    else next[field] = value;
    onChange(next);
  }
  return <details className="card flam-card" data-flam-path={path} open>
    <summary>{screen ? t('common:flam.theme.overrides') : t('common:flam.theme.title')}</summary>
    {FLAM_COLOR_FIELDS.map(field => <div key={field}>
      {screen && <CheckField label={t('common:flam.theme.override', { color: labels[field] })}
        checked={Object.hasOwn(colors, field)} onChange={enabled => change(field, enabled ? effective[field] : undefined)} />}
      <Field label={labels[field]} path={`${path}/${field}`}>{id => <div className="flam-color-input">
        <input type="color" aria-labelledby={id} value={effective[field]} disabled={Boolean(screen && !Object.hasOwn(colors, field))}
          onChange={event => change(field, event.target.value)} />
        <input id={`${id}-control`} aria-labelledby={id} value={colors[field] ?? effective[field]} spellCheck={false}
          disabled={Boolean(screen && !Object.hasOwn(colors, field))} onChange={event => change(field, event.target.value)} />
      </div>}</Field>
    </div>)}
  </details>;
}
