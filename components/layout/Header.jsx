'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { API } from '@/lib/api';
import { ALL_PRODUCTS } from '@/lib/menuData';
import { Icon, NavIcon } from '@/components/ui/Icons';

const BOOTSTRAP_NAV = [{ name: 'All Products', slug: ALL_PRODUCTS, url: '/shop', icon: 'grid' }];

// Plain nav links (not mega-menu triggers, not categories) appended after the
// DB-driven category rail.
const STATIC_LINKS = [
  { name: 'All Tiles', url: '/all-tiles' },
  { name: 'Brands', url: '/brands' },
  { name: 'Collections', url: '/collections' },
  { name: 'Offers', url: '/shop?featured=1' }
];
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
  const pathname = usePathname();
  const router = useRouter();

  const [menuItems, setMenuItems] = useState(BOOTSTRAP_NAV);
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
    if (openTimer.current) { clearTimeout(openTimer.current); openTimer.current = null; }
  }, [isCoarse]);

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
          document.getElementById('mega-panel')?.querySelector('a, button')?.focus();
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

  return (
    <>
      {/* Utility bar — scrolls away, it is not part of the sticky unit */}
      <div className="bg-brand-chrome text-white/85">
        <div className="mx-auto flex h-9 max-w-shell items-center justify-between gap-4 px-4 text-xs sm:px-6">
          <div className="flex items-center gap-5 overflow-hidden">
            <a
              href="https://wa.me/919876543210"
              className="flex shrink-0 items-center gap-1.5 transition hover:text-brand-blue"
            >
              <Icon.whatsapp className="h-4 w-4 text-[#25D366]" />
              <span className="hidden sm:inline">WhatsApp</span>
              <strong className="font-semibold text-white">+91 98765 43210</strong>
            </a>
            <a href="tel:+919876543210" className="hidden shrink-0 items-center gap-1.5 transition hover:text-brand-blue md:flex">
              <Icon.phone className="h-4 w-4 text-brand-blue" />
              Sales <strong className="font-semibold text-white">+91 98765 43210</strong>
            </a>
            <a
              href="mailto:sales@meenakshibuildworld.com"
              className="hidden shrink-0 items-center gap-1.5 transition hover:text-brand-blue lg:flex"
            >
              <Icon.mail className="h-4 w-4 text-brand-blue" />
              sales@meenakshibuildworld.com
            </a>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <Link href="/calculator" className="hidden transition hover:text-brand-blue sm:inline">Tile Calculator</Link>
            <Link href="/store-locator" className="hidden transition hover:text-brand-blue md:inline">Store Locator</Link>
            {user ? (
              <span className="flex items-center gap-3">
                <span className="text-brand-blue">Hi, <strong>{user.name}</strong></span>
                <button onClick={logout} className="transition hover:text-brand-blue">Logout</button>
              </span>
            ) : (
              <Link href="/dealer-login" className="flex items-center gap-1.5 transition hover:text-brand-blue">
                <Icon.user className="h-4 w-4" /> Dealer Login
              </Link>
            )}
          </div>
        </div>
      </div>

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
        className="sticky top-0 z-rail bg-brand-navy text-white shadow-[0_2px_20px_rgba(0,0,0,0.25)]"
      >
        {/* Main row */}
        <div className="mx-auto flex h-20 max-w-shell items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/5 text-white transition hover:border-brand-blue hover:text-brand-blue lg:hidden"
            aria-label="Open navigation menu"
          >
            <Icon.menu className="h-5 w-5" />
          </button>

          <Link href="/" className="flex shrink-0 items-center gap-3" onClick={closeMega}>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-deep font-heading text-xl font-black text-white shadow-glow">
              M
            </span>
            <span className="hidden flex-col leading-none sm:flex">
              <span className="font-heading text-lg font-extrabold tracking-wide text-white">MEENAKSHI</span>
              <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-brand-blue">Build World</span>
            </span>
          </Link>

          {/* Search — opens the search overlay, which autofocuses its own input */}
          <button
            onClick={() => setSearchOpen(true)}
            className="mx-auto hidden h-11 w-full max-w-[440px] items-center gap-3 rounded-full border border-white/12 bg-white/[0.06] pl-5 pr-1.5 text-left transition hover:border-brand-blue/60 lg:flex"
          >
            <span className="flex-1 truncate text-sm text-white/45">
              Search tiles, marble, sanitaryware, SKU…
            </span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-deep text-white">
              <Icon.search className="h-4 w-4" />
            </span>
          </button>

          <div className="ml-auto flex items-center gap-1.5">
            <IconAction onClick={() => setSearchOpen(true)} label="Search" className="lg:hidden">
              <Icon.search className="h-5 w-5" />
            </IconAction>

            <IconAction onClick={() => router.push('/compare')} label="Compare" badge={compare.length} caption="Compare">
              <Icon.scales className="h-5 w-5" />
            </IconAction>

            <IconAction onClick={() => router.push('/wishlist')} label="Wishlist" badge={wishlist.length} caption="Wishlist">
              <Icon.heart className="h-5 w-5" />
            </IconAction>

            <IconAction onClick={() => setCartOpen(true)} label="Cart" badge={cartCount} caption="Cart">
              <Icon.bag className="h-5 w-5" />
            </IconAction>

            <IconAction
              onClick={() => setDarkMode(!darkMode)}
              label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {darkMode ? <Icon.sun className="h-5 w-5" /> : <Icon.moon className="h-5 w-5" />}
            </IconAction>
          </div>
        </div>

        {/* Category rail — every item is a mega-menu trigger, never a link */}
        <div className="relative border-t border-white/[0.07] bg-brand-navy2/60">
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
                className={`flex items-stretch gap-1 overflow-x-auto scrollbar-none ${railMask}`}
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
                      className={`relative inline-flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap px-3.5 py-3.5 text-[13.5px] font-semibold transition-colors duration-200 ${
                        isActive ? 'text-brand-blue' : 'text-white/85 hover:text-brand-blue'
                      }`}
                    >
                      <NavIcon
                        id={item.icon}
                        className={`h-4 w-4 transition-colors ${isActive ? 'text-brand-blue' : 'text-white/45'}`}
                      />
                      {item.name}
                      {/* Active underline — matches the reference's indicator */}
                      <span
                        className={`pointer-events-none absolute inset-x-2.5 bottom-0 h-[3px] rounded-t-full bg-brand-blue transition-transform duration-200 ease-out-expo ${
                          isActive ? 'scale-x-100' : 'scale-x-0'
                        }`}
                      />
                    </button>
                  );
                })}

                {STATIC_LINKS.map(link => (
                  <Link
                    key={link.url}
                    href={link.url}
                    className="relative inline-flex shrink-0 items-center whitespace-nowrap px-3.5 py-3.5 text-[13.5px] font-semibold text-white/85 transition-colors duration-200 hover:text-brand-blue"
                  >
                    {link.name}
                  </Link>
                ))}
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

// 44px minimum target, badge, and an optional caption under the glyph so the
// action is not icon-only on wide screens.
function IconAction({ onClick, label, badge = 0, caption, className = '', children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`relative flex h-11 min-w-[44px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-white/85 transition hover:bg-white/[0.07] hover:text-brand-blue ${className}`}
    >
      {children}
      {caption && <span className="hidden text-[9px] font-semibold leading-none xl:block">{caption}</span>}
      {badge > 0 && (
        <span
          className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-blue px-1 text-[10px] font-extrabold text-white shadow-glow"
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
      className={`absolute top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-brand-navy text-white shadow-lg transition hover:border-brand-blue hover:text-brand-blue ${
        isLeft ? 'left-0' : 'right-0'
      }`}
    >
      {isLeft ? <Icon.chevronLeft className="h-4 w-4" /> : <Icon.chevronRight className="h-4 w-4" />}
    </button>
  );
}

