'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API, FALLBACK_IMG } from '@/lib/api';
import { AnyIcon, Icon } from '@/components/ui/Icons';

// "Shop by Category" — every main category, admin-ordered/featured/enabled
// straight from the categories table. Adding, hiding, reordering or
// re-featuring a category in the admin panel updates this grid immediately,
// no code change required.
export default function CategoryGrid() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.getCategories().then(res => {
      if (res.success) {
        const mains = res.categories
          .filter(c => !c.parent_id && c.status === 'active')
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        setCategories(mains);
      }
      setLoading(false);
    });
  }, []);

  if (!loading && categories.length === 0) return null;

  // A badge on every card says nothing — only mark featured ones when some aren't.
  const allFeatured = categories.length > 0 && categories.every(c => c.featured);

  return (
    <section className="mx-auto max-w-shell px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-blue">Browse the Catalog</span>
        <h2 className="mt-2 font-heading text-4xl font-extrabold text-ink dark:text-white">Shop by Category</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500 dark:text-slate-400">
          Every room, every finish, every application — organized so you can find exactly what you need.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-3xl bg-slate-200 dark:bg-navy2 sm:h-72" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          <AllTilesCard />
          {categories.map(c => <CategoryCard key={c.id} category={c} showFeatured={!allFeatured} />)}
        </div>
      )}
    </section>
  );
}

const CARD = 'group relative isolate flex h-56 flex-col justify-end overflow-hidden rounded-3xl p-4 shadow-card transition duration-300 ease-out-expo hover:-translate-y-1.5 hover:shadow-[0_24px_48px_-12px_rgba(15,23,42,0.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue/40 sm:h-72 sm:p-6';

function CategoryCard({ category: c, showFeatured }) {
  return (
    <Link href={`/${c.slug}`} className={`${CARD} bg-brand-navy`}>
      {/* Full-strength photo; slow zoom on hover */}
      <img
        src={c.image || FALLBACK_IMG}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 -z-10 h-full w-full object-cover transition duration-700 ease-out-expo group-hover:scale-110"
      />
      {/* Bottom-weighted scrim keeps the label readable on any photo */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-brand-navy/95 via-brand-navy/35 to-transparent transition duration-300 group-hover:from-brand-navy group-hover:via-brand-navy/50" />
      {/* Hover ring */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10 transition duration-300 group-hover:ring-2 group-hover:ring-brand-blue/80" />

      <span className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md transition duration-300 group-hover:bg-brand-blue group-hover:ring-brand-blue sm:left-5 sm:top-5 sm:h-11 sm:w-11">
        <AnyIcon id={c.icon} className="h-5 w-5" />
      </span>

      {showFeatured && c.featured ? (
        <span className="absolute right-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-brand-deep shadow-sm sm:right-5 sm:top-5">
          Featured
        </span>
      ) : null}

      <h3 className="font-heading text-base font-bold leading-tight text-white drop-shadow-sm sm:text-xl">
        {c.name}
      </h3>
      <span className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-white/75 transition duration-300 group-hover:text-brand-blue sm:text-sm">
        Explore
        <Icon.arrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
      </span>
    </Link>
  );
}

function AllTilesCard() {
  return (
    <Link href="/all-tiles" className={`${CARD} bg-gradient-to-br from-brand-blue via-brand-deep to-brand-navy`}>
      {/* Decorative tile pattern */}
      <div
        className="absolute inset-0 -z-10 opacity-20 transition duration-700 group-hover:scale-110 group-hover:opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '36px 36px'
        }}
      />
      <span className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-white ring-1 ring-white/30 backdrop-blur-md sm:left-5 sm:top-5 sm:h-11 sm:w-11">
        <AnyIcon id="grid" className="h-5 w-5" />
      </span>
      <h3 className="font-heading text-lg font-extrabold leading-tight text-white sm:text-2xl">All Tiles</h3>
      <span className="mt-1 text-xs text-white/80 sm:text-sm">Browse the full catalogue</span>
      <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-brand-deep shadow-md transition duration-300 group-hover:gap-2.5 sm:text-sm">
        Shop now <Icon.arrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
