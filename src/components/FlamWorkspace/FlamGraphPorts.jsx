import { useEffect, useRef, useState } from 'react';
import { useCommonTranslation } from '../../i18n/commonPresentation.js';
import { GraphLinkPort } from '../AdvancedGraphCanvas/GraphLinkPort.jsx';
import { linkHandlePx } from '../AdvancedGraphCanvas/nodeOverlayMetrics.js';
import { Plus } from '../icons/LucideLocal.jsx';
import { createFlamLinkDrag, flamLinkDraftPath } from './flamGraphLinks.js';

export function FlamGraphPorts({ cy, hostRef, document, nodes, zoom, onDrop, onArm, onBegin, onSelect, onHover, onHighlight }) {
  const { t } = useCommonTranslation();
  const runtime = useRef(null);
  const controller = useRef(null);
  const [draft, setDraft] = useState(null);
  useEffect(() => { runtime.current = { document, onDrop }; }, [document, onDrop]);
  useEffect(() => {
    if (!cy || !hostRef.current) return undefined;
    const drag = createFlamLinkDrag({ cy, host: hostRef.current,
      readDocument: () => runtime.current.document, onChange: setDraft,
      onDrop: drop => runtime.current.onDrop(drop) });
    controller.current = drag;
    return () => { drag.destroy(); controller.current = null; };
  }, [cy, hostRef]);

  function hint(port) {
    if (port.kind === 'add') return t('common:flam.choice.add');
    if (port.kind === 'choice') return `${t('common:flam.graph.port.choice', { label: port.label || t('common:flam.untitled') })}${port.conditional ? ` · ${t('common:flam.graph.conditional')}` : ''}`;
    return t('common:flam.graph.port.outcome', { min: port.expected.min, max: port.expected.max });
  }
  return <>
    {draft && <svg className="advanced-link-draft" aria-hidden="true">
      {draft.candidate && <rect x={draft.candidate.x - draft.candidate.width / 2 - 6}
        y={draft.candidate.y - draft.candidate.height / 2 - 6} width={draft.candidate.width + 12} height={draft.candidate.height + 12}
        rx="10" data-reach={draft.valid ? 'valid' : 'invalid'} />}
      <path d={flamLinkDraftPath(draft.anchor, draft.pointer)} />
    </svg>}
    <div className="advanced-node-overlays flam-link-overlays" style={{
      '--link-handle-size': `${linkHandlePx(zoom)}px`, '--port-dot-size': `${Math.max(6, Math.min(10, 7 * zoom))}px`,
    }}>
      {nodes.filter(node => zoom >= 0.3 || node.selected || node.hovered || node.path === draft?.sourcePath || node.path === draft?.candidate?.path).map(node => <div key={node.path}
        className="advanced-node-overlay" data-node-path={node.path}
        data-emphasized={node.selected || node.hovered || node.path === draft?.sourcePath ? 'true' : undefined}
        onPointerEnter={() => onHover?.(node.path)} onPointerLeave={() => onHover?.(null)}
        style={{ width: node.width, height: node.height, transform: `translate3d(${node.x}px, ${node.y}px, 0) translate(-50%, -50%)` }}>
        {(zoom >= 0.6 || (node.selected && zoom >= 0.3)) && (node.start || node.ending || node.collection === 'rolls') &&
          <span className={`flam-node-badge${node.start ? ' is-start' : ''}`}>
            {node.start ? t('common:flam.graph.start') : node.ending ? t('common:flam.graph.ending') : t('common:flam.roll')}
          </span>}
        <div className="advanced-node-overlay__ports">
          {node.ports.map(anchor => <GraphLinkPort key={anchor.key}
            hint={anchor.role === 'arrival' ? t('common:flam.graph.port.arrival') : hint(anchor.port)}
            className={`is-active${anchor.role === 'arrival' ? ' is-arrival' : ''}${anchor.port?.kind === 'add' ? ' is-add' : ''}`}
            style={{ left: `calc(50% + ${anchor.dx}px)`, top: `calc(50% + ${anchor.dy}px)` }}
            onPointerEnter={() => onHighlight?.(node.path, anchor.key)} onPointerLeave={() => onHighlight?.(null)}
            onFocus={() => onHighlight?.(node.path, anchor.key)} onBlur={() => onHighlight?.(null)}
            onPointerDown={anchor.role === 'departure' ? event => { onBegin(); controller.current?.start(event, node, anchor); } : () => {}}
            onClick={event => {
              if (anchor.role === 'arrival') onSelect({ collection: node.collection, id: node.id });
              else if (event.detail === 0) onArm(anchor.port);
            }}>
            {anchor.port?.kind === 'add' && <Plus />}
          </GraphLinkPort>)}
        </div>
      </div>)}
    </div>
    {draft && <p className="advanced-canvas__status" role="status">{draft.candidate && !draft.valid
      ? t('common:flam.graph.port.invalid') : t('common:flam.graph.port.dragHelp')}</p>}
  </>;
}
