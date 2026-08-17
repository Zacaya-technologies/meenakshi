'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { API } from '@/lib/api';
import ProductCard from './ProductCard';
import QuickView from './QuickView';
import FilterSidebar from './FilterSidebar';
import { Icon } from '@/components/ui/Icons';

const SORTS = [
  { value: '', label: 'New Arrivals' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Popular' }
];

export default function ShopClient({ defaultCategory }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState([]);
  const [facets, setFacets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [quickView, setQuickView] = useState(null);

  // Parse filters from URL
  const filters = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    const out = {};
    const multi = ['material', 'finish', 'color', 'pattern', 'size', 'area', 'brand'];
    multi.forEach(k => {
      const v = params.getAll(k);
      if (v.length) out[k] = v;
    });
    // Category from URL param wins; otherwise use the route-level default (for /category/[slug])
    if (params.get('category')) out.category = params.get('category');
    else if (defaultCategory) out.category = defaultCategory;
    if (params.get('q')) out.q = params.get('q');
    return out;
  }, [searchParams, defaultCategory]);

  const sort = searchParams.get('sort') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Build query string for API
  const buildQuery = useCallback((override = {}) => {
    const params = new URLSearchParams();
    const merged = { ...filters, ...override };
    Object.entries(merged).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach(val => params.append(k, val));
      else if (v) params.set(k, v);
    });
    return params.toString();
  }, [filters]);

  // Load facets once
  useEffect(() => {
    let cancelled = false;
    API.getFacets(filters.category || '')
      .then(res => { if (!cancelled && res.success) setFacets(res); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [filters.category]);

  // Load products whenever filters/sort/page change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const qs = buildQuery({ sort, page, limit: 12 });
    API.getProducts(`?${qs}`).then(res => {
      if (cancelled) return;
      if (res.success) {
        setProducts(res.products);
        setPagination(res.pagination);
      } else {
        setProducts([]);
        setPagination({ total: 0, page: 1, pages: 1 });
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [buildQuery, sort, page]);

  const toggleFilter = useCallback(
    (key, value) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = params.getAll(key);
      const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      params.delete(key);
      next.forEach(v => params.append(key, v));
      params.delete('page');
      router.push(`/shop?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = useCallback(() => {
    if (defaultCategory) {
      // Stay scoped to the route-level category
      const params = new URLSearchParams();
      params.set('category', defaultCategory);
      if (filters.q) params.set('q', filters.q);
      router.push(`/shop?${params.toString()}`);
      return;
    }
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.q) params.set('q', filters.q);
    router.push(`/shop?${params.toString()}`);
  }, [router, filters, defaultCategory]);

  const setSort = (val) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set('sort', val);
    else params.delete('sort');
    router.push(`/shop?${params.toString()}`);
  };

  const goPage = (p) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p > 1) params.set('page', p);
    else params.delete('page');
    router.push(`/shop?${params.toString()}`);
  };

  // Category title from facets
  const categoryName = useMemo(() => {
    const cat = facets?.categories?.find(c => c.slug === filters.category);
    return cat?.name || (filters.q ? `Search: "${filters.q}"` : 'All Products');
  }, [facets, filters]);

  const activeCount = Object.entries(filters).reduce((acc, [k, v]) => {
    if (k === 'category' || k === 'q') return acc;
    return acc + (Array.isArray(v) ? v.length : 0);
  }, 0);

  return (
    <div className="mx-auto max-w-[1380px] px-6 py-8">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-slate-400">
        <Link href="/" className="transition hover:text-brand-blue">Home</Link>
        <Icon.arrowRight className="h-3.5 w-3.5" />
        <Link href="/shop" className="transition hover:text-brand-blue">Shop</Link>
        {filters.category && (
          <>
            <Icon.arrowRight className="h-3.5 w-3.5" />
            <span className="font-semibold text-ink dark:text-white">{categoryName}</span>
          </>
        )}
      </nav>

      {/* Title + count + sort */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-ink dark:text-white">{categoryName}</h1>
          <p className="mt-1 text-sm text-slate-400">
            <strong className="text-brand-blue">{pagination.total}</strong> products
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-400">Sort by</span>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="cursor-pointer rounded-xl border-[1.5px] border-border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand-blue dark:bg-navy2 dark:text-white dark:border-white/10"
          >
            {SORTS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[300px_1fr] lg:items-start">
        <FilterSidebar
          facets={facets || { categories: [], brands: [], materials: [], finishes: [], colors: [], sizes: [], applications: [], availability: [] }}
          selected={filters}
          onToggle={toggleFilter}
          onClear={clearFilters}
        />

        <div>
          {activeCount > 0 && (
            <div className="mb-4 flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold">{activeCount} filter{activeCount > 1 ? 's' : ''} applied</span>
              <button onClick={clearFilters} className="font-bold text-brand-blue hover:underline">Clear all</button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[380px] animate-pulse rounded-[20px] bg-slate-100 dark:bg-navy2" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-[20px] border-[1.5px] border-dashed border-border bg-white p-16 text-center dark:bg-navy2 dark:border-white/10">
              <Icon.search className="mx-auto h-14 w-14 text-slate-300" />
              <h3 className="mt-4 font-heading text-lg font-bold text-ink dark:text-white">No products found</h3>
              <p className="mt-2 text-sm text-slate-400">Try adjusting or clearing your filters.</p>
              <button onClick={clearFilters} className="mt-5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-deep px-6 py-2.5 text-sm font-bold text-white">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {products.map(p => (
                <ProductCard key={p.id} product={p} onQuickView={setQuickView} />
              ))}
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                disabled={page <= 1}
                onClick={() => goPage(page - 1)}
                className="rounded-xl border-[1.5px] border-border px-4 py-2.5 text-sm font-semibold text-ink transition enabled:hover:border-brand-blue enabled:hover:text-brand-blue disabled:opacity-40 dark:text-white dark:border-white/10"
              >
                ← Prev
              </button>
              <span className="text-sm text-slate-400">
                Page <strong className="text-ink dark:text-white">{page}</strong> of {pagination.pages}
              </span>
              <button
                disabled={page >= pagination.pages}
                onClick={() => goPage(page + 1)}
                className="rounded-xl border-[1.5px] border-border px-4 py-2.5 text-sm font-semibold text-ink transition enabled:hover:border-brand-blue enabled:hover:text-brand-blue disabled:opacity-40 dark:text-white dark:border-white/10"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      <QuickView product={quickView} onClose={() => setQuickView(null)} />
    </div>
  );
}

