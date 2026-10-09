'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Icon } from '@/components/ui/Icons';
import { useBusiness, telHref, waLink, waGreeting } from '@/lib/business';

/**
 * Persistent right-edge contact rail (WhatsApp + call + enquiry), matching the
 * reference. Sits below the header stack and clear of the bottom safe area so
 * it never covers system gesture affordances. All contact details come from
 * the central business settings.
 */
export default function FloatingActions() {
  const reduceMotion = useReducedMotion();
  const [chatOpen, setChatOpen] = useState(false);
  const business = useBusiness();
  // Product pages have a sticky add-to-cart bar along the bottom below lg;
  // lift the rail above it so it never covers the bar's buttons.
  const pathname = usePathname();
  const overBottomBar = pathname?.startsWith('/product/');

  useEffect(() => {
    if (!chatOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setChatOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [chatOpen]);

  // Customer contact rail is meaningless inside the admin console.
  if (pathname?.startsWith('/admin')) return null;

  return (
    <aside
      aria-label="Contact us"
      className={`floating-rail fixed right-4 z-[1200] flex flex-col items-end gap-3 ${overBottomBar ? 'floating-rail--above-bar' : ''}`}
    >
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: 'easeOut' }}
            /* Scales from the button it belongs to, so the panel reads as
               belonging to that control rather than appearing from nowhere. */
            style={{ transformOrigin: 'bottom right' }}
            className="w-[min(300px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-white shadow-2xl dark:border-white/10 dark:bg-navy2"
            role="dialog"
            aria-label="Contact options"
          >
            <div className="flex items-center justify-between bg-brand-navy px-4 py-3">
              <span className="font-heading text-sm font-bold text-white">Talk to our experts</span>
              <button
                onClick={() => setChatOpen(false)}
                aria-label="Close contact options"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <Icon.close className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3">
              <p className="mb-3 px-1 text-xs text-slate-500 dark:text-slate-400">
                {business.business_hours}. Get expert help for your home or project.
              </p>
              <ContactRow
                href={telHref(business.primary_phone)}
                icon={<Icon.phoneSolid className="h-4 w-4" />}
                tone="bg-brand-navy text-white dark:bg-white/10"
                title="Call now"
                subtitle={business.primary_phone}
              />
              <ContactRow
                href={waLink(business.whatsapp_number, waGreeting(business))}
                icon={<Icon.whatsapp className="h-[18px] w-[18px]" />}
                tone="bg-[#25D366] text-white"
                title="WhatsApp us"
                subtitle={business.primary_phone}
              />
              <ContactRow
                href={`mailto:${business.email}`}
                icon={<Icon.mail className="h-4 w-4" />}
                tone="bg-brand-blue text-white"
                title="Email us"
                subtitle={business.email}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* One dock instead of loose glowing circles. Direct WhatsApp/Call
          buttons from sm up; phones get only the enquiry button (its panel
          has WhatsApp, Call and Email) so the dock never covers content. */}
      <div className="flex flex-col items-center gap-1.5 rounded-full bg-white/95 p-1.5 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/5 backdrop-blur dark:bg-navy2/95 dark:ring-white/10">
        <DockButton
          href={waLink(business.whatsapp_number, waGreeting(business))}
          external
          label="WhatsApp us"
          className="hidden bg-[#25D366] hover:bg-[#1EBE5A] sm:flex"
        >
          <Icon.whatsapp className="h-6 w-6" />
        </DockButton>
        <DockButton
          href={telHref(business.primary_phone)}
          label="Call now"
          ariaLabel={`Call ${business.business_name} at ${business.primary_phone}`}
          className="hidden bg-brand-navy hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/20 sm:flex"
        >
          <Icon.phoneSolid className="h-5 w-5" />
        </DockButton>
        <DockButton
          onClick={() => setChatOpen(o => !o)}
          label={chatOpen ? 'Close' : 'Send an enquiry'}
          ariaLabel={chatOpen ? 'Close contact options' : 'Open contact options'}
          expanded={chatOpen}
          className="flex bg-brand-blue hover:bg-brand-deep"
        >
          {chatOpen ? <Icon.close className="h-5 w-5" /> : <Icon.chatSolid className="h-5 w-5" />}
        </DockButton>
      </div>
    </aside>
  );
}

const DOCK_BTN = 'group/dock relative h-12 w-12 items-center justify-center rounded-full text-white shadow-sm transition duration-200 ease-out hover:scale-[1.06] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-navy2';

function DockButton({ href, onClick, external, label, ariaLabel, expanded, className, children }) {
  const tip = (
    // Label slides out to the left on hover; hidden on touch screens.
    <span className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition duration-150 group-hover/dock:translate-x-0 group-hover/dock:opacity-100 [@media(hover:none)]:hidden">
      {label}
    </span>
  );
  if (href) {
    return (
      <a
        href={href}
        aria-label={ariaLabel || label}
        className={`${DOCK_BTN} ${className}`}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
        {tip}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel || label} aria-expanded={expanded} className={`${DOCK_BTN} ${className}`}>
      {children}
      {tip}
    </button>
  );
}

function ContactRow({ href, icon, tone, title, subtitle }) {
  return (
    <a
      href={href}
      className="flex min-h-[56px] items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-brand-blue/8 dark:hover:bg-white/5"
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone}`}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-bold text-ink dark:text-white">{title}</span>
        <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</span>
      </span>
    </a>
  );
}
