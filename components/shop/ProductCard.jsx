'use client';

import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { useBusiness, waLink } from '@/lib/business';
import { FALLBACK_IMG, discountPct, formatPrice, hasPrice } from '@/lib/api';
import { Icon } from '@/components/ui/Icons';

const ACTION_BTN = 'group/act relative flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/60';

// Label that slides out to the left of a toolbar button on hover (desktop only).
function ActionTip({ children }) {
  return (
    <span className="pointer-events-none absolute right-full top-1/2 mr-2.5 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-md bg-slate-900/90 px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-md transition duration-150 group-hover/act:translate-x-0 group-hover/act:opacity-100 [@media(hover:none)]:hidden">
      {children}
    </span>
  );
}

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
  const business = useBusiness();
  const { wishlist, compare, toggleWishlist, toggleCompare, addToCart } = useApp();
  const inWish = wishlist.some(p => p.id === product.id);
  const inCompare = compare.some(p => p.id === product.id);
  const off = discountPct(product);
  const image = product.primary_image || product.image_url || FALLBACK_IMG;
  const inStock = product.stock === undefined || product.stock > 0;
  const priced = hasPrice(product);

  const chips = [product.design, product.finish, product.color].filter(Boolean);

  const whatsappHref = waLink(business.whatsapp_number,
    `Hi ${business.business_name}, I'm interested in "${product.name}" (SKU: ${product.sku}). Please share more details.`);
  const priceHref = waLink(business.whatsapp_number,
    `Hi ${business.business_name}, please share the price of "${product.name}" (SKU: ${product.sku}${product.size ? `, ${product.size}` : ''}).`);
  const quoteHref = waLink(business.whatsapp_number,
    `Hi, I'd like a bulk quote for "${product.name}" (SKU: ${product.sku}${product.size ? `, ${product.size}` : ''}). Please share pricing per box.`);

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
            loading="lazy"
            decoding="async"
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

        {/* Hover actions — always visible on touch screens, which have no hover */}
        <div className="absolute right-3 top-3 flex translate-x-2 flex-col items-center gap-0.5 rounded-full bg-white/90 p-1 opacity-0 shadow-[0_8px_24px_rgba(15,23,42,0.18)] ring-1 ring-black/5 backdrop-blur-md transition duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100 dark:bg-navy2/90 dark:ring-white/10 [@media(hover:none)]:translate-x-0 [@media(hover:none)]:opacity-100">
          {onQuickView && (
            <button
              onClick={() => onQuickView(product)}
              className={`${ACTION_BTN} text-slate-600 hover:bg-brand-blue/10 hover:text-brand-blue dark:text-slate-300`}
              aria-label="Quick view"
            >
              <Icon.eye className="h-4 w-4" />
              <ActionTip>Quick view</ActionTip>
            </button>
          )}
          <button
            onClick={() => toggleWishlist(product)}
            className={`${ACTION_BTN} ${inWish ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10' : 'text-slate-600 hover:bg-rose-50 hover:text-rose-500 dark:text-slate-300 dark:hover:bg-rose-500/10'}`}
            aria-label={inWish ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={inWish}
          >
            <Icon.heart className={`h-4 w-4 ${inWish ? 'fill-current' : ''}`} />
            <ActionTip>{inWish ? 'Saved' : 'Wishlist'}</ActionTip>
          </button>
          <button
            onClick={() => toggleCompare(product)}
            className={`${ACTION_BTN} ${inCompare ? 'bg-brand-blue text-white' : 'text-slate-600 hover:bg-brand-blue/10 hover:text-brand-blue dark:text-slate-300'}`}
            aria-label={inCompare ? 'Remove from compare' : 'Add to compare'}
            aria-pressed={inCompare}
          >
            <Icon.scales className="h-4 w-4" />
            <ActionTip>{inCompare ? 'Comparing' : 'Compare'}</ActionTip>
          </button>
          <span className="my-0.5 h-px w-5 bg-slate-200 dark:bg-white/10" aria-hidden="true" />
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className={`${ACTION_BTN} text-[#25D366] hover:bg-[#25D366] hover:text-white`}
            aria-label="Chat on WhatsApp"
          >
            <Icon.whatsapp className="h-4 w-4" />
            <ActionTip>WhatsApp</ActionTip>
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

        {product.reviews_count > 0 && (
          <div className="mb-2 flex items-center gap-2">
            <StarRating rating={product.rating_avg} />
            <span className="text-[11px] text-slate-400">({product.reviews_count})</span>
          </div>
        )}

        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className={`font-heading font-extrabold text-brand-blue ${priced ? 'text-[22px]' : 'text-[17px]'}`}>
            {formatPrice(product)}
          </span>
          {off > 0 && <span className="text-xs text-slate-400 line-through">₹{Number(product.price).toLocaleString('en-IN')}</span>}
          {priced && <span className="text-[11px] text-slate-400">/sq.ft</span>}
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          <button
            onClick={() => addToCart(product)}
            disabled={!inStock}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-deep py-2.5 text-xs font-bold text-white shadow-[0_6px_18px_rgba(30,167,253,0.32)] transition enabled:hover:-translate-y-0.5 enabled:hover:shadow-[0_10px_24px_rgba(30,167,253,0.45)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon.bag className="h-4 w-4" /> Add to Cart
          </button>
          {priced ? (
            <button
              onClick={() => router.push(`/product/${product.slug}?buy=1`)}
              className="rounded-xl border-[1.5px] border-brand-blue py-2.5 text-xs font-bold text-brand-blue transition hover:bg-brand-blue/5"
            >
              Buy Now
            </button>
          ) : (
            <a
              href={priceHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center rounded-xl border-[1.5px] border-brand-blue py-2.5 text-xs font-bold text-brand-blue transition hover:bg-brand-blue/5"
            >
              Get Price
            </a>
          )}
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
