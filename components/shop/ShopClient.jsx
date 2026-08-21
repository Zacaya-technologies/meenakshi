'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { API } from '@/lib/api';
import ProductCard from './ProductCard';
import QuickView from './QuickView';
import FilterSidebar from './FilterSidebar';
import MobileSheet from './MobileSheet';
import { Icon } from '@/components/ui/Icons';

const SORTS = [
  { value: '', label: 'New Arrivals' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Popular' }
];

const FACET_KEYS = ['area', 'application', 'size', 'design', 'type', 'finish', 'color', 'surface', 'brand', 'collection', 'in_stock'];

// Renders the full shop grid + filter sidebar. `presetFilters` seeds the
// starting scope for a taxonomy landing page (e.g. { category: 'floor-tiles' }
// for /floor-tiles, or { category: 'floor-tiles', design: 'marble' } for
// /floor-tiles/marble) — the sidebar remains fully interactive on top of it.
export default function ShopClient({ presetFilters = {}, breadcrumb, heading, description, banner }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState([]);
  const [facets, setFacets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [quickView, setQuickView] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);
  const [menu, setMenu] = useState(null);

  // Top nav data used to render "Related Categories" at the bottom of every
  // taxonomy page (dynamic, from the categories table).
  useEffect(() => {
    let cancelled = false;
    API.getMenu().then(res => { if (!cancelled && res.success) setMenu(res); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Parse filters from URL, falling back to the route's preset scope.
  const filters = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    const out = {};
    FACET_KEYS.forEach(k => {
      const v = params.getAll(k);
      if (v.length) out[k] = v;
      else if (presetFilters[k]) out[k] = Array.isArray(presetFilters[k]) ? presetFilters[k] : [presetFilters[k]];
    });
    if (params.get('category')) out.category = params.get('category');
    else if (presetFilters.category) out.category = presetFilters.category;
    if (params.get('q')) out.q = params.get('q');
    if (params.get('min_price')) out.min_price = params.get('min_price');
    if (params.get('max_price')) out.max_price = params.get('max_price');
    return out;
  }, [searchParams, presetFilters]);

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

  // Load facets once per category scope
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

  const pushParams = useCallback((mutator) => {
    const params = new URLSearchParams(searchParams.toString());
    mutator(params);
    router.push(`/shop?${params.toString()}`);
  }, [router, searchParams]);

  const toggleFilter = useCallback(
    (key, value) => {
      pushParams(params => {
        const current = params.getAll(key);
        const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
        params.delete(key);
        next.forEach(v => params.append(key, v));
        params.delete('page');
      });
    },
    [pushParams]
  );

  const setPriceRange = useCallback((min, max) => {
    pushParams(params => {
      if (min) params.set('min_price', min); else params.delete('min_price');
      if (max) params.set('max_price', max); else params.delete('max_price');
      params.delete('page');
    });
  }, [pushParams]);

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (presetFilters.category) params.set('category', presetFilters.category);
    Object.entries(presetFilters).forEach(([k, v]) => {
      if (k === 'category') return;
      (Array.isArray(v) ? v : [v]).forEach(val => params.append(k, val));
    });
    if (filters.q) params.set('q', filters.q);
    router.push(`/shop?${params.toString()}`);
  }, [router, filters, presetFilters]);

  const setSort = (val) => {
    pushParams(params => { if (val) params.set('sort', val); else params.delete('sort'); });
  };

  const goPage = (p) => {
    pushParams(params => { if (p > 1) params.set('page', p); else params.delete('page'); });
  };

  // Category title from facets (or the route's own heading override)
  const categoryName = useMemo(() => {
    if (heading) return heading;
    if (facets?.category?.name) return facets.category.name;
    return filters.q ? `Search: "${filters.q}"` : 'All Products';
  }, [facets, filters, heading]);

  const activeCount = Object.entries(filters).reduce((acc, [k, v]) => {
    if (k === 'category' || k === 'q' || k === 'min_price' || k === 'max_price') return acc;
    return acc + (Array.isArray(v) ? v.length : 0);
  }, 0);

  // Subcategory quick-links for a main-category page (the Area/Application
  // column). Shown only while no facet filter is active.
  const subcats = useMemo(() => {
    if (!facets || activeCount > 0) return [];
    const navGroup = (facets.groups || []).find(g => g.key === 'area' || g.key === 'application');
    return (navGroup?.items || []).filter(i => i.slug !== filters.category);
  }, [facets, activeCount, filters.category]);

  // Grouped facet index ("Living Room Tiles By Finish / Size / Design / Type /
  // Color") mirroring the living-room category directories — one group per
  // card, each value deep-linked to /tiles/<main>/<facet>. Area/Application
  // are already shown as the subcategory cards, so they only repeat here when
  // a main has no area/application column at all.
  const facetBrowse = useMemo(() => {
    if (!facets || activeCount > 0 || !filters.category) return [];
    const isMain = (slug) => menu?.topNav?.some(m => m.slug === slug);
    return (facets.groups || [])
      .filter(g => (subcats.length === 0 ? true : g.key !== 'area' && g.key !== 'application'))
      .map(g => ({
        key: g.key,
        name: g.name.replace(/^By\s+/i, ''),
        items: g.items.map(i => ({
          name: i.name,
          count: i.count,
          url: isMain(i.slug) ? `/tiles/${i.slug}` : `/tiles/${filters.category}/${i.slug}`
        }))
      }));
  }, [facets, activeCount, filters.category, menu, subcats]);

  // Other main categories deep-linked below every taxonomy page.
  const relatedCategories = useMemo(() => {
    if (!menu?.topNav || !filters.category) return [];
    return menu.topNav.filter(m => m.slug !== filters.category);
  }, [menu, filters.category]);

  return (
    <div className="mx-auto max-w-[1380px] px-6 py-8">
      {/* Optional category banner (admin-managed banner_url) */}
      {banner && (
        <div className="mb-6 overflow-hidden rounded-3xl">
          <img src={banner} alt="" className="h-40 w-full object-cover sm:h-52" />
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
        {(breadcrumb || [{ name: 'Home', url: '/' }, { name: 'Shop', url: '/shop' }]).map((crumb, i, arr) => (
          <span key={crumb.url} className="flex items-center gap-1.5">
            {i > 0 && <Icon.arrowRight className="h-3.5 w-3.5" />}
            {i === arr.length - 1 ? (
              <span className="font-semibold text-ink dark:text-white">{crumb.name}</span>
            ) : (
              <Link href={crumb.url} className="transition hover:text-brand-blue">{crumb.name}</Link>
            )}
          </span>
        ))}
      </nav>

      {/* Title + count + sort */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-ink dark:text-white">{categoryName}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{description}</p>}
          <p className="mt-1 text-sm text-slate-400">
            <strong className="text-brand-blue">{pagination.total}</strong> products
          </p>
        </div>
        {/* Desktop sort */}
        <div className="hidden items-center gap-2.5 lg:flex">
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

      {/* Mobile filter/sort toolbar */}
      <div className="mb-5 flex gap-2.5 lg:hidden">
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border-[1.5px] border-border bg-white py-3 text-sm font-bold text-ink dark:bg-navy2 dark:text-white dark:border-white/10"
        >
          <Icon.filter className="h-4 w-4 text-brand-blue" /> Filters
          {activeCount > 0 && <span className="rounded-full bg-brand-blue px-1.5 py-0.5 text-[10px] font-extrabold text-white">{activeCount}</span>}
        </button>
        <button
          onClick={() => setMobileSortOpen(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border-[1.5px] border-border bg-white py-3 text-sm font-bold text-ink dark:bg-navy2 dark:text-white dark:border-white/10"
        >
          <Icon.stack className="h-4 w-4 text-brand-blue" /> {SORTS.find(s => s.value === sort)?.label || 'Sort'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[300px_1fr] lg:items-start">
        <div className="hidden lg:block">
          <FilterSidebar
            facets={facets || { groups: [], brands: [], priceRange: { min: 0, max: 500 } }}
            selected={filters}
            onToggle={toggleFilter}
            onPriceChange={setPriceRange}
            onClear={clearFilters}
          />
        </div>

        <MobileSheet open={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)} title="Filters">
          <FilterSidebar
            facets={facets || { groups: [], brands: [], priceRange: { min: 0, max: 500 } }}
            selected={filters}
            onToggle={toggleFilter}
            onPriceChange={setPriceRange}
            onClear={clearFilters}
          />
          <button
            onClick={() => setMobileFiltersOpen(false)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-deep py-3 text-sm font-bold text-white shadow-glow"
          >
            Show {pagination.total} Results
          </button>
        </MobileSheet>

        <MobileSheet open={mobileSortOpen} onClose={() => setMobileSortOpen(false)} title="Sort By">
          <div className="flex flex-col gap-1">
            {SORTS.map(s => (
              <button
                key={s.value}
                onClick={() => { setSort(s.value); setMobileSortOpen(false); }}
                className={`flex min-h-[48px] items-center justify-between rounded-xl px-4 text-left text-sm font-semibold transition ${
                  sort === s.value ? 'bg-brand-blue/10 text-brand-blue' : 'text-ink dark:text-white'
                }`}
              >
                {s.label}
                {sort === s.value && <Icon.starFill className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </MobileSheet>

        <div>
          {activeCount > 0 && (
            <div className="mb-4 flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold">{activeCount} filter{activeCount > 1 ? 's' : ''} applied</span>
              <button onClick={clearFilters} className="font-bold text-brand-blue hover:underline">Clear all</button>
            </div>
          )}

          {subcats.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 font-heading text-lg font-extrabold text-ink dark:text-white">Shop by Subcategory</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {subcats.map(c => (
                  <Link
                    key={c.slug}
                    href={`/tiles/${filters.category}/${c.slug}`}
                    className="group overflow-hidden rounded-2xl border-[1.5px] border-border bg-white transition hover:border-brand-blue hover:shadow-card dark:bg-navy2 dark:border-white/10"
                  >
                    <div className="relative h-24 w-full overflow-hidden bg-brand-light sm:h-28 dark:bg-navy">
                      {c.image ? (
                        <img src={c.image} alt={c.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl font-black text-brand-blue/30">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                      <span className="truncate text-[13px] font-bold text-ink dark:text-white">{c.name}</span>
                      {typeof c.count === 'number' && c.count > 0 && (
                        <span className="shrink-0 rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-extrabold text-brand-blue dark:bg-white/5">
                          {c.count}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[340px] animate-pulse rounded-[20px] bg-slate-100 dark:bg-navy2" />
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
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
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

          {facetBrowse.length > 0 && (
            <div className="mt-10 border-t border-border pt-8 dark:border-white/10">
              <h2 className="mb-5 font-heading text-xl font-extrabold text-ink dark:text-white">Browse {categoryName}</h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {facetBrowse.map(g => (
                  <div key={g.key} className="rounded-2xl border-[1.5px] border-border bg-white p-5 dark:bg-navy2 dark:border-white/10">
                    <h3 className="mb-3 text-[13px] font-extrabold uppercase tracking-wide text-brand-blue">
                      {categoryName} By {g.name}
                    </h3>
                    <ul className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                      {g.items.map(i => (
                        <li key={i.slug}>
                          <Link
                            href={i.url}
                            className="text-[13px] text-slate-600 transition hover:text-brand-blue dark:text-slate-300"
                          >
                            {i.name}
                            {i.count > 0 && (
                              <span className="ml-1 text-[11px] text-slate-400">({i.count})</span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {relatedCategories.length > 0 && (
            <div className="mt-12 border-t border-border pt-8 dark:border-white/10">
              <h2 className="mb-3 font-heading text-lg font-extrabold text-ink dark:text-white">Explore Other Tiles</h2>
              <div className="flex flex-wrap gap-2">
                {relatedCategories.map(m => (
                  <Link
                    key={m.slug}
                    href={m.url}
                    className="rounded-full border-[1.5px] border-border bg-white px-4 py-2 text-[13px] font-semibold text-slate-600 transition hover:border-brand-blue hover:text-brand-blue dark:bg-navy2 dark:text-slate-300 dark:border-white/10"
                  >
                    {m.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <QuickView product={quickView} onClose={() => setQuickView(null)} />
    </div>
  );
}
