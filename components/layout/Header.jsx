'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { useBusiness, telHref, waLink } from '@/lib/business';
import { API } from '@/lib/api';
import { Icon } from '@/components/ui/Icons';
import MegaMenu from './MegaMenu';
import MobileDrawer from './MobileDrawer';
import SearchModal from './SearchModal';
import CartDrawer from './CartDrawer';

/* Hover-intent timings. Opening waits briefly so a cursor crossing the rail on
   its way elsewhere does not flash the panel open; switching between triggers
   while the panel is already open is instant, which is what makes the content
   swap feel continuous instead of like a close-then-reopen. */
const OPEN_INTENT_MS = 90;
const CLOSE_INTENT_MS = 180;

export default function Header() {
  const { cartCount, wishlist, compare, darkMode, setDarkMode, user, logout } = useApp();
  const business = useBusiness();
  const pathname = usePathname();
  const router = useRouter();

  const [menuItems, setMenuItems] = useState([]);
  const [megaOpen, setMegaOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [isCoarse, setIsCoarse] = useState(false);

  const shellRef = useRef(null);
  const railRef = useRef(null);
  const triggerRefs = useRef({});
  const openTimer = useRef(null);
  const closeTimer = useRef(null);

  const [railEdges, setRailEdges] = useState({ left: false, right: false });

  /* ------------------------------------------------------------------ *
   * Environment
   * ------------------------------------------------------------------ */

  // Touch/pen devices have no hover, so they get click-to-toggle instead.
  useEffect(() => {
    const mq = window.matchMedia('(hover: none), (pointer: coarse)');
    const apply = () => setIsCoarse(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Nav rail is 100% database-driven (categories.icon supplies the glyph key) —
  // the bootstrap "All Products" item renders instantly and is replaced the
  // moment the request resolves, so the rail never goes empty or stale.
  useEffect(() => {
    let cancelled = false;
    API.getMenu()
      .then(res => {
        if (cancelled || !res?.success || !Array.isArray(res.topNav) || !res.topNav.length) return;
        setMenuItems(res.topNav.map(t => ({ name: t.name, slug: t.slug, url: t.url, icon: t.icon || 'grid' })));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  /* ------------------------------------------------------------------ *
   * Open / close
   * ------------------------------------------------------------------ */

  const clearTimers = useCallback(() => {
    if (openTimer.current) { clearTimeout(openTimer.current); openTimer.current = null; }
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  }, []);

  const openMega = useCallback((slug) => {
    clearTimers();
    setActiveSlug(slug);
    setMegaOpen(true);
  }, [clearTimers]);

  const closeMega = useCallback(() => {
    clearTimers();
    setMegaOpen(false);
  }, [clearTimers]);

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMegaOpen(false), CLOSE_INTENT_MS);
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  // A completed navigation always dismisses the panel.
  useEffect(() => { closeMega(); }, [pathname, closeMega]);

  /* ------------------------------------------------------------------ *
   * Pointer interaction
   * ------------------------------------------------------------------ */

  const handleTriggerEnter = useCallback((slug) => {
    if (isCoarse) return;
    clearTimers();
    if (megaOpen) {
      // Already open — swap content immediately, no reopen animation.
      setActiveSlug(slug);
      return;
    }
    openTimer.current = setTimeout(() => openMega(slug), OPEN_INTENT_MS);
  }, [isCoarse, megaOpen, clearTimers, openMega]);

  const handleTriggerLeave = useCallback(() => {
    if (isCoarse) return;
    clearTimers();
    closeTimer.current = setTimeout(() => setMegaOpen(false), CLOSE_INTENT_MS);
  }, [isCoarse, clearTimers, closeMega]);

  // Tap toggles on touch devices; on desktop a click still works as a fallback
  // for anyone who clicks rather than dwells. Neither ever navigates.
  const handleTriggerClick = useCallback((slug) => {
    if (megaOpen && activeSlug === slug) closeMega();
    else openMega(slug);
  }, [megaOpen, activeSlug, closeMega, openMega]);

  // The whole header (rows + panel) is one hover region, so moving the cursor
  // from a trigger down into the panel never crosses a gap that would close it.
  const handleShellLeave = useCallback(() => {
    if (isCoarse) return;
    scheduleClose();
  }, [isCoarse, scheduleClose]);

  // Outside tap closes on touch devices.
  useEffect(() => {
    if (!megaOpen) return;
    const onPointerDown = (e) => {
      if (!shellRef.current?.contains(e.target)) closeMega();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [megaOpen, closeMega]);

  /* ------------------------------------------------------------------ *
   * Keyboard
   * ------------------------------------------------------------------ */

  const focusTrigger = useCallback((slug) => {
    triggerRefs.current[slug]?.focus();
  }, []);

  const handleTriggerKeyDown = useCallback((e, index) => {
    const item = menuItems[index];
    switch (e.key) {
      case 'ArrowRight': {
        e.preventDefault();
        const next = menuItems[(index + 1) % menuItems.length];
        focusTrigger(next.slug);
        if (megaOpen) setActiveSlug(next.slug);
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        const prev = menuItems[(index - 1 + menuItems.length) % menuItems.length];
        focusTrigger(prev.slug);
        if (megaOpen) setActiveSlug(prev.slug);
        break;
      }
      case 'ArrowDown':
        e.preventDefault();
        if (!megaOpen || activeSlug !== item.slug) openMega(item.slug);
        // Wait for the state commit and for the panel to flip to
        // visibility:visible — a hidden element cannot take focus.
        setTimeout(() => {
          const panel = document.getElementById('mega-panel');
          if (panel) {
            const focusable = panel.querySelector('a, button');
            focusable?.focus();
          }
        }, 60);
        break;
      case 'Escape':
        if (megaOpen) { e.preventDefault(); closeMega(); }
        break;
      default:
        break;
    }
  }, [menuItems, megaOpen, activeSlug, openMega, closeMega, focusTrigger]);

  // Escape anywhere closes and returns focus to the trigger that opened it.
  useEffect(() => {
    if (!megaOpen) return;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      closeMega();
      focusTrigger(activeSlug);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [megaOpen, activeSlug, closeMega, focusTrigger]);

  /* ------------------------------------------------------------------ *
   * Category rail overflow affordances
   * ------------------------------------------------------------------ */

  const measureRail = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setRailEdges({ left: el.scrollLeft > 4, right: el.scrollLeft < max - 4 });
  }, []);

  useEffect(() => {
    measureRail();
    const el = railRef.current;
    if (!el) return;
    el.addEventListener('scroll', measureRail, { passive: true });
    window.addEventListener('resize', measureRail);
    return () => {
      el.removeEventListener('scroll', measureRail);
      window.removeEventListener('resize', measureRail);
    };
  }, [measureRail, menuItems]);

  const scrollRail = (dir) => {
    railRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  const railMask =
    railEdges.left && railEdges.right ? 'rail-fade-both'
      : railEdges.left ? 'rail-fade-l'
        : railEdges.right ? 'rail-fade-r'
          : '';

  /* ------------------------------------------------------------------ *
   * Overlays lock the page scroll; the mega panel deliberately does not,
   * because it is part of the document flow rather than an overlay.
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const locked = drawerOpen || searchOpen || cartOpen;
    document.body.style.overflow = locked ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen, searchOpen, cartOpen]);

  const activeItem = useMemo(
    () => menuItems.find(i => i.slug === activeSlug) || null,
    [menuItems, activeSlug]
  );

  /* ------------------------------------------------------------------ *
   * Render
   * ------------------------------------------------------------------ */

  // The admin console has its own shell; the storefront chrome would only
  // duplicate it and sit on top of its mobile navigation.
  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      {/* Utility bar — scrolls away, it is not part of the sticky unit */}
      <nav aria-label="Contact and account" className="bg-slate-950 text-white/70">
        <div className="mx-auto flex h-9 max-w-shell items-center justify-between gap-4 px-4 text-[12px] sm:px-6">
          <div className="flex min-w-0 items-center gap-5">
            <span className="hidden truncate tracking-wide text-white/55 xl:inline">{business.tagline}</span>
            <a href={telHref(business.primary_phone)} className="flex shrink-0 items-center gap-1.5 transition-colors hover:text-white">
              <Icon.phone className="h-3.5 w-3.5 text-white/50" />
              <span className="font-medium text-white/85">{business.primary_phone}</span>
            </a>
            <a
              href={waLink(business.whatsapp_number, `Hello ${business.business_name}, I would like to know more about your products.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden shrink-0 items-center gap-1.5 transition-colors hover:text-white sm:flex"
            >
              <Icon.whatsapp className="h-3.5 w-3.5 text-white/50" /> WhatsApp
            </a>
            <a href={`mailto:${business.email}`} className="hidden shrink-0 items-center gap-1.5 transition-colors hover:text-white lg:flex">
              <Icon.mail className="h-3.5 w-3.5 text-white/50" /> {business.email}
            </a>
          </div>

          <div className="flex shrink-0 items-center gap-5">
            <Link href="/calculator" className="hidden transition-colors hover:text-white sm:inline">Tile Calculator</Link>
            <Link href="/contact" className="hidden transition-colors hover:text-white md:inline">Visit Showroom</Link>
            {user ? (
              <span className="flex items-center gap-3">
                <span className="hidden max-w-[160px] truncate align-middle text-white/85 sm:inline-block">Hi, {user.name}</span>
                <button onClick={logout} className="transition-colors hover:text-white">Logout</button>
              </span>
            ) : (
              <Link href="/dealer-login" className="transition-colors hover:text-white">Dealer Login</Link>
            )}
          </div>
        </div>
      </nav>

      {/* ---------------------------------------------------------------- *
        * Sticky unit: main row + category rail + mega panel.
        *
        * The panel is a child of this sticky element rather than an absolutely
        * positioned overlay. Because a sticky box keeps its space in normal
        * flow, growing it genuinely displaces the page content below — the
        * products slide down instead of being covered — and the panel can never
        * be drawn over the navigation rows above it.
        * ---------------------------------------------------------------- */}
      <header
        ref={shellRef}
        onMouseLeave={handleShellLeave}
        className="sticky top-0 z-rail border-b border-slate-200 bg-white/95 text-slate-900 backdrop-blur supports-[backdrop-filter]:bg-white/90 dark:border-white/10 dark:bg-navy2/95 dark:text-white"
      >
        {/* Main row */}
        <div className="mx-auto flex h-20 max-w-shell items-center gap-2 px-4 sm:gap-6 sm:px-6">
          <button
            onClick={() => setDrawerOpen(true)}
            className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10 lg:hidden"
            aria-label="Open navigation menu"
          >
            <Icon.menu className="h-5 w-5" />
          </button>

          <Link href="/" className="flex shrink-0 items-center" onClick={closeMega} aria-label={`${business.business_name} — home`}>
            <img
              src="/images/logo.png"
              alt={business.business_name}
              className="h-9 w-auto dark:rounded-md dark:bg-white dark:px-2 dark:py-1 sm:h-12"
            />
          </Link>

          {/* Search — opens the search overlay, which autofocuses its own input */}
          <button
            onClick={() => setSearchOpen(true)}
            className="group mx-auto hidden h-11 w-full max-w-[520px] items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 text-left transition-colors hover:border-slate-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 lg:flex"
          >
            <Icon.search className="h-[18px] w-[18px] shrink-0 text-slate-500 dark:text-slate-400" />
            <span className="flex-1 truncate text-sm text-slate-500 dark:text-slate-400">
              Search tiles, slabs, finishes or SKU
            </span>
          </button>

          <div className="ml-auto flex items-center sm:gap-1">
            <IconAction onClick={() => setSearchOpen(true)} label="Search" className="lg:hidden">
              <Icon.search className="h-5 w-5" />
            </IconAction>
            <IconAction onClick={() => router.push('/compare')} label="Compare" badge={compare.length} className="hidden sm:flex">
              <Icon.scales className="h-5 w-5" />
            </IconAction>
            <IconAction onClick={() => router.push('/wishlist')} label="Wishlist" badge={wishlist.length}>
              <Icon.heart className="h-5 w-5" />
            </IconAction>
            <IconAction onClick={() => setCartOpen(true)} label="Cart" badge={cartCount}>
              <Icon.bag className="h-5 w-5" />
            </IconAction>
            <span className="mx-1 hidden h-6 w-px bg-slate-200 dark:bg-white/10 sm:block" aria-hidden="true" />
            <IconAction
              onClick={() => setDarkMode(!darkMode)}
              label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
              className="hidden sm:flex"
            >
              {darkMode ? <Icon.sun className="h-5 w-5" /> : <Icon.moon className="h-5 w-5" />}
            </IconAction>
          </div>
        </div>

        {/* Category rail — every item is a mega-menu trigger, never a link */}
        <div className="relative border-t border-slate-100 dark:border-white/5">
          <div className="mx-auto max-w-shell px-4 sm:px-6">
            <div className="relative">
              {railEdges.left && (
                <RailArrow side="left" onClick={() => scrollRail(-1)} />
              )}
              {railEdges.right && (
                <RailArrow side="right" onClick={() => scrollRail(1)} />
              )}

              <nav
                ref={railRef}
                aria-label="Product categories"
                className={`-mx-3 flex items-stretch overflow-x-auto scrollbar-none ${railMask}`}
              >
                {menuItems.map((item, index) => {
                  const isActive = megaOpen && activeSlug === item.slug;
                  return (
                    <button
                      key={item.slug}
                      ref={el => { triggerRefs.current[item.slug] = el; }}
                      type="button"
                      onMouseEnter={() => handleTriggerEnter(item.slug)}
                      onMouseLeave={handleTriggerLeave}
                      onClick={() => handleTriggerClick(item.slug)}
                      onFocus={() => { if (megaOpen) setActiveSlug(item.slug); }}
                      onKeyDown={e => handleTriggerKeyDown(e, index)}
                      aria-haspopup="true"
                      aria-expanded={isActive}
                      aria-controls="mega-panel"
                      className={`relative inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap px-3 py-[15px] text-[14px] font-medium transition-colors duration-200 ${
                        isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                      }`}
                    >
                      {item.name}
                      {/* Active underline */}
                      <span
                        className={`pointer-events-none absolute inset-x-3 bottom-0 h-0.5 bg-slate-900 transition-transform duration-200 ease-out-expo dark:bg-white ${
                          isActive ? 'scale-x-100' : 'scale-x-0'
                        }`}
                      />
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        <MegaMenu
          open={megaOpen}
          activeSlug={activeSlug}
          activeItem={activeItem}
          onClose={closeMega}
          onKeepOpen={clearTimers}
        />
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} menuItems={menuItems} />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

/* -------------------------------------------------------------------- *
 * Sub-components
 * -------------------------------------------------------------------- */

// 40px round icon button with a small count badge.
function IconAction({ onClick, label, badge = 0, className = '', children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={badge > 0 ? `${label} (${badge})` : label}
      title={label}
      className={`relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white ${className}`}
    >
      {children}
      {badge > 0 && (
        <span
          className="absolute right-0.5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-semibold tabular-nums text-white ring-2 ring-white dark:bg-white dark:text-slate-900 dark:ring-navy2"
          aria-hidden="true"
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

function RailArrow({ side, onClick }) {
  const isLeft = side === 'left';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isLeft ? 'Scroll categories left' : 'Scroll categories right'}
      className={`absolute top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:text-slate-900 dark:border-white/10 dark:bg-navy2 dark:text-slate-200 ${
        isLeft ? '-left-1' : '-right-1'
      }`}
    >
      {isLeft ? <Icon.chevronLeft className="h-4 w-4" /> : <Icon.chevronRight className="h-4 w-4" />}
    </button>
  );
}
