import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import ShopClient from '@/components/shop/ShopClient';

// Category routes funnel into the shop page scoped to that category.
export default function CategoryPage({ params }) {
  const slug = params?.slug;
  if (!slug) redirect('/shop');
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1380px] px-6 py-16 text-center text-slate-400">Loading…</div>}>
      <ShopClient defaultCategory={slug} />
    </Suspense>
  );
}

export function generateMetadata({ params }) {
  const slug = params?.slug || '';
  return {
    title: `${slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} | Meenakshi Build World`,
    description: `Shop premium ${slug.replace(/-/g, ' ')} tiles and building materials at Meenakshi Build World.`
  };
}

