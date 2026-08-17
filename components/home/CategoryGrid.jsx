'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API, FALLBACK_IMG } from '@/lib/api';
import { AnyIcon } from '@/components/ui/Icons';

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

  return (
    <section className="mx-auto max-w-shell px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-blue">Browse the Catalog</span>
        <h2 className="mt-2 font-heading text-4xl font-extrabold text-ink dark:text-white">Shop by Category</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
          Every room, every finish, every application — organized so you can find exactly what you need.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100 dark:bg-navy2" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Link
            href="/all-tiles"
            className="group relative flex h-36 flex-col justify-end overflow-hidden rounded-2xl border-[1.5px] border-brand-blue bg-gradient-to-br from-brand-blue to-brand-deep p-4 text-white shadow-glow transition hover:-translate-y-1"
          >
            <AnyIcon id="grid" className="absolute right-3 top-3 h-8 w-8 opacity-25" />
            <span className="font-heading text-sm font-bold">All Tiles</span>
            <span className="text-[11px] opacity-80">Shop everything</span>
          </Link>

          {categories.map(c => (
            <Link
              key={c.id}
              href={`/${c.slug}`}
              className="group relative flex h-36 flex-col justify-end overflow-hidden rounded-2xl border-[1.5px] border-border bg-white p-4 shadow-card transition hover:-translate-y-1 hover:border-brand-blue/50 hover:shadow-hover dark:bg-navy2 dark:border-white/10"
            >
              <img
                src={c.image || FALLBACK_IMG}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-15 transition duration-300 group-hover:opacity-25 dark:opacity-20"
              />
              <AnyIcon id={c.icon} className="relative z-10 mb-1 h-6 w-6 text-brand-blue" />
              <span className="relative z-10 font-heading text-sm font-bold text-ink dark:text-white">{c.name}</span>
              {c.featured ? (
                <span className="relative z-10 mt-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-blue">Featured</span>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
