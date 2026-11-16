import { Tooltip } from '../common/Tooltip.jsx';

// La même prise de lien dans les deux ateliers : taille, infobulle et gestes.
export function GraphLinkPort({ hint, label = hint, onPointerDown, onClick, children, ...props }) {
  return <Tooltip text={hint} asChild wrap>
    <button type="button" {...props} aria-label={label}
      onPointerDown={onPointerDown ? event => {
        event.preventDefault(); event.stopPropagation(); onPointerDown(event);
      } : undefined}
      onClick={onClick ? event => {
        event.preventDefault(); event.stopPropagation(); onClick(event);
      } : undefined}>
      {children}
    </button>
  </Tooltip>;
}
