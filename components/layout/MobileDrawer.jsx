'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { API } from '@/lib/api';
import { ALL_PRODUCTS, COLUMN_DEFS, MENU_CONTENT, columnHeading } from '@/lib/menuData';
import { Icon, NavIcon } from '@/components/ui/Icons';

export default function MobileDrawer({ open, onClose, menuItems }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const [openSlug, setOpenSlug] = useState(null);
  const [openGroup, setOpenGroup] = useState(null);
  const [liveData, setLiveData] = useState({});
  const closeRef = useRef(null);

  // Escape closes; focus lands on the close button so the drawer is immediately
  // dismissable by keyboard and announced by screen readers on open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => closeRef.current?.focus(), 80);
    return () => {
      document.removeEventListener('keydown', onKey);
      clearTimeout(t);
    };
  }, [open, onClose]);

  // Collapse back to the top level each time the drawer is dismissed.
  useEffect(() => {
    if (!open) {
      setOpenSlug(null);
      setOpenGroup(null);
    }
  }, [open]);

  const toggleCategory = useCallback(async (slug) => {
    setOpenGroup(null);
    if (openSlug === slug) {
      setOpenSlug(null);
      return;
    }
    setOpenSlug(slug);
    if (liveData[slug]) return;
    const res = await API.getCategoryMenu(slug);
    if (res?.success) setLiveData(prev => ({ ...prev, [slug]: res.columns || {} }));
  }, [openSlug, liveData]);

  const go = useCallback((url) => {
    onClose();
    router.push(url);
  }, [onClose, router]);

  const drawerItems = useMemo(() => {
    const rest = menuItems.filter(i => i.slug !== ALL_PRODUCTS);
    const all = menuItems.find(i => i.slug === ALL_PRODUCTS)
      || { name: 'All Products', slug: ALL_PRODUCTS, url: '/shop', icon: 'grid' };
    return [all, ...rest];
  }, [menuItems]);

  const slide = reduceMotion
    ? { duration: 0 }
    : { type: 'tween', duration: 0.32, ease: [0.22, 1, 0.36, 1] };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="fixed inset-0 z-drawer flex flex-col bg-brand-navy text-white"
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={slide}
        >
          {/* Header — sits below the status bar / notch on mobile */}
          <div
            className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-brand-chrome px-4 py-4"
            style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
          >
            <button onClick={() => go('/')} className="flex items-center gap-3 text-left">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-deep font-heading text-lg font-black">
                M
              </span>
              <span className="font-heading text-base font-extrabold leading-tight">
                MEENAKSHI
                <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.2em] text-brand-blue">
                  Build World
                </span>
              </span>
            </button>
            <button
              ref={closeRef}
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition active:bg-white/10"
              aria-label="Close navigation menu"
            >
              <Icon.close className="h-5 w-5" />
            </button>
          </div>

          {/* Category accordions */}
          <div
            className="scrollbar-mega flex-1 overflow-y-auto px-4"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
          >
            {drawerItems.map(item => {
              const isOpen = openSlug === item.slug;
              const columns =
                liveData[item.slug]
                || MENU_CONTENT[item.slug]?.columns
                || MENU_CONTENT[ALL_PRODUCTS].columns;

              return (
                <div key={item.slug} className="border-b border-white/[0.07]">
                  <button
                    onClick={() => toggleCategory(item.slug)}
                    aria-expanded={isOpen}
                    className="flex min-h-[52px] w-full items-center justify-between gap-3 py-3.5 text-left font-semibold text-white/90 transition active:text-brand-blue"
                  >
                    <span className="flex items-center gap-3">
                      <NavIcon id={item.icon} className="h-5 w-5 text-brand-blue" />
                      {item.name}
                    </span>
                    <Icon.chevronDown
                      className={`h-5 w-5 shrink-0 text-white/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <Collapse open={isOpen} reduceMotion={reduceMotion}>
                    <div className="pb-4">
                      <button
                        onClick={() => go(item.url)}
                        className="mb-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-deep text-sm font-bold text-white shadow-glow"
                      >
                        <Icon.grid className="h-4 w-4" /> View All {item.name}
                      </button>

                      {/* Second level: one accordion per facet group, mirroring
                          the six desktop columns. */}
                      {COLUMN_DEFS.map(def => {
                        const values = columns[def.key] || [];
                        if (!values.length) return null;
                        const groupId = `${item.slug}:${def.key}`;
                        const groupOpen = openGroup === groupId;

                        return (
                          <div key={def.key} className="mb-1.5 overflow-hidden rounded-xl bg-white/[0.04]">
                            <button
                              onClick={() => setOpenGroup(groupOpen ? null : groupId)}
                              aria-expanded={groupOpen}
                              className="flex min-h-[44px] w-full items-center justify-between gap-2 px-3.5 text-left"
                            >
                              <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-blue">
                                {columnHeading(item.name, def)}
                              </span>
                              <Icon.chevronDown
                                className={`h-4 w-4 shrink-0 text-white/40 transition-transform duration-200 ${groupOpen ? 'rotate-180' : ''}`}
                              />
                            </button>

                            <Collapse open={groupOpen} reduceMotion={reduceMotion}>
                              <ul className="px-3.5 pb-3">
                                {values.slice(0, 14).map(value => (
                                  <li key={value}>
                                    <button
                                      onClick={() => {
                                        const q = new URLSearchParams();
                                        if (item.slug !== ALL_PRODUCTS) q.set('category', item.slug);
                                        q.append(def.param, value);
                                        go(`/shop?${q.toString()}`);
                                      }}
                                      className="block min-h-[44px] w-full border-b border-dashed border-white/[0.07] text-left text-[13px] text-brand-slate transition active:text-brand-blue"
                                    >
                                      {value}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </Collapse>
                          </div>
                        );
                      })}
                    </div>
                  </Collapse>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Collapse({ open, reduceMotion, children }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.26, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
