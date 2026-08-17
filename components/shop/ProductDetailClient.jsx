'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API, FALLBACK_IMG, discountPct, formatPrice } from '@/lib/api';
import { useApp } from '@/lib/store';
import { Icon } from '@/components/ui/Icons';

export default function ProductDetailClient({ slug }) {
  const router = useRouter();
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

  const { product, images, related } = data;
  const off = discountPct(product);
  const gallery = (images?.length ? images : [{ image_url: FALLBACK_IMG }]);
  const inWish = wishlist.some(p => p.id === product.id);
  const inCompare = compare.some(p => p.id === product.id);
  const buyMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('buy');

  return (
    <div className="mx-auto max-w-[1380px] px-6 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
        <Link href="/" className="transition hover:text-brand-blue">Home</Link>
        <Icon.arrowRight className="h-3.5 w-3.5" />
        <Link href="/shop" className="transition hover:text-brand-blue">Shop</Link>
        <Icon.arrowRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-ink dark:text-white">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative overflow-hidden rounded-3xl bg-slate-100 dark:bg-navy">
            <img src={gallery[activeImg]?.image_url || FALLBACK_IMG} alt={product.name} className="h-[420px] w-full object-cover" />
            {off > 0 && (
              <span className="absolute left-4 top-4 rounded-full bg-rose-500 px-3 py-1.5 text-xs font-extrabold text-white">{off}% OFF</span>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-3">
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
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-bold text-brand-blue">{product.material}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-white/10">{product.tile_size}</span>
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
            <Spec label="Material" value={product.material} />
            <Spec label="Finish" value={product.finish} />
            <Spec label="Pattern" value={product.pattern} />
            <Spec label="Colour" value={product.color} />
            <Spec label="Size" value={product.tile_size} />
            <Spec label="Thickness" value={product.thickness_mm ? `${product.thickness_mm} mm` : '—'} />
          </div>

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
