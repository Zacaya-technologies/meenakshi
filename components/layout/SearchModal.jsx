'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { API, FALLBACK_IMG, formatPrice, hasPrice } from '@/lib/api';
import { Icon } from '@/components/ui/Icons';
import { useOverlay } from '@/lib/useOverlay';

export default function SearchModal({ open, onClose }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  // The query the current suggestions belong to — "no results" is only shown
  // once the response for what is typed has actually arrived.
  const [resultsFor, setResultsFor] = useState('');
  const inputRef = useRef(null);
  useOverlay(open, onClose, inputRef);

  useEffect(() => {
    if (open) {
      setQ('');
      setSuggestions([]);
      setResultsFor('');
    }
  }, [open]);

  useEffect(() => {
    if (!q || q.length < 2) {
      setSuggestions([]);
      setResultsFor('');
      return;
    }
    let stale = false;
    const t = setTimeout(async () => {
      const res = await API.getSuggestions(q).catch(() => null);
      if (stale) return; // a newer keystroke superseded this request
      setSuggestions(res?.success ? res.suggestions : []);
      setResultsFor(q);
    }, 220);
    return () => { stale = true; clearTimeout(t); };
  }, [q]);

  const go = (url) => {
    onClose();
    router.push(url);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[2000] flex justify-center bg-navy/60 px-4 pt-24 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-label="Search products"
            className="h-fit w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-navy2"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2 font-heading text-lg font-bold text-ink dark:text-white">
                <Icon.search className="h-5 w-5 text-brand-blue" /> Instant Tile Search
              </span>
              <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-ink dark:bg-white/10 dark:text-white" aria-label="Close">
                <Icon.close className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-border px-4 py-3 transition focus-within:border-brand-blue focus-within:shadow-[0_0_0_3px_rgba(30,167,253,0.15)]">
              <Icon.search className="h-5 w-5 text-brand-blue" />
              <input
                ref={inputRef}
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && q.trim()) go(`/shop?q=${encodeURIComponent(q.trim())}`);
                }}
                placeholder="Search Statuario, Wood Plank, Vitrified, 600x1200..."
                className="w-full bg-transparent text-base text-ink outline-none placeholder:text-slate-400 dark:text-white"
              />
            </div>

            {suggestions.length > 0 && (
              <div className="mt-3 flex flex-col">
                {suggestions.map(s => (
                  <button
                    key={`${s.kind}-${s.id}`}
                    onClick={() => go(s.url)}
                    className="flex items-center gap-4 rounded-xl px-3 py-2.5 text-left transition hover:bg-brand-light dark:hover:bg-white/5"
                  >
                    <img src={s.image || FALLBACK_IMG} alt={s.name} className="h-12 w-12 rounded-lg object-cover" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink dark:text-white">{s.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{s.kind === 'category' ? `${(s.group_name || 'Category').replace(/^By\s+/i, '')}${s.count ? ` · ${s.count} products` : ''}` : s.size}</div>
                    </div>
                    {s.kind === 'product' ? (
                      <span className={`shrink-0 text-sm ${hasPrice(s) ? 'font-bold text-brand-blue' : 'text-slate-500 dark:text-slate-400'}`}>{formatPrice(s)}</span>
                    ) : (
                      <span className="rounded-full bg-brand-blue/10 px-2.5 py-1 text-[11px] font-bold text-brand-blue">Category</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {q.length >= 2 && resultsFor === q && suggestions.length === 0 && (
              <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                No quick matches for “{q}” — press Enter to search the full catalogue.
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

