import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ShopClient from '@/components/shop/ShopClient';
import BreadcrumbSchema from '@/components/shop/BreadcrumbSchema';

const API_BASE = process.env.API_PROXY_TARGET || 'http://localhost:3000';

async function fetchFacet(parentSlug, childSlug) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/categories/${parentSlug}/${childSlug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data : null;
  } catch {
    return null;
  }
}

// Nested facet page — e.g. /floor-tiles/marble, /floor-tiles/600x1200,
// /wall-tiles/subway. Resolves which facet group ("design", "size", ...) the
// slug belongs to and pre-scopes the shop grid to it; the sidebar stays fully
// interactive on top of that starting point.
export default async function FacetCategoryPage({ params }) {
  const data = await fetchFacet(params.category, params.facet);
  if (!data) notFound();
  const { category, parent, group, breadcrumb } = data;

  const presetFilters = { category: parent.slug };
  if (group?.key) presetFilters[group.key] = category.slug;

  return (
    <>
      <BreadcrumbSchema breadcrumb={breadcrumb} />
      <Suspense fallback={<div className="mx-auto max-w-[1380px] px-6 py-16 text-center text-slate-400">Loading…</div>}>
        <ShopClient
          presetFilters={presetFilters}
          breadcrumb={breadcrumb}
          heading={category.name}
          description={category.description}
          banner={category.banner_url}
        />
      </Suspense>
    </>
  );
}

export async function generateMetadata({ params }) {
  const data = await fetchFacet(params.category, params.facet);
  if (!data) return {};
  const { category, parent } = data;
  return {
    title: category.seo_title || `${category.name} | Meenakshi Build World`,
    description: category.seo_description || category.description,
    alternates: { canonical: `/${parent.slug}/${category.slug}` }
  };
}
