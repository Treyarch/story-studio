import { presentCommon, translateCommon as t, useCommonTranslation } from '../../i18n/commonPresentation.js';
import { Tooltip } from '../common/Tooltip.jsx';
import './Toolbar.css';

export function ToolbarIcon({ Icon, className = 'chrome-icon' }) {
  return <Icon className={className} aria-hidden="true" strokeWidth={2} absoluteStrokeWidth />;
}

// L'infobulle d'une commande : son libellé et son raccourci quand elle répond,
// **la raison** quand elle ne répond pas. Une commande suspendue reste visible
// et dit pourquoi ; c'est le comportement acquis de la barre avancée.
export function commandTitle(entry) {
  if (!entry) return '';
  const label = entry.shortcut
    ? t('common:toolbar.shortcut.tooltip', { label: entry.label, shortcut: entry.shortcut })
    : entry.label;
  return entry.available ? label : t('common:toolbar.command.unavailable', { label, reason: presentCommon(entry.unavailableReason) });
}

// Un bouton piloté par une entrée d'inventaire : libellé, raccourci,
// disponibilité et raison viennent tous de la même source que le clavier.
// Exporté : l'en-tête du panneau Graphe porte désormais les commandes de
// création, et elles doivent rester **le même bouton** que dans cette barre.
// Les réimiter ailleurs les aurait fait diverger au premier changement de style.
export function CommandButton({ entry, onClick, Icon, iconOnly = false, className = null }) {
  useCommonTranslation();
  if (!entry) return null;
  const title = commandTitle(entry);
  return (
    <Tooltip text={title}>
      <button
        type="button"
        data-toolbar-id={entry.id}
        className={`chrome-toolbar-btn ${iconOnly ? 'is-icon-only' : ''} ${className ?? ''}`}
        onClick={onClick}
        disabled={!entry.available}
        aria-label={title}
      >
        <span className="chrome-toolbar-btn-icon"><ToolbarIcon Icon={Icon} /></span>
        {!iconOnly ? <span className="chrome-toolbar-btn-label">{entry.label}</span> : null}
      </button>
    </Tooltip>
  );
}
