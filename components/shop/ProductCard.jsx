'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { useBusiness, waLink } from '@/lib/business';
import { FALLBACK_IMG, discountPct, hasPrice } from '@/lib/api';
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

export default function ProductCard({ product, onQuickView }) {
  const business = useBusiness();
  const { wishlist, compare, toggleWishlist, toggleCompare, addToCart } = useApp();
  const [added, setAdded] = useState(false);
  const addedTimer = useRef(null);
  useEffect(() => () => clearTimeout(addedTimer.current), []);

  const inWish = useMemo(() => wishlist.some(p => p.id === product.id), [wishlist, product.id]);
  const inCompare = useMemo(() => compare.some(p => p.id === product.id), [compare, product.id]);
  const off = discountPct(product);
  const image = product.primary_image || product.image_url || FALLBACK_IMG;
  const inStock = product.stock === undefined || product.stock === null || product.stock > 0;
  const priced = hasPrice(product);
  const href = `/product/${product.slug}`;

  const eyebrow = product.collection_name || product.brand_name;
  const specs = [product.size, product.finish, product.color].filter(Boolean).join(' · ');

  const enquireHref = waLink(business.whatsapp_number,
    `Hi ${business.business_name}, I'm interested in "${product.name}" (SKU: ${product.sku}${product.size ? `, ${product.size}` : ''}). Please share the price and availability.`);

  const onAdd = () => {
    addToCart(product);
    setAdded(true);
    clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 1600);
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition duration-300 hover:border-slate-300 hover:shadow-[0_12px_32px_-12px_rgba(15,23,42,0.25)] dark:border-white/10 dark:bg-navy2 dark:hover:border-white/20">
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-100 dark:bg-navy">
        <Link href={href} className="block h-full w-full" aria-label={product.name} tabIndex={-1}>
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
          />
        </Link>

        {/* Only exceptions get a label — "In stock" on every card is noise */}
        {(off > 0 || !inStock) && (
          <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {off > 0 && (
              <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[11px] font-bold text-white">−{off}%</span>
            )}
            {!inStock && (
              <span className="rounded bg-slate-900/80 px-1.5 py-0.5 text-[11px] font-semibold text-white">Out of stock</span>
            )}
          </div>
        )}

        {/* Quick actions — revealed on hover, always visible on touch screens */}
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
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
        {eyebrow && (
          <span className="truncate text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            {eyebrow}
          </span>
        )}

        <Link
          href={href}
          className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-slate-900 transition-colors hover:text-brand-deep dark:text-white dark:hover:text-brand-blue"
        >
          {product.name}
        </Link>

        {specs && <p className="mt-1 truncate text-[13px] text-slate-500 dark:text-slate-400">{specs}</p>}
        <div className="h-4 shrink-0" aria-hidden="true" />

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3.5 dark:border-white/10">
          <div className="min-w-0">
            {priced ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-[17px] font-bold text-slate-900 dark:text-white">
                  ₹{Number(product.offer_price || product.price).toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-500">/sq.ft</span>
                {off > 0 && (
                  <span className="text-[12px] text-slate-400 line-through">₹{Number(product.price).toLocaleString('en-IN')}</span>
                )}
              </div>
            ) : (
              <span className="text-[13px] font-medium text-slate-600 dark:text-slate-300">Price on request</span>
            )}
            <a
              href={enquireHref}
              target="_blank"
              rel="noreferrer"
              className="mt-0.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#128C7E] hover:underline dark:text-[#25D366]"
            >
              <Icon.whatsapp className="h-3.5 w-3.5" /> Enquire
            </a>
          </div>

          <button
            onClick={onAdd}
            disabled={!inStock}
            aria-label={added ? 'Added to cart' : 'Add to cart'}
            title={inStock ? 'Add to cart' : 'Out of stock'}
            className={`flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-white transition-colors duration-200 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-white/10 ${
              added ? 'bg-emerald-600' : 'bg-slate-900 hover:bg-brand-deep dark:bg-white/10 dark:hover:bg-brand-blue'
            }`}
          >
            {added ? <Icon.check className="h-4 w-4" /> : <Icon.bag className="h-4 w-4" />}
            <span className="hidden sm:inline">{added ? 'Added' : 'Add'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

// Loading placeholder with the same footprint as ProductCard.
export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-navy2">
      <div className="aspect-[4/5] animate-pulse bg-slate-100 dark:bg-navy" />
      <div className="space-y-2 px-4 pb-4 pt-3.5">
        <div className="h-2.5 w-1/3 animate-pulse rounded bg-slate-100 dark:bg-white/5" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100 dark:bg-white/5" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-white/5" />
        <div className="!mt-5 flex items-center justify-between">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-100 dark:bg-white/5" />
          <div className="h-10 w-16 animate-pulse rounded-lg bg-slate-100 dark:bg-white/5" />
        </div>
      </div>
    </div>
  );
}
