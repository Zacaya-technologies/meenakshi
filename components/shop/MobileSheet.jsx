'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icons';

// Bottom sheet used on small screens for Filters / Sort — the desktop
// sidebar/select stay untouched; this is purely the <lg mobile presentation.
export default function MobileSheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[2200] flex items-end justify-center bg-navy/60 backdrop-blur-sm lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pt-6 dark:bg-navy2"
            style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
            onClick={e => e.stopPropagation()}
          >
            <span className="absolute left-1/2 top-2.5 h-1 w-10 -translate-x-1/2 rounded-full bg-slate-300 dark:bg-white/20" />
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-base font-bold text-ink dark:text-white">{title}</h3>
              <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-ink dark:bg-white/10 dark:text-white" aria-label="Close">
                <Icon.close className="h-4.5 w-4.5" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
