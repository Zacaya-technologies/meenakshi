'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '@/lib/store';
import { FALLBACK_IMG, discountPct, formatPrice } from '@/lib/api';
import { Icon } from '@/components/ui/Icons';

export default function QuickView({ product, onClose }) {
  const router = useRouter();
  const { addToCart, toggleWishlist, wishlist } = useApp();
  const off = discountPct(product);
  const inWish = wishlist.some(p => p.id === product.id);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          className="fixed inset-0 z-[4000] flex items-center justify-center bg-navy/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[22px] bg-white p-6 shadow-2xl dark:bg-navy2"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-ink dark:bg-white/10 dark:text-white"
              aria-label="Close"
            >
              <Icon.close className="h-5 w-5" />
            </button>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="min-h-[340px] overflow-hidden rounded-2xl bg-slate-100 dark:bg-navy">
                <img
                  src={product.primary_image || product.image_url || FALLBACK_IMG}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                {off > 0 && (
                  <span className="mb-2 inline-block rounded-full bg-rose-500 px-2.5 py-1 text-[11px] font-extrabold text-white">
                    {off}% OFF
                  </span>
                )}
                <h3 className="font-heading text-2xl font-bold text-ink dark:text-white">{product.name}</h3>
                <p className="mb-3 mt-1 text-sm text-slate-400">{product.brand_name} • {product.tile_size}</p>

                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-3xl font-extrabold text-brand-blue">{formatPrice(product)}</span>
                  {off > 0 && <span className="text-sm text-slate-400 line-through">₹{Number(product.price).toLocaleString('en-IN')}</span>}
                  <span className="text-xs text-slate-400">/sq.ft</span>
                </div>

                {product.stock > 0 ? (
                  <div className="mt-3 flex items-center gap-1.5 text-sm font-bold text-green-600">
                    <span className="h-2 w-2 rounded-full bg-green-500" /> In Stock
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-1.5 text-sm font-bold text-rose-500">
                    <span className="h-2 w-2 rounded-full bg-rose-500" /> Out of Stock
                  </div>
                )}

                <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {product.description}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => addToCart(product)}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-deep px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5"
                  >
                    <Icon.bag className="h-4 w-4" /> Add to Cart
                  </button>
                  <button
                    onClick={() => router.push(`/product/${product.slug}`)}
                    className="rounded-xl border-[1.5px] border-brand-blue px-6 py-3 text-sm font-bold text-brand-blue transition hover:bg-brand-blue/5"
                  >
                    Full Details
                  </button>
                  <button
                    onClick={() => toggleWishlist(product)}
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border border-border text-ink transition dark:text-white ${inWish ? 'bg-brand-blue text-white border-brand-blue' : ''}`}
                    aria-label="Wishlist"
                  >
                    <Icon.heart className={`h-5 w-5 ${inWish ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

