'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '@/lib/store';
import { useBusiness, waLink } from '@/lib/business';
import { FALLBACK_IMG, discountPct, formatPrice, hasPrice } from '@/lib/api';
import { Icon } from '@/components/ui/Icons';
import { useOverlay } from '@/lib/useOverlay';

export default function QuickView({ product, onClose }) {
  const router = useRouter();
  const business = useBusiness();
  const { addToCart, toggleWishlist, wishlist } = useApp();
  const off = discountPct(product);
  // QuickView stays mounted with product=null while closed.
  const inWish = !!product && wishlist.some(p => p.id === product.id);

  const closeRef = useRef(null);
  useOverlay(!!product, onClose, closeRef);

  // Keep the page behind the dialog from scrolling while it is open.
  useEffect(() => {
    if (!product) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, [product]);

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
            role="dialog"
            aria-modal="true"
            aria-label={product.name}
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-navy2"
            onClick={e => e.stopPropagation()}
          >
            <button
              ref={closeRef}
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
                <p className="mb-3 mt-1 text-sm text-slate-500 dark:text-slate-400">{product.brand_name} • {product.size}</p>

                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-3xl font-extrabold text-brand-blue">{formatPrice(product)}</span>
                  {off > 0 && <span className="text-sm text-slate-500 line-through">₹{Number(product.price).toLocaleString('en-IN')}</span>}
                  {hasPrice(product) && <span className="text-xs text-slate-500 dark:text-slate-400">/sq.ft</span>}
                </div>

                {product.stock > 0 ? (
                  <div className="mt-3 flex items-center gap-1.5 text-sm font-bold text-green-700 dark:text-green-500">
                    <span className="h-2 w-2 rounded-full bg-green-500" /> In Stock
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-1.5 text-sm font-bold text-rose-600 dark:text-rose-400">
                    <span className="h-2 w-2 rounded-full bg-rose-500" /> Out of Stock
                  </div>
                )}

                <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {product.description}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock !== undefined && product.stock !== null && product.stock <= 0}
                    className="flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-white/10 dark:hover:bg-brand-blue"
                  >
                    <Icon.bag className="h-4 w-4" /> Add to Cart
                  </button>
                  <button
                    onClick={() => router.push(`/product/${product.slug}`)}
                    className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-900 dark:border-white/20 dark:text-white dark:hover:border-white"
                  >
                    Full Details
                  </button>
                  <button
                    onClick={() => toggleWishlist(product)}
                    className={`flex h-[46px] w-[46px] items-center justify-center rounded-lg border transition-colors ${inWish ? 'border-rose-200 bg-rose-50 text-rose-600 dark:text-rose-400 dark:border-rose-500/30 dark:bg-rose-500/10' : 'border-slate-300 text-slate-700 hover:border-slate-900 dark:border-white/20 dark:text-white'}`}
                    aria-label={inWish ? 'Remove from wishlist' : 'Add to wishlist'}
                    aria-pressed={inWish}
                  >
                    <Icon.heart className={`h-5 w-5 ${inWish ? 'fill-current' : ''}`} />
                  </button>
                </div>
                <a
                  href={waLink(business.whatsapp_number, `Hi ${business.business_name}, I'm interested in "${product.name}" (SKU: ${product.sku}${product.size ? `, ${product.size}` : ''}). Please share the price and availability.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0E7A6E] hover:underline dark:text-[#25D366]"
                >
                  <Icon.whatsapp className="h-4 w-4" /> Enquire on WhatsApp
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

