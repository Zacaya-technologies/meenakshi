'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useApp } from '@/lib/store';
import { useBusiness, cartQuoteLink } from '@/lib/business';
import { FALLBACK_IMG, formatBoxPrice, hasPrice } from '@/lib/api';
import { buildCalculatorLink } from '@/lib/calculator';
import { Icon } from '@/components/ui/Icons';

const UNDO_MS = 6000;
const ease = [0.22, 1, 0.36, 1];

export default function CartPage() {
  const business = useBusiness();
  const reduceMotion = useReducedMotion();
  const { cart, hydrated, updateCartQty, removeFromCart, restoreCartItem, cartTotal } = useApp();
  const [removed, setRemoved] = useState(null);
  const undoTimer = useRef(null);
  useEffect(() => () => clearTimeout(undoTimer.current), []);

  const boxes = cart.reduce((n, i) => n + i.quantityBoxes, 0);
  const onRequestCount = cart.filter(i => !hasPrice(i.product)).length;

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

  // The cart lives in localStorage; avoid flashing "empty" before it loads.
  if (!hydrated) return <div className="min-h-[50vh]" />;

  if (cart.length === 0 && !removed) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-[1380px] flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-white/5">
          <Icon.bag className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Your cart is empty</h1>
        <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          Add the tiles you like and request one quote for all of them on WhatsApp.
        </p>
        <Link href="/shop" className="mt-6 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-deep dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
          Browse tiles
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex items-baseline justify-between gap-4 border-b border-slate-200 pb-5 dark:border-white/10">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Cart</h1>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {cart.length} {cart.length === 1 ? 'item' : 'items'} · {boxes} {boxes === 1 ? 'box' : 'boxes'}
        </span>
      </div>

      <div className="grid gap-10 pt-2 lg:grid-cols-[1fr_340px] lg:gap-14">
        <section aria-label="Items in your cart">
          <AnimatePresence>
            {removed && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: reduceMotion ? 0 : 0.18 }}
                className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white dark:bg-white dark:text-slate-900"
                role="status"
              >
                <span className="truncate">Removed {removed.item.product.name}</span>
                <button onClick={undo} className="shrink-0 font-semibold text-brand-blue hover:underline dark:text-brand-deep">Undo</button>
              </motion.div>
            )}
          </AnimatePresence>

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
                    <div className="flex gap-4 py-6 sm:gap-6">
                      <Link href={`/product/${p.slug}`} className="h-28 w-24 shrink-0 overflow-hidden rounded-md bg-slate-100 ring-1 ring-inset ring-black/5 dark:bg-navy sm:h-36 sm:w-28">
                        <img src={p.image_url || p.primary_image || FALLBACK_IMG} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                          <div className="min-w-0">
                            {p.collection_name && (
                              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{p.collection_name}</p>
                            )}
                            <Link href={`/product/${p.slug}`} className="mt-0.5 block text-[15px] font-medium leading-snug text-slate-900 transition-colors hover:text-brand-deep dark:text-white dark:hover:text-brand-blue">
                              {p.name}
                            </Link>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              {[p.size, p.finish, p.color].filter(Boolean).join(' · ')}
                            </p>
                            {p.sku && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">SKU {p.sku}</p>}
                          </div>
                          <p className="shrink-0 text-sm text-slate-700 dark:text-slate-200 sm:text-right">
                            {hasPrice(p) ? formatBoxPrice(p) : <span className="text-slate-500 dark:text-slate-400">Price on request</span>}
                          </p>
                        </div>

                        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-4">
                          <div className="inline-flex h-9 items-center rounded-full border border-slate-300 dark:border-white/15">
                            <button
                              onClick={() => updateCartQty(p.id, item.quantityBoxes - 1)}
                              disabled={item.quantityBoxes <= 1}
                              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-300 dark:hover:text-white"
                              aria-label="Decrease boxes"
                            >
                              <span aria-hidden className="text-lg leading-none">−</span>
                            </button>
                            <span className="min-w-[4.5rem] text-center text-sm font-medium tabular-nums text-slate-900 dark:text-white" aria-live="polite">
                              {item.quantityBoxes} {item.quantityBoxes === 1 ? 'box' : 'boxes'}
                            </span>
                            <button
                              onClick={() => updateCartQty(p.id, item.quantityBoxes + 1)}
                              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                              aria-label="Increase boxes"
                            >
                              <span aria-hidden className="text-lg leading-none">+</span>
                            </button>
                          </div>
                          <Link href={buildCalculatorLink(p)} className="text-sm text-slate-500 underline-offset-4 transition-colors hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-white">
                            How many boxes?
                          </Link>
                          <button
                            onClick={() => remove(item, index)}
                            className="text-sm text-slate-500 underline-offset-4 transition-colors hover:text-rose-600 hover:underline dark:text-slate-400"
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
        </section>

        <aside aria-label="Summary" className="lg:pt-6">
          <div className="rounded-xl bg-slate-50 p-6 ring-1 ring-inset ring-slate-200 dark:bg-white/[0.03] dark:ring-white/10 lg:sticky lg:top-[calc(var(--header-h)+24px)]">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Summary</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <dt>Items</dt><dd className="tabular-nums">{cart.length}</dd>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <dt>Boxes</dt><dd className="tabular-nums">{boxes}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 font-medium text-slate-900 dark:border-white/10 dark:text-white">
                <dt>Estimated total</dt>
                <dd className="tabular-nums">{cartTotal > 0 ? `₹${Math.round(cartTotal).toLocaleString('en-IN')}${onRequestCount ? ' +' : ''}` : 'On request'}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {onRequestCount > 0 && cartTotal > 0 && `${onRequestCount} ${onRequestCount === 1 ? 'item is' : 'items are'} priced on request. `}
              Send your list on WhatsApp and our team will confirm pricing, GST and delivery.
            </p>
            <a
              href={cartQuoteLink(business, cart)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 text-sm font-semibold text-white transition-colors hover:bg-brand-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <Icon.whatsapp className="h-4 w-4" /> Request quote on WhatsApp
            </a>
            <Link href="/shop" className="mt-3 block text-center text-sm font-medium text-slate-600 underline-offset-4 transition-colors hover:text-slate-900 hover:underline dark:text-slate-300 dark:hover:text-white">
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
