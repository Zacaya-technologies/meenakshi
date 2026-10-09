'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { API, FALLBACK_IMG, formatPrice, hasPrice } from '@/lib/api';
import { Icon, AnyIcon } from '@/components/ui/Icons';

export default function MegaMenu({ open, activeSlug, activeItem, onClose, onKeepOpen }) {
  const reduceMotion = useReducedMotion();

  // Per-slug response cache. Re-hovering a category renders from memory, so the
  // panel never flashes a loading state for a category already visited.
  const cache = useRef({});
  const [, forceRender] = useState(0);
  const [loadingSlug, setLoadingSlug] = useState(null);

  useEffect(() => {
    if (!open || !activeSlug || cache.current[activeSlug]) return;

    let cancelled = false;
    setLoadingSlug(activeSlug);

    API.getCategoryMenu(activeSlug)
      .then(res => {
        if (cancelled || !res?.success) return;
        cache.current[activeSlug] = res;
        forceRender(n => n + 1);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlug(s => (s === activeSlug ? null : s));
      });

    return () => { cancelled = true; };
  }, [open, activeSlug]);

  const live = activeSlug ? cache.current[activeSlug] : null;
  const columns = live?.columns || [];
  const isLoading = loadingSlug === activeSlug && !live;

  // Grid width must match the real column count (1 for "View All" + first
  // facet group, one per remaining facet group, one for Latest Products) —
  // a main category can have anywhere from a handful up to all 7 facet
  // groups (area/application, size, design, type, finish, color, surface),
  // so a single fixed xl:grid-cols-N would either leave gaps or, worse,
  // overflow and wrap the Latest Products panel onto its own row.
  const totalGridCols = Math.max(4, Math.min(8, (columns.length || 0) + 1));
  const xlColsClass = { 4: 'xl:grid-cols-4', 5: 'xl:grid-cols-5', 6: 'xl:grid-cols-6', 7: 'xl:grid-cols-7', 8: 'xl:grid-cols-8' }[totalGridCols];
  const lgColsClass = { 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6', 7: 'lg:grid-cols-7', 8: 'lg:grid-cols-8' }[totalGridCols];
  const mdColsClass = 'md:grid-cols-3';
  const smColsClass = 'sm:grid-cols-1';

  const latest = live?.latestProducts || [];
  const isLoadingLatest = isLoading;
  const categoryName = activeItem?.name || 'All Products';
  const viewAllUrl = activeItem?.url || '/shop';

  const enter = reduceMotion ? 0 : 0.25;
  const exit = reduceMotion ? 0 : 0.18;

  return (
    <motion.div
      id="mega-panel"
      onMouseEnter={onKeepOpen}
      initial={{ height: 0, visibility: 'hidden' }}
      animate={
        open
          // Becomes visible up front so the expand is actually seen.
          ? { height: 'auto', visibility: 'visible' }
          // …and only goes visibility:hidden once the collapse has finished,
          // which pulls the links out of the tab order so a closed panel is
          // never keyboard-reachable.
          : { height: 0, transitionEnd: { visibility: 'hidden' } }
      }
      transition={{ duration: open ? enter : exit, ease: open ? [0, 0, 0.2, 1] : [0.4, 0, 1, 1] }}
      className="overflow-hidden border-t border-white/10 bg-brand-navy shadow-mega"
      aria-hidden={!open}
    >
      <motion.div
        animate={{ opacity: open ? 1 : 0, y: open ? 0 : -10 }}
        transition={{ duration: open ? enter : exit, ease: 'easeOut' }}
      >
        <div
          className="scrollbar-mega mx-auto max-w-shell overflow-y-auto px-4 py-7 sm:px-6"
          style={{ minHeight: 'var(--mega-min-h)', maxHeight: 'var(--mega-max-h)' }}
        >
          {/* Keyed on the category: swapping triggers replays this fade, so the
              content changes in place while the panel itself stays open. */}
          <motion.div
            key={activeSlug || 'empty'}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
            className={`grid ${smColsClass} ${mdColsClass} ${lgColsClass} ${xlColsClass} gap-x-6 gap-y-8`}
          >
            {/* Column 1 — View All + first facet group (Area) */}
            <div className="min-w-0">
              <Link
                href={viewAllUrl}
                onClick={onClose}
                className="mb-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-blue to-brand-deep px-4 py-2.5 text-[13px] font-bold text-white shadow-glow transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(30,167,253,0.45)]"
              >
                <Icon.grid className="h-4 w-4" />
                View All {categoryName}
              </Link>

              {columns[0] && (
                <>
                  <ColumnHeading icon={columns[0].icon}>{columns[0].label}</ColumnHeading>
                  <FacetList items={columns[0].items} isLoading={isLoading} onNavigate={onClose} />
                </>
              )}
            </div>

            {/* Columns 2–6 — remaining facet groups (Size / Design / Type / Finish / Color) */}
            {columns.slice(1).map(col => (
              <div key={col.key} className="min-w-0">
                <ColumnHeading icon={col.icon}>{col.label}</ColumnHeading>
                <FacetList items={col.items} isLoading={isLoading} onNavigate={onClose} />
              </div>
            ))}

            {isLoading && columns.length === 0 && Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="min-w-0">
                <div className="mb-2.5 h-3 w-24 animate-pulse rounded bg-white/[0.08]" />
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <div key={j} className="h-3 w-full animate-pulse rounded bg-white/[0.05]" />
                  ))}
                </div>
              </div>
            ))}

            {/* Last column — Latest products */}
            <div className="col-span-2 min-w-0 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 md:col-span-3 xl:col-span-1">
              <h4 className="mb-3 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-blue">
                <Icon.fire className="h-4 w-4" /> Latest Products
              </h4>

              {isLoadingLatest ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 animate-pulse rounded-lg bg-white/[0.06]" />
                      <div className="flex-1">
                        <div className="h-2.5 w-4/5 animate-pulse rounded bg-white/[0.06]" />
                        <div className="mt-1.5 h-2.5 w-1/2 animate-pulse rounded bg-white/[0.05]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : latest.length === 0 ? (
                <p className="py-6 text-[13px] text-brand-slate">
                  No products listed in this category yet.
                </p>
              ) : (
                // A list (thumb + name) instead of a 2-up grid: the column is
                // narrow, and the grid squeezed names to "Sedimen Avorio…".
                <ul className="flex flex-col gap-2.5">
                  {latest.slice(0, 4).map(p => (
                    <li key={p.id}>
                      <Link
                        href={`/product/${p.slug}`}
                        onClick={onClose}
                        className="group -m-1 flex items-start gap-2.5 rounded-lg p-1 transition-colors hover:bg-white/[0.05]"
                      >
                        <span className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-brand-navy2 ring-1 ring-inset ring-white/[0.06]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.image_url || FALLBACK_IMG}
                            alt=""
                            width={40}
                            height={40}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="line-clamp-3 text-[12px] font-medium leading-snug text-white [overflow-wrap:anywhere] transition-colors group-hover:text-brand-blue">{p.name}</span>
                          <span className="mt-0.5 block text-[11.5px] text-brand-slate">
                            {formatPrice(p)}{hasPrice(p) && ' /sq.ft'}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ColumnHeading({ icon, children }) {
  return (
    <h4 className="mb-2.5 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-blue">
      <AnyIcon id={icon} className="h-4 w-4" />
      <span className="truncate">{children}</span>
    </h4>
  );
}

function FacetList({ items, isLoading, onNavigate }) {
  const list = items || [];
  if (!list.length) {
    return <p className="text-[13px] text-brand-slate/60">{isLoading ? '' : 'Coming soon'}</p>;
  }
  return (
    <ul className="flex flex-col">
      {list.map(item => (
        <li key={item.id}>
          <Link
            href={item.url}
            onClick={onNavigate}
            className="block border-b border-dashed border-white/[0.07] py-[6px] text-[13px] text-brand-slate transition-all duration-200 hover:pl-1.5 hover:text-brand-blue"
          >
            {item.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
