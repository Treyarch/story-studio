// Présentation seule : les états et règles de partie restent dans le document.
export function flamGraphStyles(c) {
  return [
    { selector: 'node', style: {
      shape: 'round-rectangle', width: 190, height: 84,
      'background-color': c.background, 'border-color': c.border, 'border-width': 1.5,
      label: 'data(label)', color: c.text, 'font-size': 13, 'font-weight': 500,
      'text-wrap': 'wrap', 'text-max-width': 156, 'text-valign': 'center',
      'text-halign': 'center',
    } },
    { selector: 'node[collection = "rolls"]', style: { shape: 'diamond', width: 170, height: 110, 'background-color': c.action } },
    { selector: 'node[?start]', style: { 'border-color': c.accent, 'border-width': 2 } },
    { selector: 'node[?ending]', style: { 'border-style': 'double', 'border-width': 4 } },
    { selector: 'node:selected', style: {
      'border-color': c.accent, 'border-width': 2.5,
      'underlay-color': c.accent, 'underlay-opacity': 0.12, 'underlay-padding': 5,
    } },
    { selector: 'edge', style: {
      width: 1.5, 'line-color': c.muted, 'target-arrow-color': c.muted,
      'target-arrow-shape': 'triangle', 'arrow-scale': 0.85,
      'curve-style': 'unbundled-bezier', 'edge-distances': 'node-position',
      'control-point-weights': [0.25, 0.75], 'control-point-distances': [40, -40],
      'control-point-step-size': 76,
      label: 'data(label)', color: c.text, 'font-size': 11,
      'text-wrap': 'wrap', 'text-max-width': 126,
      'text-background-color': c.surface, 'text-background-opacity': 0.96,
      'text-background-padding': 5, 'text-background-shape': 'roundrectangle',
      'text-border-color': c.border, 'text-border-width': 1, 'text-border-opacity': 0.7,
      'text-margin-y': -9,
      'loop-direction': '0deg', 'loop-sweep': '-110deg',
    } },
    { selector: 'edge[?conditional]', style: { 'line-style': 'dashed', 'line-dash-pattern': [5, 4] } },
    { selector: 'edge[?selfLoop]', style: {
      label: '', opacity: 0.55, 'curve-style': 'bezier', 'control-point-step-size': 140,
    } },
    { selector: 'edge:selected, edge.is-hovered, edge.is-port-focused', style: {
      width: 2.2, opacity: 1, 'line-color': c.accent, 'target-arrow-color': c.accent,
      'text-border-color': c.accent,
    } },
    { selector: 'edge[?selfLoop]:selected, edge[?selfLoop].is-hovered, edge[?selfLoop].is-port-focused', style: { label: 'data(label)', 'text-margin-y': -12 } },
  ];
}
