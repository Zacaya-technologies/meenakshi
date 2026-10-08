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
    <div
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
                icon={<Icon.phone className="h-4 w-4" />}
                title="Call now"
                subtitle={business.primary_phone}
              />
              <ContactRow
                href={waLink(business.whatsapp_number, waGreeting(business))}
                icon={<Icon.whatsapp className="h-4 w-4" />}
                title="WhatsApp us"
                subtitle={business.primary_phone}
              />
              <ContactRow
                href={`mailto:${business.email}`}
                icon={<Icon.mail className="h-4 w-4" />}
                title="Email us"
                subtitle={business.email}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <a
        href={`https://wa.me/${String(business.whatsapp_number || '').replace(/\D/g, '')}?text=${encodeURIComponent(waGreeting(business))}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="hidden h-14 w-14 sm:flex items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_28px_rgba(37,211,102,0.45)] transition duration-200 hover:scale-105 active:scale-95"
      >
        <Icon.whatsapp className="h-7 w-7" />
      </a>

      {/* Direct WhatsApp/Call buttons from sm up; phones get the single
          contact button below (its panel has WhatsApp, Call and Email) so the
          rail does not cover page content. */}
      <a
        href={telHref(business.primary_phone)}
        aria-label={`Call ${business.business_name} at ${business.primary_phone}`}
        className="hidden h-14 w-14 sm:flex items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-deep text-white shadow-glow transition duration-200 hover:scale-105 active:scale-95"
      >
        <Icon.phoneCall className="h-6 w-6" />
      </a>

      <button
        type="button"
        onClick={() => setChatOpen(o => !o)}
        aria-expanded={chatOpen}
        aria-label={chatOpen ? 'Close contact options' : 'Open contact options'}
        className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-deep text-white shadow-glow transition duration-200 hover:scale-105 active:scale-95"
      >
        {chatOpen ? <Icon.close className="h-6 w-6" /> : <Icon.chat className="h-6 w-6" />}
      </button>
    </div>
  );
}

function ContactRow({ href, icon, title, subtitle }) {
  return (
    <a
      href={href}
      className="flex min-h-[56px] items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-brand-blue/8 dark:hover:bg-white/5"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-blue/12 text-brand-blue">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-bold text-ink dark:text-white">{title}</span>
        <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</span>
      </span>
    </a>
  );
}
