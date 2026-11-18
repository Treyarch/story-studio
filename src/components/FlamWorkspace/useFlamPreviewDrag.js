import { useEffect, useRef, useState } from 'react';

// La position appartient au graphe, afin de survivre au changement d’écran aperçu.
export function useFlamPreviewDrag(hostRef, selectionKey, visible = true) {
  const panelRef = useRef(null);
  const positionRef = useRef(null);
  const drag = useRef(null);
  const [position, setPosition] = useState(null);

  function moveTo(point) {
    const host = hostRef.current, panel = panelRef.current;
    if (!host || !panel) return;
    const next = {
      x: Math.max(0, Math.min(point.x, host.clientWidth - panel.offsetWidth)),
      y: Math.max(0, Math.min(point.y, host.clientHeight - panel.offsetHeight)),
    };
    if (positionRef.current?.x === next.x && positionRef.current?.y === next.y) return;
    positionRef.current = next;
    setPosition(next);
  }

  function currentPosition() {
    if (positionRef.current) return positionRef.current;
    const host = hostRef.current.getBoundingClientRect();
    const panel = panelRef.current.getBoundingClientRect();
    return { x: panel.left - host.left - hostRef.current.clientLeft, y: panel.top - host.top - hostRef.current.clientTop };
  }

  useEffect(() => {
    const host = hostRef.current, panel = panelRef.current;
    if (!visible || !host || !panel) return;
    const constrain = () => moveTo(currentPosition());
    constrain();
    const observer = new ResizeObserver(constrain);
    observer.observe(host);
    observer.observe(panel);
    return () => { observer.disconnect(); drag.current = null; };
  }, [hostRef, selectionKey, visible]);

  function endDrag(event) {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return {
    panelRef,
    panelStyle: position ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' } : undefined,
    dragHandleProps: {
      onPointerDown(event) {
        if (!event.isPrimary || event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.focus({ preventScroll: true });
        drag.current = { ...currentPosition(), clientX: event.clientX, clientY: event.clientY, pointerId: event.pointerId };
        event.currentTarget.setPointerCapture(event.pointerId);
      },
      onPointerMove(event) {
        const start = drag.current;
        if (!start || start.pointerId !== event.pointerId) return;
        event.preventDefault();
        event.stopPropagation();
        moveTo({ x: start.x + event.clientX - start.clientX, y: start.y + event.clientY - start.clientY });
      },
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onLostPointerCapture() { drag.current = null; },
      onKeyDown(event) {
        const step = event.shiftKey ? 40 : 10;
        const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key];
        if (!delta) return;
        event.preventDefault();
        event.stopPropagation();
        const current = currentPosition();
        moveTo({ x: current.x + delta[0], y: current.y + delta[1] });
      },
    },
  };
}
