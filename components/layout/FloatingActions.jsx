'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Icon } from '@/components/ui/Icons';

const WHATSAPP_NUMBER = '919876543210';
const SALES_NUMBER = '+919876543210';

/**
 * Persistent right-edge contact rail (WhatsApp + enquiry), matching the
 * reference. Sits below the header stack and clear of the bottom safe area so
 * it never covers system gesture affordances.
 */
export default function FloatingActions() {
  const reduceMotion = useReducedMotion();
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (!chatOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setChatOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [chatOpen]);

  return (
    <div
      className="fixed right-4 z-[1200] flex flex-col items-end gap-3"
      style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
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
            className="w-[300px] overflow-hidden rounded-2xl border border-border bg-white shadow-2xl dark:border-white/10 dark:bg-navy2"
            role="dialog"
            aria-label="Contact options"
          >
            <div className="flex items-center justify-between bg-brand-navy px-4 py-3">
              <span className="font-heading text-sm font-bold text-white">Talk to a tile expert</span>
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
                Mon–Sat, 9:30 AM – 7:00 PM IST. Share your area in sq.ft for a same-day quote.
              </p>
              <ContactRow
                href={`tel:${SALES_NUMBER}`}
                icon={<Icon.phone className="h-4 w-4" />}
                title="Call sales"
                subtitle={SALES_NUMBER}
              />
              <ContactRow
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                icon={<Icon.whatsapp className="h-4 w-4" />}
                title="WhatsApp us"
                subtitle="Fastest reply — send a photo of your space"
              />
              <ContactRow
                href="mailto:sales@meenakshibuildworld.com"
                icon={<Icon.mail className="h-4 w-4" />}
                title="Email"
                subtitle="sales@meenakshibuildworld.com"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_28px_rgba(37,211,102,0.45)] transition duration-200 hover:scale-105 active:scale-95"
      >
        <Icon.whatsapp className="h-7 w-7" />
      </a>

      <button
        type="button"
        onClick={() => setChatOpen(o => !o)}
        aria-expanded={chatOpen}
        aria-label={chatOpen ? 'Close contact options' : 'Open contact options'}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-deep text-white shadow-glow transition duration-200 hover:scale-105 active:scale-95"
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
