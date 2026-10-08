'use client';

import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '@/lib/store';
import { useBusiness, cartQuoteLink } from '@/lib/business';
import { FALLBACK_IMG, formatBoxPrice } from '@/lib/api';
import { Icon } from '@/components/ui/Icons';

export default function CartDrawer({ open, onClose }) {
  const router = useRouter();
  const business = useBusiness();
  const { cart, updateCartQty, removeFromCart, cartTotal } = useApp();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[2500] bg-navy/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-navy2"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-heading text-lg font-bold text-ink dark:text-white">Your Cart</h3>
              <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-ink dark:bg-white/10 dark:text-white" aria-label="Close">
                <Icon.close className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Icon.bag className="h-14 w-14 text-slate-300" />
                  <p className="mt-4 font-semibold text-ink dark:text-white">Your cart is empty</p>
                  <p className="mt-1 text-sm text-slate-400">Browse our tiles and add your favourites.</p>
                  <button
                    onClick={() => { onClose(); router.push('/shop'); }}
                    className="mt-5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-deep px-6 py-2.5 text-sm font-bold text-white"
                  >
                    Explore Tiles
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex gap-3 rounded-2xl border border-border p-3">
                      <img src={item.product.image_url || item.product.primary_image || FALLBACK_IMG} alt={item.product.name} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="truncate text-sm font-semibold text-ink dark:text-white">{item.product.name}</div>
                        <div className="text-xs text-slate-400">{item.product.size}</div>
                        <div className="mt-1 text-sm font-bold text-brand-blue">
                          {formatBoxPrice(item.product)}
                        </div>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-1 rounded-lg border border-border dark:border-white/10">
                            <button onClick={() => updateCartQty(item.product.id, item.quantityBoxes - 1)} disabled={item.quantityBoxes <= 1} className="px-2 py-1 text-ink disabled:opacity-30 dark:text-white" aria-label="Decrease boxes">−</button>
                            <span className="min-w-[4rem] text-center text-sm font-semibold text-ink dark:text-white">{item.quantityBoxes} box{item.quantityBoxes > 1 ? 'es' : ''}</span>
                            <button onClick={() => updateCartQty(item.product.id, item.quantityBoxes + 1)} className="px-2 py-1 text-ink dark:text-white" aria-label="Increase boxes">+</button>
                          </div>
                          <button onClick={() => removeFromCart(item.product.id)} className="text-slate-400 transition hover:text-red-500" aria-label="Remove">
                            <Icon.close className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-border px-5 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-slate-500">Total</span>
                  <span className="font-heading text-xl font-extrabold text-brand-blue">
                    {cartTotal > 0 ? `₹${Math.round(cartTotal).toLocaleString('en-IN')}` : 'On Request'}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { onClose(); router.push('/cart'); }}
                    className="flex-1 rounded-xl border-[1.5px] border-brand-blue py-3 text-sm font-bold text-brand-blue transition hover:bg-brand-blue/5"
                  >
                    View Cart
                  </button>
                  <a
                    href={cartQuoteLink(business, cart)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-deep py-3 text-sm font-bold text-white"
                  >
                    <Icon.whatsapp className="h-4 w-4" /> Get Quote
                  </a>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
