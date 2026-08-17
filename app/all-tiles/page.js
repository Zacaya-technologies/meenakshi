import { Suspense } from 'react';
import ShopClient from '@/components/shop/ShopClient';
import BreadcrumbSchema from '@/components/shop/BreadcrumbSchema';

export const metadata = {
  title: 'All Tiles | Meenakshi Build World',
  description: 'Browse every tile in the Meenakshi Build World catalog — floor, wall, bathroom, kitchen, living room, outdoor, parking, ceramic and vitrified — in one place.',
  alternates: { canonical: '/all-tiles' }
};

const BREADCRUMB = [{ name: 'Home', url: '/' }, { name: 'All Tiles', url: '/all-tiles' }];

// "All Tiles" is a virtual catalog root — it aggregates every product across
// every category via the existing product_categories relationships, exactly
// like /shop does, just under its own branded URL/heading. No product is
// ever duplicated to make this page work.
export default function AllTilesPage() {
  return (
    <>
      <BreadcrumbSchema breadcrumb={BREADCRUMB} />
      <Suspense fallback={<div className="mx-auto max-w-[1380px] px-6 py-16 text-center text-slate-400">Loading…</div>}>
        <ShopClient
          breadcrumb={BREADCRUMB}
          heading="All Tiles"
          description="Every tile we carry, across every room and application — filter by area, design, type, finish, colour, size, brand or collection."
        />
      </Suspense>
    </>
  );
}
