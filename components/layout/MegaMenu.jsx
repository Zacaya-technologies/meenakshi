'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { API, FALLBACK_IMG, formatPrice, hasPrice } from '@/lib/api';
import { Icon, AnyIcon } from '@/components/ui/Icons';

// Lists longer than this collapse behind a "+N more" toggle so one long facet
// (Area often has 15+ rooms) doesn't stretch the whole panel.
const LIST_LIMIT = 9;

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

  // The first group (Area / Application) lives in the sidebar under the
  // category header; the rest flow through an auto-fit grid, so any number of
  // facet groups (1–7) fills the row without gaps or overflow at every width.
  const [primary, ...facets] = columns;

  const latest = live?.latestProducts || [];
  const categoryName = activeItem?.name || 'All Products';
  const viewAllUrl = activeItem?.url || '/shop';
  const totalOptions = columns.reduce((n, c) => n + (c.items?.length || 0), 0);

  const enter = reduceMotion ? 0 : 0.25;
  const exit = reduceMotion ? 0 : 0.18;

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.045 } },
  };
  const rise = {
    hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] } },
  };

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
      className="relative overflow-hidden border-t border-white/10 bg-brand-navy shadow-mega"
      aria-hidden={!open}
    >
      {/* Soft brand glow + hairline accent: gives the panel depth without
          introducing any new colours. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand-blue/10 blur-3xl" />
        <div className="absolute -bottom-48 right-0 h-96 w-[28rem] rounded-full bg-brand-deep/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-brand-blue/50 to-transparent" />
      </div>

      <motion.div
        animate={{ opacity: open ? 1 : 0, y: open ? 0 : -10 }}
        transition={{ duration: open ? enter : exit, ease: 'easeOut' }}
        className="relative"
      >
        <div
          className="scrollbar-mega mx-auto max-w-shell overflow-y-auto px-4 py-5 sm:px-6 sm:py-7"
          style={{
            minHeight: 'min(var(--mega-min-h), calc(100dvh - var(--header-h) - var(--utility-h)))',
            maxHeight: 'min(var(--mega-max-h), calc(100dvh - var(--header-h) - var(--utility-h)))',
          }}
        >
          {/* Keyed on the category: swapping replays the stagger, so content
              changes in place while the panel itself stays open. */}
          <motion.div
            key={activeSlug || 'empty'}
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-5 md:grid-cols-[230px_minmax(0,1fr)] lg:gap-7 xl:grid-cols-[250px_minmax(0,1fr)_270px]"
          >
            {/* ── Sidebar: category header, CTA and the primary facet ── */}
            <motion.aside
              variants={rise}
              className="flex min-w-0 flex-col rounded-2xl border border-white/[0.07] bg-linear-to-b from-white/[0.05] to-white/[0.015] p-4 sm:p-5"
            >
              <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-brand-slate/70">Explore</p>
              <h3 className="mt-1 font-heading text-lg font-semibold leading-tight text-white">{categoryName}</h3>
              <p className="mt-1 text-[12px] text-brand-slate">
                {isLoading ? 'Loading collections…' : totalOptions > 0
                  ? `${totalOptions} ways to browse`
                  : 'Browse the full range'}
              </p>

              <Link
                href={viewAllUrl}
                onClick={onClose}
                className="group mt-4 inline-flex items-center justify-between gap-3 rounded-xl bg-linear-to-r from-brand-blue to-brand-deep px-4 py-3 text-[13px] font-bold text-white shadow-glow transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(30,167,253,0.45)]"
              >
                <span className="inline-flex items-center gap-2">
                  <Icon.grid className="h-4 w-4" />
                  View all
                </span>
                <Icon.arrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>

              {primary && (
                <div className="mt-6">
                  <ColumnHeading icon={primary.icon} count={primary.items?.length}>{primary.label}</ColumnHeading>
                  <FacetList column={primary} onNavigate={onClose} />
                </div>
              )}
              {isLoading && !primary && <SkeletonList rows={7} className="mt-6" />}
            </motion.aside>

            {/* ── Facet groups: Size / Design / Type / Finish / Colour … ── */}
            <div
              className="grid min-w-0 content-start gap-x-6 gap-y-7"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 9.5rem), 1fr))' }}
            >
              {facets.map(col => (
                <motion.section key={col.key} variants={rise} className="min-w-0">
                  <ColumnHeading icon={col.icon} count={col.items?.length}>{col.label}</ColumnHeading>
                  <FacetList column={col} onNavigate={onClose} />
                </motion.section>
              ))}

              {isLoading && columns.length === 0 && Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-w-0">
                  <div className="mb-3 h-7 w-28 animate-pulse rounded-lg bg-white/8" />
                  <SkeletonList rows={8} />
                </div>
              ))}

              {!isLoading && live && facets.length === 0 && (
                <p className="col-span-full self-center py-10 text-center text-[13px] text-brand-slate">
                  More filters are on the way — explore the full range for now.
                </p>
              )}
            </div>

            {/* ── Latest products: column on xl, full-width strip below ── */}
            <motion.aside
              variants={rise}
              className="min-w-0 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 md:col-span-2 xl:col-span-1"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-blue">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-blue opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-blue" />
                  </span>
                  Just arrived
                </h4>
                <Link
                  href={viewAllUrl}
                  onClick={onClose}
                  className="text-[11.5px] font-semibold text-brand-slate transition-colors hover:text-brand-blue"
                >
                  See all
                </Link>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-1.5">
                      <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-white/6" />
                      <div className="flex-1">
                        <div className="h-2.5 w-4/5 animate-pulse rounded-sm bg-white/6" />
                        <div className="mt-2 h-2.5 w-1/2 animate-pulse rounded-sm bg-white/5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : latest.length === 0 ? (
                <p className="py-6 text-[13px] text-brand-slate">
                  No products listed in this category yet.
                </p>
              ) : (
                <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-1">
                  {latest.slice(0, 4).map(p => (
                    <li key={p.id} className="min-w-0">
                      <Link
                        href={`/product/${p.slug}`}
                        onClick={onClose}
                        className="group flex items-center gap-3 rounded-xl border border-transparent p-1.5 transition duration-200 hover:border-white/[0.08] hover:bg-white/[0.05]"
                      >
                        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-brand-navy2 ring-1 ring-inset ring-white/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.image_url || FALLBACK_IMG}
                            alt=""
                            width={56}
                            height={56}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 ease-out-expo group-hover:scale-110"
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 text-[12.5px] font-semibold leading-snug text-white transition-colors group-hover:text-brand-blue">{p.name}</span>
                          <span className="mt-1 block text-[11.5px] text-brand-slate">
                            {formatPrice(p)}{hasPrice(p) && ' /sq.ft'}
                          </span>
                        </span>
                        <Icon.chevronRight className="h-4 w-4 shrink-0 -translate-x-1 text-brand-blue opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </motion.aside>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ColumnHeading({ icon, count, children }) {
  return (
    <h4 className="mb-2 flex items-center gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue ring-1 ring-inset ring-brand-blue/20">
        <AnyIcon id={icon} className="h-3.5 w-3.5" />
      </span>
      <span className="truncate text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/90">{children}</span>
      {count > 0 && (
        <span className="ml-auto shrink-0 text-[10.5px] font-semibold tabular-nums text-brand-slate/60">{count}</span>
      )}
    </h4>
  );
}

function FacetList({ column, onNavigate }) {
  const [expanded, setExpanded] = useState(false);
  const list = column.items || [];

  if (!list.length) {
    return <p className="px-2 text-[13px] text-brand-slate/60">Coming soon</p>;
  }

  const hidden = list.length - LIST_LIMIT;
  const shown = expanded || hidden <= 1 ? list : list.slice(0, LIST_LIMIT);

  return (
    <>
      <ul className="-mx-2 flex flex-col">
        {shown.map(item => (
          <li key={item.id}>
            <Link
              href={item.url}
              onClick={onNavigate}
              className="group relative flex items-center gap-2.5 rounded-lg px-2 py-[7px] text-[13px] text-brand-slate transition-colors duration-200 hover:bg-white/[0.05] hover:text-white"
            >
              {/* Accent bar slides in on hover / keyboard focus */}
              <span className="absolute inset-y-2 left-0 w-[2px] origin-center scale-y-0 rounded-full bg-brand-blue transition-transform duration-200 group-hover:scale-y-100 group-focus-visible:scale-y-100" />
              <FacetMarker groupKey={column.key} name={item.name} />
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
              {item.count > 0 && (
                <span className="shrink-0 text-[10.5px] tabular-nums text-brand-slate/45 transition-opacity duration-200 group-hover:opacity-0">
                  {item.count}
                </span>
              )}
              <Icon.arrowRight
                className={`h-3.5 w-3.5 shrink-0 -translate-x-1 text-brand-blue opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100 ${item.count > 0 ? 'absolute right-2' : ''}`}
              />
            </Link>
          </li>
        ))}
      </ul>
      {hidden > 1 && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
          className="mt-1.5 inline-flex items-center gap-1 rounded-md px-0 py-1 text-[12px] font-semibold text-brand-blue transition-opacity hover:opacity-80"
        >
          {expanded ? 'Show less' : `+${hidden} more`}
          <Icon.chevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}
    </>
  );
}

/* Small visual cue per facet: a real swatch for colours and a to-scale tile
   outline for sizes, so the lists read at a glance instead of as plain text. */
function FacetMarker({ groupKey, name }) {
  if (groupKey === 'color') {
    const swatch = colorSwatch(name);
    if (!swatch) return null;
    return (
      <span
        aria-hidden="true"
        className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-white/25 transition-transform duration-200 group-hover:scale-125"
        style={{ background: swatch }}
      />
    );
  }

  if (groupKey === 'size') {
    const m = name.match(/(\d+(?:\.\d+)?)\s*[×xX*]\s*(\d+(?:\.\d+)?)/);
    if (!m) return null;
    const a = parseFloat(m[1]);
    const b = parseFloat(m[2]);
    const max = Math.max(a, b);
    const w = Math.max(4, Math.round((a / max) * 14));
    const h = Math.max(4, Math.round((b / max) * 14));
    return (
      <span aria-hidden="true" className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
        <span
          className="rounded-[2px] border-[1.5px] border-brand-slate/60 transition-colors duration-200 group-hover:border-brand-blue"
          style={{ width: w, height: h }}
        />
      </span>
    );
  }

  return null;
}

// Longest names first so "sky blue" wins over "blue".
const SWATCHES = [
  ['sky blue', '#7dd3fc'], ['off white', '#f1ede4'], ['dark grey', '#4b5563'], ['light grey', '#d1d5db'],
  ['multicolor', 'conic-gradient(#ef4444,#facc15,#22c55e,#3b82f6,#a855f7,#ef4444)'],
  ['multi', 'conic-gradient(#ef4444,#facc15,#22c55e,#3b82f6,#a855f7,#ef4444)'],
  ['white', '#f8fafc'], ['black', '#111827'], ['brown', '#7c4a2d'], ['beige', '#d6c09c'],
  ['ivory', '#f3eed8'], ['cream', '#ecdfc0'], ['yellow', '#facc15'], ['blue', '#2563eb'],
  ['green', '#16a34a'], ['grey', '#9ca3af'], ['gray', '#9ca3af'], ['pink', '#f472b6'],
  ['red', '#dc2626'], ['aqua', '#22d3ee'], ['orange', '#f97316'], ['purple', '#8b5cf6'],
  ['gold', '#d4a72c'], ['silver', '#c0c4cc'], ['maroon', '#7f1d1d'], ['teal', '#0d9488'],
  ['wood', '#a0703f'], ['walnut', '#5c3d24'], ['charcoal', '#36454f'], ['sand', '#d8c39a'],
  ['terracotta', '#c2633b'], ['navy', '#1e3a8a'],
];

function colorSwatch(name) {
  const n = String(name).toLowerCase();
  const hit = SWATCHES.find(([k]) => n.includes(k));
  return hit ? hit[1] : null;
}

function SkeletonList({ rows, className = '' }) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-3 animate-pulse rounded-sm bg-white/5" style={{ width: `${60 + ((i * 17) % 35)}%` }} />
      ))}
    </div>
  );
}
