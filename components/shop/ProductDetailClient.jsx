'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { API, FALLBACK_IMG, discountPct, formatPrice } from '@/lib/api';
import { useApp } from '@/lib/store';
import { Icon } from '@/components/ui/Icons';

const SWIPE_THRESHOLD = 60;

export default function ProductDetailClient({ slug }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { addToCart, toggleWishlist, wishlist, toggleCompare, compare } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    API.getProductBySlug(slug).then(res => {
      if (cancelled) return;
      if (res.success) {
        setData(res);
        setActiveImg(0);
      } else {
        setData(null);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return <div className="mx-auto max-w-[1380px] px-6 py-16 text-center text-slate-400">Loading product…</div>;
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-[1380px] px-6 py-24 text-center">
        <h1 className="font-heading text-2xl font-bold text-ink dark:text-white">Product not found</h1>
        <Link href="/shop" className="mt-4 inline-block rounded-xl bg-brand-blue px-6 py-3 text-sm font-bold text-white">Back to Shop</Link>
      </div>
    );
  }

  const { product, images, related, specifications = [], variants = [] } = data;
  const off = discountPct(product);
  const gallery = (images?.length ? images : [{ image_url: FALLBACK_IMG }]);
  const inWish = wishlist.some(p => p.id === product.id);
  const inCompare = compare.some(p => p.id === product.id);
  const buyMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('buy');

  return (
    <div className="mx-auto max-w-[1380px] px-6 py-8 pb-28 lg:pb-8">
      {/* Breadcrumb — built from the product's live main-category tag */}
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
        <Link href="/" className="transition hover:text-brand-blue">Home</Link>
        <Icon.arrowRight className="h-3.5 w-3.5" />
        <Link href="/shop" className="transition hover:text-brand-blue">Shop</Link>
        {product.category_name && product.category_slug && (
          <>
            <Icon.arrowRight className="h-3.5 w-3.5" />
            <Link href={`/${product.category_slug}`} className="transition hover:text-brand-blue">{product.category_name}</Link>
          </>
        )}
        <Icon.arrowRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-ink dark:text-white">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery — swipeable on touch devices, thumbnail strip on desktop */}
        <div>
          <div className="relative touch-pan-y select-none overflow-hidden rounded-3xl bg-slate-100 dark:bg-navy">
            <motion.div
              key={activeImg}
              drag={gallery.length > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.65}
              onDragEnd={(e, info) => {
                if (info.offset.x < -SWIPE_THRESHOLD && activeImg < gallery.length - 1) setActiveImg(i => i + 1);
                else if (info.offset.x > SWIPE_THRESHOLD && activeImg > 0) setActiveImg(i => i - 1);
              }}
              initial={reduceMotion ? false : { opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <img src={gallery[activeImg]?.image_url || FALLBACK_IMG} alt={product.name} className="h-[420px] w-full object-cover" draggable={false} />
            </motion.div>
            {off > 0 && (
              <span className="absolute left-4 top-4 rounded-full bg-rose-500 px-3 py-1.5 text-xs font-extrabold text-white">{off}% OFF</span>
            )}
            {gallery.length > 1 && (
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 sm:hidden">
                {gallery.map((_, i) => (
                  <span key={i} className={`h-1.5 rounded-full transition-all ${i === activeImg ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`} />
                ))}
              </div>
            )}
            {gallery.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImg(i => Math.max(0, i - 1))}
                  disabled={activeImg === 0}
                  className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-lg transition disabled:opacity-0 sm:flex"
                  aria-label="Previous image"
                >
                  <Icon.chevronLeft className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={() => setActiveImg(i => Math.min(gallery.length - 1, i + 1))}
                  disabled={activeImg === gallery.length - 1}
                  className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-lg transition disabled:opacity-0 sm:flex"
                  aria-label="Next image"
                >
                  <Icon.chevronRight className="h-4.5 w-4.5" />
                </button>
              </>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 hidden gap-3 sm:flex">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`h-20 w-20 overflow-hidden rounded-xl border-2 transition ${i === activeImg ? 'border-brand-blue' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {product.category_name && (
              <Link href={`/${product.category_slug}`} className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-bold text-brand-blue transition hover:bg-brand-blue/20">
                {product.category_name}
              </Link>
            )}
            {product.type && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-white/10">{product.type}</span>}
            {product.size && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-white/10">{product.size}</span>}
          </div>

          <h1 className="font-heading text-3xl font-extrabold text-ink dark:text-white">{product.name}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {product.brand_name} • SKU: {product.sku}
          </p>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-heading text-4xl font-extrabold text-brand-blue">{formatPrice(product)}</span>
            {off > 0 && <span className="text-lg text-slate-400 line-through">₹{Number(product.price).toLocaleString('en-IN')}</span>}
            <span className="text-sm text-slate-400">/sq.ft</span>
          </div>

          {product.description && (
            <p className="mt-5 leading-relaxed text-slate-500 dark:text-slate-400">{product.description}</p>
          )}

          <div className="mt-5 flex items-center gap-2">
            <div className="flex text-amber-500">
              {[1, 2, 3, 4, 5].map(i => (
                <Icon.starFill key={i} className={`h-4 w-4 ${i <= Math.round(product.rating_avg || 0) ? '' : 'opacity-25'}`} />
              ))}
            </div>
            <span className="text-sm text-slate-400">{product.rating_avg} · {product.reviews_count} reviews</span>
          </div>

          <div className="mt-5 flex items-center gap-2 text-sm font-bold text-green-600">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
          </div>

          {/* Specs */}
          <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-border bg-brand-light p-4 dark:bg-navy dark:border-white/10 sm:grid-cols-3">
            <Spec label="Type" value={product.type} />
            <Spec label="Finish" value={product.finish} />
            <Spec label="Design" value={product.design} />
            <Spec label="Colour" value={product.color} />
            <Spec label="Size" value={product.size} />
            <Spec label={product.application ? 'Application' : 'Area'} value={product.application || product.area} />
          </div>

          {/* Size / variant picker */}
          {variants.length > 1 && (
            <div className="mt-5">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Available Sizes</span>
              <div className="flex flex-wrap gap-2">
                {variants.map(v => (
                  <span
                    key={v.id}
                    className={`rounded-lg border-[1.5px] px-3 py-2 text-xs font-semibold ${v.is_default ? 'border-brand-blue bg-brand-blue/10 text-brand-blue' : 'border-border text-slate-500 dark:border-white/10 dark:text-slate-300'}`}
                  >
                    {v.size_name || v.sku}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => addToCart(product)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-deep px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 sm:flex-none"
            >
              <Icon.bag className="h-4 w-4" /> Add to Cart
            </button>
            <button
              onClick={() => { addToCart(product); router.push('/cart'); }}
              className={`flex-1 rounded-xl border-[1.5px] border-brand-blue px-6 py-3.5 text-sm font-bold text-brand-blue transition hover:bg-brand-blue/5 sm:flex-none ${buyMode ? 'bg-brand-blue/10' : ''}`}
            >
              Buy Now
            </button>
            <button
              onClick={() => toggleWishlist(product)}
              className={`flex h-12 w-12 items-center justify-center rounded-xl border border-border transition dark:border-white/10 ${inWish ? 'bg-brand-blue text-white border-brand-blue' : 'text-ink dark:text-white'}`}
              aria-label="Wishlist"
            >
              <Icon.heart className={`h-5 w-5 ${inWish ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={() => toggleCompare(product)}
              className={`flex h-12 w-12 items-center justify-center rounded-xl border border-border transition dark:border-white/10 ${inCompare ? 'bg-brand-blue text-white border-brand-blue' : 'text-ink dark:text-white'}`}
              aria-label="Compare"
            >
              <Icon.scales className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Technical specifications — dynamic per category (category_attributes) */}
      {specifications.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 font-heading text-xl font-extrabold text-ink dark:text-white">Technical Specifications</h2>
          <div className="grid grid-cols-1 gap-x-8 gap-y-2 rounded-2xl border border-border bg-white p-5 dark:bg-navy2 dark:border-white/10 sm:grid-cols-2">
            {specifications.map(s => (
              <div key={s.name} className="flex items-center justify-between border-b border-dashed border-border py-2 text-sm dark:border-white/10">
                <span className="text-slate-400">{s.name}</span>
                <span className="font-semibold text-ink dark:text-white">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related */}
      {related?.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 font-heading text-2xl font-extrabold text-ink dark:text-white">You May Also Like</h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {related.map(r => (
              <button
                key={r.id}
                onClick={() => { router.push(`/product/${r.slug}`); }}
                className="group overflow-hidden rounded-2xl border border-border bg-white text-left transition hover:border-brand-blue/50 hover:shadow-hover dark:bg-navy2 dark:border-white/10"
              >
                <div className="h-40 overflow-hidden bg-slate-100 dark:bg-navy">
                  <img src={r.primary_image || FALLBACK_IMG} alt={r.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                </div>
                <div className="p-3">
                  <div className="line-clamp-2 text-sm font-semibold text-ink dark:text-white">{r.name}</div>
                  <div className="mt-1 text-sm font-bold text-brand-blue">{formatPrice(r)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sticky mobile add-to-cart bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-border bg-white px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] dark:bg-navy2 dark:border-white/10 lg:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-[11px] text-slate-400">{product.name}</div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading text-lg font-extrabold text-brand-blue">{formatPrice(product)}</span>
            <span className="text-[10px] text-slate-400">/sq.ft</span>
          </div>
        </div>
        <button
          onClick={() => toggleWishlist(product)}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border dark:border-white/10 ${inWish ? 'bg-brand-blue text-white border-brand-blue' : 'text-ink dark:text-white'}`}
          aria-label="Wishlist"
        >
          <Icon.heart className={`h-4.5 w-4.5 ${inWish ? 'fill-current' : ''}`} />
        </button>
        <button
          onClick={() => addToCart(product)}
          disabled={product.stock <= 0}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-deep px-5 py-3 text-sm font-bold text-white shadow-glow disabled:opacity-50"
        >
          <Icon.bag className="h-4 w-4" /> Add to Cart
        </button>
      </div>
    </div>
  );
}

function Spec({ label, value }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-ink dark:text-white">{value || '—'}</div>
    </div>
  );
}
