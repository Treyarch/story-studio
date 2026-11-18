import { useState } from 'react';
import { useCommonTranslation } from '../../i18n/commonPresentation.js';
import { Button } from '../common/Button.jsx';
import { useLocalFile } from '../../hooks/useLocalFile.js';
import { screenPreview } from '../../store/flamAdventure/theme.js';

export function PreviewGridCell({ item, index, selected, colors }) {
  const image = useLocalFile(item.image);
  const x = 12 + (index % 2) * 152, y = 48 + Math.floor(index / 2) * 70;
  return <g>
    <rect x={x} y={y} width="144" height="68" fill={selected ? colors.selection : colors.background} />
    {image && <image href={image} x={x + 48} y={y + 2} width="48" height="40" preserveAspectRatio="xMinYMin meet" />}
    <text x={x + 2} y={y + 60} fontSize="16" fill={selected ? colors.background : colors.text}>{`${selected ? '> ' : '  '}${item.name}`.slice(0, 15)}</text>
  </g>;
}

function textLines(value, width) {
  const lines = [];
  for (const paragraph of value.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (Array.from(`${line} ${word}`).length > width && line) { lines.push(line); line = ''; }
      for (const glyph of Array.from((line ? ' ' : '') + word)) {
        if (Array.from(line).length === width) { lines.push(line); line = ''; }
        line += glyph;
      }
    }
    lines.push(line);
  }
  return lines;
}

// Les coordonnées reprennent le gabarit 320 × 212 du lecteur, sans jouer une partie.
export function FlamScreenPreview({ document, collection, id, panelRef, panelStyle, dragHandleProps }) {
  const { t } = useCommonTranslation();
  const [selection, setSelection] = useState(0);
  const [textOffset, setTextOffset] = useState(0);
  const [showText, setShowText] = useState(false);
  const view = screenPreview(document, collection, id, {
    missing: t('common:flam.untitled'), resume: t('common:flam.theme.resume'),
    menu: t('common:flam.theme.menu'), back: t('common:flam.theme.back'),
    restart: t('common:flam.theme.restart'), library: t('common:flam.theme.library'), inventory: t('common:flam.theme.inventory'), empty: t('common:flam.grid.empty'), emptyCollection: t('common:flam.collection.empty'), listen: t('common:flam.detail.listen'),
  }, selection);
  const image = useLocalFile(view?.image);
  if (!view) return null;
  const current = Math.min(selection, view.options.length - 1);
  const offset = Math.floor(current / (view.layout === 'grid' ? 4 : 3)) * (view.layout === 'grid' ? 4 : 3);
  const detail = view.layout === 'detail';
  const split = detail && view.detailLayout === 'split' && Boolean(view.image);
  const reading = view.detailLayout !== 'fullImage' || showText || !view.image;
  const lines = textLines(view.text, detail ? (split ? 9 : 18) : (view.enhanced ? 12 : 18));
  const maximum = Math.max(0, lines.length - 7);
  const scroll = Math.min(textOffset, maximum);
  const detailCommand = view.audio ? t('common:flam.detail.listen')
    : view.detailLayout === 'fullImage' && view.image && view.text ? (reading ? t('common:flam.detail.seeImage') : t('common:flam.detail.readText')) : t('common:flam.theme.back');
  return <aside ref={panelRef} style={panelStyle} className="flam-screen-preview" aria-label={t('common:flam.theme.preview')}>
    {dragHandleProps ? <button type="button" className="flam-screen-preview__handle" title={t('common:flam.theme.movePreview')} aria-label={t('common:flam.theme.movePreview')} {...dragHandleProps}>
      <span aria-hidden="true">⠿</span> {t('common:flam.theme.preview')}
    </button> : <strong>{t('common:flam.theme.preview')}</strong>}
    <svg viewBox="0 0 320 212" role="img" aria-label={view.title || t('common:flam.untitled')} style={{ background: view.colors.background, color: view.colors.text }}>
      {view.enhanced && <text x="12" y="14" fontSize="12" fill="currentColor">{document.title.slice(0, 45)}</text>}
      <text x="12" y={view.enhanced ? 40 : 28} fontSize="20" fill="currentColor">{view.title.slice(0, 27)}</text>
      {view.layout === 'grid' && view.entries.length > 0 ? <>{view.entries.slice(offset, offset + 4).map((item, index) => <PreviewGridCell
        key={item.id} item={item} index={index} selected={offset + index === current} colors={view.colors} />)}
        <text x="12" y="207" fontSize="12" fill="currentColor">{`${Math.floor(current / 4) + 1} / ${Math.ceil(view.entries.length / 4)}`}</text></> : detail ? <>
        {image && (view.detailLayout !== 'fullImage' || !reading) && <image href={image} x="12" y="48" width={view.detailLayout === 'fullImage' ? 296 : 140} height="140" preserveAspectRatio="xMinYMin meet" />}
        {reading && lines.slice(scroll, scroll + 7).map((line, index) => <text key={index} x={split ? 164 : 12} y={64 + index * 20} fontSize="16" fill="currentColor">{line}</text>)}
        <text x="12" y="207" fontSize="12" fill={view.colors.selection}>{detailCommand}</text>
      </> : <>
      {lines.slice(0, 2).map((line, i) => <text x="12" y={64 + 20 * i} fontSize="16" fill="currentColor" key={i}>{line}</text>)}
      {image && <image href={image} x="224" y="55" width="84" height="48" preserveAspectRatio="xMinYMin meet" />}
      {(view.layout === 'detail' ? [t('common:flam.theme.back')] : view.options).slice(view.layout === 'detail' ? 0 : offset, view.layout === 'detail' ? 1 : offset + 3).map((option, index) => <text x="12" y={128 + index * 29} fontSize="16" key={offset + index}
        fill={view.layout === 'detail' || offset + index === current ? view.colors.selection : view.colors.text}>{`${view.layout === 'detail' || offset + index === current ? '> ' : '  '}${option}`.slice(0, 25)}</text>)}
      </>}
    </svg>
    {detail && view.detailLayout === 'fullImage' && view.image && view.text && <Button size="sm" onClick={() => setShowText(value => !value)}>{reading ? t('common:flam.detail.seeImage') : t('common:flam.detail.readText')}</Button>}
    {detail && reading && maximum > 0 && <input type="range" min="0" max={maximum} value={scroll} aria-label={t('common:flam.detail.scrollPreview')} onChange={event => setTextOffset(Number(event.target.value))} />}
    {(!detail || view.entries) && <select aria-label={t('common:flam.theme.previewChoice')} value={current} onChange={event => setSelection(Number(event.target.value))}>
      {view.options.map((option, index) => <option key={index} value={index}>{option || t('common:flam.untitled')}</option>)}
    </select>}
    {view.entries && <small>{view.collection ? t('common:flam.collection.previewHelp') : t('common:flam.grid.previewHelp')}</small>}
    {view.character && <small>{t('common:flam.character.previewHelp')}</small>}
    {view.audio && <small>{t('common:flam.scene.audio')}: {view.audio.split(/[\\/]/).at(-1)}</small>}
  </aside>;
}
