import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import ShopClient from '@/components/shop/ShopClient';
import BreadcrumbSchema from '@/components/shop/BreadcrumbSchema';
import { serverFetch } from '@/lib/server-api';

// One reusable, fully database-driven category template. The URL decides what
// is displayed: /tiles/living-room-tiles, /tiles/bedroom-tiles,
// /tiles/bedroom-tiles/bedroom-floor-tiles, /tiles/living-room-tiles/statuario,
// etc. all render here. No hardcoded per-category pages exist — categories
// created in the admin panel are reachable the instant they are added.
async function fetchResolved(path) {
  try {
    const res = await serverFetch(`/api/v1/categories/resolve?slugPath=${encodeURIComponent(path)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data : null;
  } catch {
    return null;
  }
}

export default async function TilesCategoryPage({ params }) {
  const { slug = [] } = params;
  if (!slug.length) redirect('/tiles/living-room-tiles');

  const data = await fetchResolved(slug.join('/'));
  if (!data) notFound();

  const { category, parent, group, kind, breadcrumb } = data;
  const presetFilters = { category: parent?.slug || category.slug };
  // A "composite" category (e.g. "Anti Skid Terrace Tiles") has no products
  // tagged to it directly — its page applies the full set of atomic filters
  // stored on the row instead of just its own slug.
  const composite = category.composite_filters ? JSON.parse(category.composite_filters) : null;
  if (composite) {
    Object.assign(presetFilters, composite);
  } else if (kind === 'facet' && group?.key) {
    presetFilters[group.key] = category.slug;
  }

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
  const { slug = [] } = params;
  if (!slug.length) return {};

  const data = await fetchResolved(slug.join('/'));
  if (!data) return {};

  const { category, breadcrumb } = data;
  return {
    title: category.seo_title || `${category.name} | Meenakshi Build World`,
    description: category.seo_description || category.description,
    alternates: { canonical: `/tiles/${slug.join('/')}` },
    openGraph: {
      title: category.seo_title || `${category.name} | Meenakshi Build World`,
      description: category.seo_description || category.description,
      images: category.image ? [category.image] : undefined
    }
  };
}