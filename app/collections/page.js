'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API, FALLBACK_IMG } from '@/lib/api';
import { Icon } from '@/components/ui/Icons';

export default function CollectionsPage() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.getCollections().then(res => {
      if (res.success) setCollections(res.collections);
      setLoading(false);
    });
  }, []);

  return (
    <div className="mx-auto max-w-[1380px] px-6 py-10">
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-slate-400">
        <Link href="/" className="transition hover:text-brand-blue">Home</Link>
        <Icon.arrowRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-ink dark:text-white">Collections</span>
      </nav>

      <h1 className="mb-2 font-heading text-3xl font-extrabold text-ink dark:text-white">Curated Collections</h1>
      <p className="mb-8 max-w-2xl text-sm text-slate-400">Hand-picked tile ranges grouped by look and application.</p>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-navy2" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map(c => (
            <Link
              key={c.id}
              href={`/shop?collection=${c.slug}`}
              className="group relative overflow-hidden rounded-2xl border-[1.5px] border-border bg-white transition hover:-translate-y-1 hover:border-brand-blue/50 hover:shadow-hover dark:bg-navy2 dark:border-white/10"
            >
              <div className="h-52 overflow-hidden bg-slate-100 dark:bg-navy">
                <img src={c.banner_url || FALLBACK_IMG} alt={c.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
              </div>
              <div className="p-5">
                {c.tagline && <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-brand-blue">{c.tagline}</div>}
                <div className="font-heading text-lg font-bold text-ink dark:text-white">{c.name}</div>
                {c.description && <p className="mt-1.5 line-clamp-2 text-xs text-slate-400">{c.description}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
