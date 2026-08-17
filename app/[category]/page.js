import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ShopClient from '@/components/shop/ShopClient';
import BreadcrumbSchema from '@/components/shop/BreadcrumbSchema';

const API_BASE = process.env.API_PROXY_TARGET || 'http://localhost:3000';

async function fetchCategory(slug) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/categories/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data : null;
  } catch {
    return null;
  }
}

// Main taxonomy landing page — e.g. /floor-tiles, /wall-tiles. Fully
// database-driven: a brand-new main category created in the admin panel is
// reachable here the instant it's added, with no route to hand-write.
export default async function MainCategoryPage({ params }) {
  const data = await fetchCategory(params.category);
  if (!data) notFound();
  const { category, breadcrumb } = data;

  return (
    <>
      <BreadcrumbSchema breadcrumb={breadcrumb} />
      <Suspense fallback={<div className="mx-auto max-w-[1380px] px-6 py-16 text-center text-slate-400">Loading…</div>}>
        <ShopClient
          presetFilters={{ category: category.slug }}
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
  const data = await fetchCategory(params.category);
  if (!data) return {};
  const { category } = data;
  return {
    title: category.seo_title || `${category.name} | Meenakshi Build World`,
    description: category.seo_description || category.description,
    alternates: { canonical: `/${category.slug}` }
  };
}
