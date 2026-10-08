'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { API, isPlaceholderImage } from '@/lib/api';
import ProductCard, { ProductCardSkeleton } from './ProductCard';
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

const FACET_KEYS = ['area', 'application', 'size', 'design', 'type', 'finish', 'color', 'surface', 'material', 'brand', 'collection', 'in_stock'];

// Renders the full shop grid + filter sidebar. `presetFilters` seeds the
// starting scope for a taxonomy landing page (e.g. { category: 'floor-tiles' }
// for /floor-tiles, or { category: 'floor-tiles', design: 'marble' } for
// /floor-tiles/marble) — the sidebar remains fully interactive on top of it.
export default function ShopClient({ presetFilters = {}, breadcrumb, heading, description, banner }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState([]);
  const [facets, setFacets] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);
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

  // Load products whenever filters/sort/page change. The skeleton grid only
  // shows on the very first fetch — afterwards the current products stay in
  // place (gently dimmed) while new ones load, so nothing blinks/flash-remounts.
  useEffect(() => {
    let cancelled = false;
    if (!hasLoadedRef.current) setLoading(true);
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
      hasLoadedRef.current = true;
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [buildQuery, sort, page]);

  // Seeded from the effective filters (URL + the route's preset scope) so that
  // refining a landing page like /tiles/floor-tiles/marble keeps "marble"
  // instead of silently dropping it on the way to /shop.
  // Stay on the current page (e.g. /floor-tiles) rather than jumping to
  // /shop: switching routes remounted the listing, which closed the mobile
  // filter sheet after every tick and reset the scroll position. Only when
  // the shopper removes part of the page's own preset scope — which the
  // landing route cannot express — does the URL move to /shop.
  const navigate = useCallback((params) => {
    const keepsPreset = Object.entries(presetFilters).every(([k, v]) =>
      (Array.isArray(v) ? v : [v]).every(val => (k === 'category' ? params.get('category') === val : params.getAll(k).includes(val)))
    );
    const base = keepsPreset ? pathname : '/shop';
    const qs = params.toString();
    router.push(qs ? `${base}?${qs}` : base, { scroll: false });
  }, [router, pathname, presetFilters]);

  const pushParams = useCallback((mutator) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach(val => params.append(k, val));
      else if (v) params.set(k, v);
    });
    if (sort) params.set('sort', sort);
    if (page > 1) params.set('page', String(page));
    mutator(params);
    navigate(params);
  }, [navigate, filters, sort, page]);

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

  // Back to the page's own scope: the landing route's presets apply again
  // once the query string is gone.
  const clearFilters = useCallback(() => {
    const qs = filters.q ? `?q=${encodeURIComponent(filters.q)}` : '';
    router.push(`${pathname}${qs}`, { scroll: false });
  }, [router, pathname, filters.q]);

  const setSort = (val) => {
    pushParams(params => { if (val) params.set('sort', val); else params.delete('sort'); });
  };

  const goPage = (p) => {
    pushParams(params => { if (p > 1) params.set('page', p); else params.delete('page'); });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Price sorts are meaningless while the whole scope is price-on-request.
  const hasPrices = Number(facets?.priceRange?.max) > 0;
  const sorts = hasPrices ? SORTS : SORTS.filter(s => !s.value.startsWith('price_'));

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
    if (!facets || activeCount > 0 || !filters.category) return [];
    const navGroup = (facets.groups || []).find(g => g.key === 'area' || g.key === 'application');
    // Empty subcategories would only lead to "No products found".
    return (navGroup?.items || []).filter(i => i.slug !== filters.category && i.count !== 0);
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
        items: g.items.filter(i => i.count !== 0).map(i => ({
          slug: i.slug,
          name: i.name,
          count: i.count,
          url: isMain(i.slug) ? `/tiles/${i.slug}` : `/tiles/${filters.category}/${i.slug}`
        }))
      }))
      .filter(g => g.items.length > 0);
  }, [facets, activeCount, filters.category, menu, subcats]);

  // Other main categories deep-linked below every taxonomy page.
  const relatedCategories = useMemo(() => {
    if (!menu?.topNav || !filters.category) return [];
    return menu.topNav.filter(m => m.slug !== filters.category);
  }, [menu, filters.category]);

  return (
    <div className="mx-auto max-w-[1380px] px-4 sm:px-6 py-8">
      {/* Optional category banner (admin-managed banner_url) */}
      {!isPlaceholderImage(banner) && (
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
          <Link
            href="/calculator"
            className="flex items-center gap-1.5 rounded-xl border-[1.5px] border-brand-blue/30 px-3.5 py-2.5 text-xs font-bold text-brand-blue transition hover:border-brand-blue hover:bg-brand-blue/5"
          >
            <Icon.ruler className="h-3.5 w-3.5" /> Calculate Tiles
          </Link>
          <span className="text-xs text-slate-400">Sort by</span>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="cursor-pointer rounded-xl border-[1.5px] border-border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand-blue dark:bg-navy2 dark:text-white dark:border-white/10"
          >
            {sorts.map(s => (
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
        <Link
          href="/calculator"
          aria-label="Calculate Tiles"
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border-[1.5px] border-brand-blue/30 text-brand-blue"
        >
          <Icon.ruler className="h-4.5 w-4.5" />
        </Link>
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
            {sorts.map(s => (
              <button
                key={s.value}
                onClick={() => { setSort(s.value); setMobileSortOpen(false); }}
                className={`flex min-h-[48px] items-center justify-between rounded-xl px-4 text-left text-sm font-semibold transition ${
                  sort === s.value ? 'bg-brand-blue/10 text-brand-blue' : 'text-ink dark:text-white'
                }`}
              >
                {s.label}
                {sort === s.value && <Icon.check className="h-4 w-4" />}
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
              <div className="mb-4 flex items-end justify-between gap-3">
                <h2 className="font-heading text-xl font-extrabold text-ink dark:text-white">Shop by Subcategory</h2>
                <span className="text-xs font-semibold text-slate-400">{subcats.length} spaces</span>
              </div>
              {/* Swipeable strip on phones so the products are not pushed a dozen
                  screens down; a grid from sm up. */}
              <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
                {subcats.map(c => (
                  <Link
                    key={c.id ?? c.slug}
                    href={`/tiles/${filters.category}/${c.slug}`}
                    className="group relative isolate block aspect-[4/3] w-60 shrink-0 snap-start overflow-hidden rounded-2xl bg-brand-navy shadow-card transition duration-300 ease-out-expo hover:-translate-y-1 hover:shadow-[0_22px_44px_-14px_rgba(15,23,42,0.5)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue/40 sm:w-auto"
                  >
                    {c.image ? (
                      <img
                        src={c.image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 -z-10 h-full w-full object-cover transition duration-700 ease-out-expo group-hover:scale-[1.08]"
                      />
                    ) : (
                      <div className="absolute inset-0 -z-10 flex items-center justify-center bg-gradient-to-br from-brand-blue to-brand-navy text-4xl font-black text-white/20">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    {/* Readability scrim; deepens on hover */}
                    <div className="absolute inset-0 -z-10 bg-gradient-to-t from-brand-navy/90 via-brand-navy/25 to-transparent transition duration-300 group-hover:from-brand-navy group-hover:via-brand-navy/45" />
                    <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5 transition duration-300 group-hover:ring-2 group-hover:ring-brand-blue" />

                    {typeof c.count === 'number' && c.count > 0 && (
                      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-800 shadow-sm backdrop-blur sm:left-4 sm:top-4">
                        {c.count} {c.count === 1 ? 'design' : 'designs'}
                      </span>
                    )}

                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
                      <div className="min-w-0">
                        <h3 className="line-clamp-2 font-heading text-base font-bold leading-tight text-white drop-shadow-sm sm:text-lg">
                          {c.name}
                        </h3>
                        <span className="mt-1 block text-xs font-medium text-white/70 transition duration-300 group-hover:text-brand-blue">
                          Explore collection
                        </span>
                      </div>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/30 backdrop-blur-md transition duration-300 group-hover:translate-x-0.5 group-hover:bg-brand-blue group-hover:ring-brand-blue">
                        <Icon.arrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {loading && !hasLoadedRef.current ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : !loading && products.length === 0 ? (
            <div className="rounded-[20px] border-[1.5px] border-dashed border-border bg-white p-16 text-center dark:bg-navy2 dark:border-white/10">
              <Icon.search className="mx-auto h-14 w-14 text-slate-300" />
              <h3 className="mt-4 font-heading text-lg font-bold text-ink dark:text-white">No products found</h3>
              <p className="mt-2 text-sm text-slate-400">Try adjusting or clearing your filters.</p>
              <button onClick={clearFilters} className="mt-5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-deep px-6 py-2.5 text-sm font-bold text-white">
                Clear Filters
              </button>
            </div>
          ) : (
            <div
              className={`grid grid-cols-2 gap-4 transition-opacity duration-200 md:grid-cols-3 md:gap-6 xl:grid-cols-4 ${
                loading ? 'pointer-events-none opacity-50' : 'opacity-100'
              }`}
            >
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
                        <li key={`${g.key}-${i.slug}`}>
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
