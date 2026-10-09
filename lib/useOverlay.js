'use client';

import { useEffect, useRef } from 'react';

/**
 * Shared overlay behaviour for dialogs/drawers: Escape closes, focus moves to
 * `focusRef` when it opens, and returns to whatever opened it when it closes.
 * `onClose` is read through a ref because callers pass inline functions —
 * depending on it would re-run the effect on every parent render and bounce
 * focus back to the opener while the overlay is still open.
 */
export function useOverlay(open, onClose, focusRef) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') onCloseRef.current?.(); };
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => focusRef?.current?.focus(), 60);
    return () => {
      document.removeEventListener('keydown', onKey);
      clearTimeout(t);
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus();
    };
  }, [open, focusRef]);
}
