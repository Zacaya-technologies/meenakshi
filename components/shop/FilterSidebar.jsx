'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icons';

const FACET_GROUPS = [
  { key: 'category', label: 'Category', values: [] },
  { key: 'material', label: 'Material', values: [] },
  { key: 'finish', label: 'Finish', values: [] },
  { key: 'color', label: 'Color', values: [] },
  { key: 'price', label: 'Price', values: [] },
  { key: 'brand', label: 'Brand', values: [] },
  { key: 'availability', label: 'Availability', values: [] },
  { key: 'size', label: 'Tile Size', values: [] },
  { key: 'application', label: 'Application', values: [] }
];

function FacetGroup({ label, icon, options, selected, onToggle, onClear, searchable }) {
  const [open, setOpen] = useState(true);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    if (!q) return options;
    return options.filter(o => String(o).toLowerCase().includes(q.toLowerCase()));
  }, [options, q]);

  return (
    <div className="border-b border-border last:border-none dark:border-white/10">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-2 py-3.5 text-left"
      >
        <span className="flex items-center gap-2 text-[13px] font-bold text-ink dark:text-white">
          {icon && <span className="text-brand-blue">{icon}</span>}
          {label}
        </span>
        <Icon.chevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-250 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="pb-3">
              {searchable && (
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder={`Search ${label.toLowerCase()}...`}
                  className="mb-2 w-full rounded-lg border-[1.5px] border-border bg-brand-light px-3 py-2 text-xs text-ink outline-none transition focus:border-brand-blue dark:bg-navy dark:text-white dark:border-white/10"
                />
              )}

              <ul className="flex max-h-[200px] flex-col gap-2 overflow-y-auto pr-1">
                {filtered.map(opt => {
                  const isSel = selected.includes(opt);
                  return (
                    <li key={opt}>
                      <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-slate-600 transition hover:text-brand-blue dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => onToggle(opt)}
                          className="h-4 w-4 cursor-pointer rounded accent-brand-blue"
                        />
                        <span className="truncate">{opt}</span>
                      </label>
                    </li>
                  );
                })}
                {filtered.length === 0 && <li className="text-xs text-slate-400">No options</li>}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FilterSidebar({ facets, selected, onToggle, onClear }) {
  const groups = [
    { label: 'Category', icon: <Icon.grid className="h-4 w-4" />, key: 'category', options: facets.categories?.map(c => c.name) || [], searchable: true },
    { label: 'Material', icon: <Icon.stack className="h-4 w-4" />, key: 'material', options: facets.materials || [], searchable: true },
    { label: 'Finish', icon: <Icon.brush className="h-4 w-4" />, key: 'finish', options: facets.finishes || [], searchable: true },
    { label: 'Color', icon: <Icon.contrast className="h-4 w-4" />, key: 'color', options: facets.colors || [], searchable: true },
    { label: 'Brand', icon: <Icon.gem className="h-4 w-4" />, key: 'brand', options: facets.brands?.map(b => b.name) || [], searchable: true },
    { label: 'Availability', icon: <Icon.bag className="h-4 w-4" />, key: 'availability', options: facets.availability || ['In Stock'], searchable: false },
    { label: 'Tile Size', icon: <Icon.ruler className="h-4 w-4" />, key: 'size', options: facets.sizes || [], searchable: true },
    { label: 'Application', icon: <Icon.mapPin className="h-4 w-4" />, key: 'application', options: facets.applications || [], searchable: true }
  ];

  const activeCount = Object.values(selected).reduce((a, v) => a + (Array.isArray(v) ? v.length : 0), 0);

  // Sticky offset is derived from the --header-h token so the sidebar stays
  // clear of the navbar if the header rows ever change height.
  return (
    <aside className="scrollbar-mega mb-6 rounded-[20px] border-[1.5px] border-border bg-white p-5 shadow-card lg:sticky lg:top-[calc(var(--header-h)+16px)] lg:mb-0 lg:max-h-[calc(100vh-var(--header-h)-32px)] lg:overflow-y-auto dark:bg-navy2 dark:border-white/10">
      <div className="mb-3 flex items-center justify-between border-b border-border pb-4 dark:border-white/10">
        <h4 className="flex items-center gap-2 font-heading text-[15px] font-bold text-ink dark:text-white">
          <Icon.filter className="h-4 w-4 text-brand-blue" /> Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-brand-blue px-2 py-0.5 text-[11px] font-extrabold text-white">{activeCount}</span>
          )}
        </h4>
        {activeCount > 0 && (
          <button onClick={onClear} className="text-xs font-medium text-slate-400 transition hover:text-brand-blue">
            Clear all
          </button>
        )}
      </div>

      {groups.map(g => (
        <FacetGroup
          key={g.key}
          label={g.label}
          icon={g.icon}
          options={g.options}
          selected={selected[g.key] || []}
          searchable={g.searchable}
          onToggle={(v) => onToggle(g.key, v)}
        />
      ))}
    </aside>
  );
}
