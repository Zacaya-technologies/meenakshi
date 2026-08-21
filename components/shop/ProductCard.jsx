'use client';

import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { FALLBACK_IMG, discountPct, formatPrice } from '@/lib/api';
import { Icon } from '@/components/ui/Icons';

const WHATSAPP_NUMBER = '919900027700';

function StarRating({ rating }) {
  const rounded = Math.round(rating || 0);
  return (
    <div className="flex items-center gap-1">
      <div className="flex text-amber-500">
        {[1, 2, 3, 4, 5].map(i => (
          <Icon.starFill key={i} className={`h-3.5 w-3.5 ${i <= rounded ? '' : 'opacity-25'}`} />
        ))}
      </div>
    </div>
  );
}

export default function ProductCard({ product, onQuickView }) {
  const router = useRouter();
  const { wishlist, compare, toggleWishlist, toggleCompare, addToCart } = useApp();
  const inWish = wishlist.some(p => p.id === product.id);
  const inCompare = compare.some(p => p.id === product.id);
  const off = discountPct(product);
  const image = product.primary_image || product.image_url || FALLBACK_IMG;
  const inStock = product.stock === undefined || product.stock > 0;

  const chips = [product.design, product.finish, product.color].filter(Boolean);

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hi Meenakshi Build World, I'm interested in "${product.name}" (SKU: ${product.sku}). Please share more details.`
  )}`;
  const quoteHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hi, I'd like a bulk quote for "${product.name}" (SKU: ${product.sku}, ${product.size || ''}). Please share pricing per box.`
  )}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-[20px] border-[1.5px] border-border bg-white shadow-card transition duration-300 hover:-translate-y-2 hover:border-brand-blue/55 hover:shadow-hover dark:bg-navy2 dark:border-white/10">
      <div className="relative h-[270px] overflow-hidden bg-slate-100 dark:bg-navy">
        <button
          onClick={() => router.push(`/product/${product.slug}`)}
          className="block h-full w-full"
          aria-label={product.name}
        >
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.09]"
          />
        </button>

        <div className="absolute left-3.5 top-3.5 flex flex-col gap-1.5">
          {off > 0 && (
            <span className="rounded-full bg-rose-500 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-lg">
              {off}% OFF
            </span>
          )}
          {!inStock && (
            <span className="rounded-full bg-slate-700 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-lg">
              Out of Stock
            </span>
          )}
        </div>

        {/* Hover actions */}
        <div className="absolute bottom-3.5 right-3.5 flex flex-col gap-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 translate-y-2">
          <button
            onClick={() => onQuickView(product)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg transition hover:bg-brand-blue hover:text-white"
            aria-label="Quick view"
          >
            <Icon.eye className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => toggleWishlist(product)}
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg transition hover:bg-brand-blue hover:text-white ${inWish ? 'bg-brand-blue text-white' : ''}`}
            aria-label="Add to wishlist"
          >
            <Icon.heart className={`h-4.5 w-4.5 ${inWish ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={() => toggleCompare(product)}
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg transition hover:bg-brand-blue hover:text-white ${inCompare ? 'bg-brand-blue text-white' : ''}`}
            aria-label="Add to compare"
          >
            <Icon.scales className="h-4.5 w-4.5" />
          </button>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#25D366] shadow-lg transition hover:bg-[#25D366] hover:text-white"
            aria-label="Chat on WhatsApp"
          >
            <Icon.whatsapp className="h-4.5 w-4.5" />
          </a>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-medium text-slate-400">
          <span className="truncate">{product.brand_name || 'Meenakshi'}{product.collection_name ? ` • ${product.collection_name}` : ''}</span>
          <span className="shrink-0">{product.size}</span>
        </div>

        <button
          onClick={() => router.push(`/product/${product.slug}`)}
          className="mb-1.5 line-clamp-2 text-left font-heading text-[15px] font-semibold text-ink transition hover:text-brand-blue dark:text-white"
        >
          {product.name}
        </button>

        <div className="mb-2 flex items-center justify-between gap-2 text-[10.5px] text-slate-400">
          <span className="truncate">SKU: {product.sku}</span>
          <span className={`flex shrink-0 items-center gap-1 font-bold ${inStock ? 'text-green-600' : 'text-rose-500'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${inStock ? 'bg-green-500' : 'bg-rose-500'}`} />
            {inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>

        {chips.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {chips.map(c => (
              <span key={c} className="rounded-full bg-brand-light px-2 py-0.5 text-[10.5px] font-medium text-slate-500 dark:bg-white/5 dark:text-slate-400">
                {c}
              </span>
            ))}
          </div>
        )}

        <div className="mb-2 flex items-center gap-2">
          <StarRating rating={product.rating_avg} />
          <span className="text-[11px] text-slate-400">({product.reviews_count || 0})</span>
        </div>

        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="font-heading text-[22px] font-extrabold text-brand-blue">
            {formatPrice(product)}
          </span>
          {off > 0 && <span className="text-xs text-slate-400 line-through">₹{Number(product.price).toLocaleString('en-IN')}</span>}
          <span className="text-[11px] text-slate-400">/sq.ft</span>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          <button
            onClick={() => addToCart(product)}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-deep py-2.5 text-xs font-bold text-white shadow-[0_6px_18px_rgba(30,167,253,0.32)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(30,167,253,0.45)]"
          >
            <Icon.bag className="h-4 w-4" /> Add to Cart
          </button>
          <button
            onClick={() => router.push(`/product/${product.slug}?buy=1`)}
            className="rounded-xl border-[1.5px] border-brand-blue py-2.5 text-xs font-bold text-brand-blue transition hover:bg-brand-blue/5"
          >
            Buy Now
          </button>
        </div>

        <a
          href={quoteHref}
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-border py-2 text-[11px] font-bold text-slate-500 transition hover:border-brand-blue hover:text-brand-blue dark:border-white/10 dark:text-slate-400"
        >
          <Icon.chat className="h-3.5 w-3.5" /> Request Bulk Quote
        </a>
      </div>
    </article>
  );
}
