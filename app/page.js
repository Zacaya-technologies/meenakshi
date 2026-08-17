'use client';

import { useEffect, useState } from 'react';
import { API } from '@/lib/api';
import HeroBanner from '@/components/home/HeroBanner';
import CategoryGrid from '@/components/home/CategoryGrid';
import ProductCard from '@/components/shop/ProductCard';
import QuickView from '@/components/shop/QuickView';
import { Icon } from '@/components/ui/Icons';

const HERO_STATS = [
  { value: '2000+', label: 'Premium SKUs' },
  { value: '150+', label: 'Brand Partners' },
  { value: '50K+', label: 'Sq.Ft Delivered' },
  { value: '4.8', label: 'Average Rating', star: true }
];

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickView, setQuickView] = useState(null);

  useEffect(() => {
    API.getProducts('?featured=1&limit=8&sort=rating').then(res => {
      if (res.success) {
        setFeatured(res.products);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <HeroBanner />

      {/* Trust strip */}
      <section className="border-b border-border bg-white dark:border-white/10 dark:bg-navy2">
        <div className="mx-auto grid max-w-shell grid-cols-2 gap-y-6 px-4 py-7 sm:px-6 lg:grid-cols-4">
          {HERO_STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="flex items-center justify-center gap-1 font-heading text-2xl font-extrabold text-ink dark:text-white sm:text-3xl">
                {s.value}
                {s.star && <Icon.starFill className="h-5 w-5 text-amber-500" />}
              </div>
              <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <CategoryGrid />

      {/* Featured Products */}
      <section className="mx-auto max-w-shell px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-blue">Editor&apos;s Choice</span>
          <h2 className="mt-2 font-heading text-4xl font-extrabold text-ink dark:text-white">Featured Collections</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
            Hand-picked vitrified slabs and designer tiles our architects recommend the most.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[380px] animate-pulse rounded-[20px] bg-slate-100 dark:bg-navy2" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map(p => (
              <ProductCard key={p.id} product={p} onQuickView={setQuickView} />
            ))}
          </div>
        )}
      </section>

      <QuickView product={quickView} onClose={() => setQuickView(null)} />
    </div>
  );
}

