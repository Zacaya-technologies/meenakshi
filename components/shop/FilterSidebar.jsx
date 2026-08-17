'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon, AnyIcon } from '@/components/ui/Icons';

function FacetGroup({ label, icon, options, selected, onToggle, searchable }) {
  const [open, setOpen] = useState(true);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    if (!q) return options;
    return options.filter(o => o.name.toLowerCase().includes(q.toLowerCase()));
  }, [options, q]);

  return (
    <div className="border-b border-border last:border-none dark:border-white/10">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-2 py-3.5 text-left"
      >
        <span className="flex items-center gap-2 text-[13px] font-bold text-ink dark:text-white">
          {icon}
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
                  const isSel = selected.includes(opt.slug);
                  return (
                    <li key={opt.slug}>
                      <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-slate-600 transition hover:text-brand-blue dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => onToggle(opt.slug)}
                          className="h-4 w-4 cursor-pointer rounded accent-brand-blue"
                        />
                        <span className="truncate">{opt.name}</span>
                        {typeof opt.count === 'number' && (
                          <span className="ml-auto shrink-0 text-[11px] text-slate-400">{opt.count}</span>
                        )}
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

// Every facet group (Area/Size/Design/Type/Finish/Color) is rendered straight
// from /api/v1/products/facets — a brand-new category created in the admin
// panel shows up here immediately, with no frontend change required.
export default function FilterSidebar({ facets, selected, onToggle, onPriceChange, onClear }) {
  const dynamicGroups = facets.groups || [];

  const groups = [
    { key: 'brand', label: 'Brand', icon: <Icon.gem className="h-4 w-4" />, options: (facets.brands || []).map(b => ({ slug: b.slug, name: b.name })), searchable: (facets.brands || []).length > 8 },
    { key: 'collection', label: 'Collection', icon: <Icon.layers className="h-4 w-4" />, options: (facets.collections || []).map(c => ({ slug: c.slug, name: c.name })), searchable: (facets.collections || []).length > 8 },
    ...dynamicGroups.map(g => ({
      key: g.key,
      label: g.name,
      icon: <AnyIcon id={g.icon} className="h-4 w-4" />,
      options: (g.items || []).map(i => ({ slug: i.slug, name: i.name, count: i.count })),
      searchable: (g.items || []).length > 8
    }))
  ];

  const activeCount = Object.entries(selected).reduce((a, [k, v]) => {
    if (k === 'category' || k === 'q' || k === 'min_price' || k === 'max_price') return a;
    return a + (Array.isArray(v) ? v.length : 0);
  }, 0);

  const priceRange = facets.priceRange || { min: 0, max: 500 };

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

      {/* Price range */}
      <div className="border-b border-border py-3.5 dark:border-white/10">
        <span className="mb-2.5 flex items-center gap-2 text-[13px] font-bold text-ink dark:text-white">
          <Icon.bag className="h-4 w-4" /> Price (₹/sq.ft)
        </span>
        <form
          className="flex items-center gap-2"
          onSubmit={e => {
            e.preventDefault();
            const form = e.target;
            onPriceChange(form.min.value, form.max.value);
          }}
        >
          <input
            name="min"
            type="number"
            defaultValue={selected.min_price || ''}
            placeholder={String(priceRange.min)}
            className="w-full rounded-lg border-[1.5px] border-border bg-brand-light px-2.5 py-2 text-xs text-ink outline-none transition focus:border-brand-blue dark:bg-navy dark:text-white dark:border-white/10"
          />
          <span className="text-slate-400">–</span>
          <input
            name="max"
            type="number"
            defaultValue={selected.max_price || ''}
            placeholder={String(priceRange.max)}
            className="w-full rounded-lg border-[1.5px] border-border bg-brand-light px-2.5 py-2 text-xs text-ink outline-none transition focus:border-brand-blue dark:bg-navy dark:text-white dark:border-white/10"
          />
          <button type="submit" className="shrink-0 rounded-lg bg-brand-blue px-3 py-2 text-xs font-bold text-white">Go</button>
        </form>
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

      {/* Availability */}
      <FacetGroup
        label="Availability"
        icon={<Icon.package className="h-4 w-4" />}
        options={[{ slug: '1', name: 'In Stock' }]}
        selected={selected.in_stock || []}
        searchable={false}
        onToggle={(v) => onToggle('in_stock', v)}
      />
    </aside>
  );
}
