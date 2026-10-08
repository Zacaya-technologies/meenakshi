'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API, isPlaceholderImage } from '@/lib/api';
import { Icon } from '@/components/ui/Icons';

export default function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.getBrands().then(res => {
      if (res.success) setBrands(res.brands);
      setLoading(false);
    });
  }, []);

  return (
    <div className="mx-auto max-w-[1380px] px-4 sm:px-6 py-10">
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-slate-400">
        <Link href="/" className="transition hover:text-brand-blue">Home</Link>
        <Icon.arrowRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-ink dark:text-white">Brands</span>
      </nav>

      <h1 className="mb-2 font-heading text-3xl font-extrabold text-ink dark:text-white">Our Brand Partners</h1>
      <p className="mb-8 max-w-2xl text-sm text-slate-400">Manufacturing partners behind every tile in the Meenakshi Build World catalog.</p>

      {loading ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-100 dark:bg-navy2" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {brands.map(b => (
            <Link
              key={b.id}
              href={`/shop?brand=${b.slug}`}
              className="group overflow-hidden rounded-2xl border-[1.5px] border-border bg-white text-center transition hover:-translate-y-1 hover:border-brand-blue/50 hover:shadow-hover dark:bg-navy2 dark:border-white/10"
            >
              <div className="flex h-28 items-center justify-center overflow-hidden border-b border-border bg-white px-6 dark:border-white/10 dark:bg-navy">
                {isPlaceholderImage(b.logo_url) ? (
                  // No real logo uploaded yet — a wordmark beats a random stock photo.
                  <span className="font-heading text-xl font-extrabold tracking-tight text-ink transition duration-300 group-hover:text-brand-deep dark:text-white">
                    {b.name}
                  </span>
                ) : (
                  <img src={b.logo_url} alt={b.name} className="max-h-16 w-auto max-w-full object-contain transition duration-300 group-hover:scale-105" />
                )}
              </div>
              <div className="p-4">
                <div className="font-heading text-sm font-bold text-ink dark:text-white">{b.name}</div>
                {b.is_featured ? (
                  <span className="mt-1 inline-block rounded-full bg-brand-blue/10 px-2 py-0.5 text-[10px] font-bold text-brand-blue">Featured</span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
