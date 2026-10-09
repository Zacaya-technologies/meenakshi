'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useApp } from '@/lib/store';
import { useBusiness, cartQuoteLink } from '@/lib/business';
import { FALLBACK_IMG, formatBoxPrice, hasPrice } from '@/lib/api';
import { Icon } from '@/components/ui/Icons';

const UNDO_MS = 5000;

export default function CartDrawer({ open, onClose }) {
  const router = useRouter();
  const business = useBusiness();
  const reduceMotion = useReducedMotion();
  const { cart, updateCartQty, removeFromCart, restoreCartItem, cartTotal } = useApp();
  const [removed, setRemoved] = useState(null); // { item, index } for Undo
  const undoTimer = useRef(null);
  const panelRef = useRef(null);

  const boxes = cart.reduce((n, i) => n + i.quantityBoxes, 0);
  const onRequest = cart.some(i => !hasPrice(i.product));

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    // Move focus into the dialog (the panel itself, so no focus ring flashes
    // on the close button for mouse users).
    const t = setTimeout(() => panelRef.current?.focus(), 60);
    return () => { document.removeEventListener('keydown', onKey); clearTimeout(t); };
  }, [open, onClose]);

  // Drop the undo offer when the drawer closes.
  useEffect(() => { if (!open) setRemoved(null); }, [open]);
  useEffect(() => () => clearTimeout(undoTimer.current), []);

  const remove = (item, index) => {
    removeFromCart(item.product.id);
    setRemoved({ item, index });
    clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setRemoved(null), UNDO_MS);
  };
  const undo = () => {
    if (!removed) return;
    restoreCartItem(removed.item, removed.index);
    clearTimeout(undoTimer.current);
    setRemoved(null);
  };
  const go = (url) => { onClose(); router.push(url); };

  const ease = [0.22, 1, 0.36, 1];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[2500] bg-slate-950/50 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.aside
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: reduceMotion ? 0 : 0.32, ease }}
            className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col bg-white outline-none shadow-[-24px_0_48px_-24px_rgba(15,23,42,0.35)] dark:bg-navy2"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 pt-5">
              <div className="flex items-baseline gap-2">
                <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Cart</h2>
                {cart.length > 0 && (
                  <span className="text-sm text-slate-400">
                    {cart.length} {cart.length === 1 ? 'item' : 'items'}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Close cart"
              >
                <Icon.close className="h-5 w-5" />
              </button>
            </div>
            <div className="mx-6 h-px bg-slate-200 dark:bg-white/10" />

            {/* Lines */}
            <div className="flex-1 overflow-y-auto px-6">
              {cart.length === 0 && !removed ? (
                <div className="flex h-full flex-col items-center justify-center pb-16 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5">
                    <Icon.bag className="h-6 w-6" />
                  </span>
                  <p className="mt-4 font-semibold text-slate-900 dark:text-white">Your cart is empty</p>
                  <p className="mt-1 max-w-[16rem] text-sm text-slate-500 dark:text-slate-400">
                    Add tiles you like and request a single quote for all of them.
                  </p>
                  <button
                    onClick={() => go('/shop')}
                    className="mt-6 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-deep dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    Browse tiles
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-slate-200 dark:divide-white/10">
                  <AnimatePresence initial={false}>
                    {cart.map((item, index) => {
                      const p = item.product;
                      return (
                        <motion.li
                          key={p.id}
                          layout={!reduceMotion}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0, transition: { duration: reduceMotion ? 0 : 0.22 } }}
                          transition={{ duration: reduceMotion ? 0 : 0.25, ease }}
                          className="overflow-hidden"
                        >
                          <div className="flex gap-4 py-5">
                            <Link
                              href={`/product/${p.slug}`}
                              onClick={onClose}
                              className="h-[88px] w-[72px] shrink-0 overflow-hidden rounded-md bg-slate-100 ring-1 ring-inset ring-black/5 dark:bg-navy"
                            >
                              <img
                                src={p.image_url || p.primary_image || FALLBACK_IMG}
                                alt={p.name}
                                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                              />
                            </Link>

                            <div className="flex min-w-0 flex-1 flex-col">
                              <div className="flex items-start justify-between gap-3">
                                <Link
                                  href={`/product/${p.slug}`}
                                  onClick={onClose}
                                  className="line-clamp-2 text-sm font-medium leading-snug text-slate-900 transition-colors hover:text-brand-deep dark:text-white dark:hover:text-brand-blue"
                                >
                                  {p.name}
                                </Link>
                                <span className="shrink-0 text-right text-sm text-slate-600 dark:text-slate-300">
                                  {hasPrice(p) ? formatBoxPrice(p) : ''}
                                </span>
                              </div>
                              <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                                {[p.size, p.finish].filter(Boolean).join(' · ')}
                              </p>
                              {!hasPrice(p) && (
                                <p className="mt-0.5 text-xs text-slate-400">Price on request</p>
                              )}

                              <div className="mt-auto flex items-center justify-between pt-3">
                                <div className="inline-flex h-8 items-center rounded-full border border-slate-300 dark:border-white/15">
                                  <button
                                    onClick={() => updateCartQty(p.id, item.quantityBoxes - 1)}
                                    disabled={item.quantityBoxes <= 1}
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition-colors hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-300 dark:hover:text-white"
                                    aria-label={`Fewer boxes of ${p.name}`}
                                  >
                                    <span aria-hidden className="text-base leading-none">−</span>
                                  </button>
                                  <span className="min-w-[4.25rem] text-center text-xs font-medium tabular-nums text-slate-900 dark:text-white" aria-live="polite">
                                    {item.quantityBoxes} {item.quantityBoxes === 1 ? 'box' : 'boxes'}
                                  </span>
                                  <button
                                    onClick={() => updateCartQty(p.id, item.quantityBoxes + 1)}
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                                    aria-label={`More boxes of ${p.name}`}
                                  >
                                    <span aria-hidden className="text-base leading-none">+</span>
                                  </button>
                                </div>
                                <button
                                  onClick={() => remove(item, index)}
                                  className="text-xs font-medium text-slate-500 underline-offset-4 transition-colors hover:text-rose-600 hover:underline dark:text-slate-400"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* Undo bar */}
            <AnimatePresence>
              {removed && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: reduceMotion ? 0 : 0.18 }}
                  className="mx-6 mb-3 flex items-center justify-between gap-3 rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg dark:bg-white dark:text-slate-900"
                  role="status"
                >
                  <span className="truncate">Removed {removed.item.product.name}</span>
                  <button onClick={undo} className="shrink-0 font-semibold text-brand-blue hover:underline dark:text-brand-deep">
                    Undo
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Summary */}
            {cart.length > 0 && (
              <div className="border-t border-slate-200 px-6 pb-6 pt-4 dark:border-white/10" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <dt>Quantity</dt>
                    <dd className="tabular-nums">{boxes} {boxes === 1 ? 'box' : 'boxes'}</dd>
                  </div>
                  <div className="flex justify-between font-medium text-slate-900 dark:text-white">
                    <dt>Estimated total</dt>
                    <dd className="tabular-nums">
                      {cartTotal > 0 ? `₹${Math.round(cartTotal).toLocaleString('en-IN')}${onRequest ? ' +' : ''}` : 'On request'}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Send your list on WhatsApp and our team will confirm pricing, GST and delivery.
                </p>

                <a
                  href={cartQuoteLink(business, cart)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 text-sm font-semibold text-white transition-colors hover:bg-brand-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 dark:focus-visible:ring-offset-navy2"
                >
                  <Icon.whatsapp className="h-4 w-4" /> Request quote on WhatsApp
                </a>
                <button
                  onClick={() => go('/cart')}
                  className="mt-3 w-full text-center text-sm font-medium text-slate-600 underline-offset-4 transition-colors hover:text-slate-900 hover:underline dark:text-slate-300 dark:hover:text-white"
                >
                  View full cart
                </button>
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
