import { useId, useLayoutEffect, useRef, useState } from 'react';

const TABS = ['adventure', 'selection'];

// Ce hook vit dans l’atelier (indexé par projectEpoch), pas dans le panneau
// démonté à sa fermeture. Son état ne fait pas partie de l’aventure.
export function useFlamInspector(showInspector, rootRef) {
  const id = useId();
  const [activeTab, setActiveTab] = useState('adventure');
  const [focusPath, setFocusPath] = useState(null);
  const adventureRef = useRef(null);
  const selectionRef = useRef(null);
  const panels = { adventure: adventureRef, selection: selectionRef };
  const scroll = useRef({ adventure: 0, selection: 0 });

  useLayoutEffect(() => {
    if (!showInspector) return;
    const panel = activeTab === 'adventure' ? adventureRef.current : selectionRef.current;
    if (panel) panel.scrollTop = scroll.current[activeTab];
  }, [activeTab, showInspector]);

  useLayoutEffect(() => {
    if (!focusPath || !showInspector) return;
    const panel = activeTab === 'adventure' ? adventureRef.current : selectionRef.current;
    const targets = [...(panel ?? rootRef.current)?.querySelectorAll('[data-flam-path]') ?? []];
    let targetPath = focusPath;
    let target;
    while (targetPath && !target) {
      target = targets.find(element => element.dataset.flamPath === targetPath);
      targetPath = targetPath.slice(0, targetPath.lastIndexOf('/'));
    }
    if (target) {
      for (let parent = target.parentElement; parent; parent = parent.parentElement) {
        if (parent.tagName === 'DETAILS') parent.open = true;
      }
      target.scrollIntoView?.({ block: 'center' });
      (target.querySelector('input, select, textarea, button') ?? target).focus();
      if (panel) scroll.current[activeTab] = panel.scrollTop;
    }
    setFocusPath(null);
  }, [focusPath, activeTab, showInspector, rootRef]);

  const tabProps = tab => ({
    id: `${id}-${tab}-tab`,
    role: 'tab',
    type: 'button',
    'aria-selected': activeTab === tab,
    'aria-controls': `${id}-${tab}-panel`,
    tabIndex: activeTab === tab ? 0 : -1,
    onClick: () => setActiveTab(tab),
    onKeyDown: event => {
      let next;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') next = TABS[1 - TABS.indexOf(tab)];
      if (event.key === 'Home') next = TABS[0];
      if (event.key === 'End') next = TABS.at(-1);
      if (!next) return;
      event.preventDefault();
      event.stopPropagation();
      setActiveTab(next);
      event.currentTarget.parentElement.children[TABS.indexOf(next)].focus();
    },
  });
  const panelProps = tab => ({
    id: `${id}-${tab}-panel`,
    role: 'tabpanel',
    'aria-labelledby': `${id}-${tab}-tab`,
    hidden: activeTab !== tab,
    ref: panels[tab],
    onScroll: event => {
      // Masquer un panneau peut ramener son scrollTop à zéro dans le navigateur.
      if (activeTab === tab && showInspector) scroll.current[tab] = event.currentTarget.scrollTop;
    },
  });

  return { tabProps, panelProps, showSelection: () => setActiveTab('selection'),
    reveal: (tab, path) => { setActiveTab(tab); setFocusPath(path); } };
}
