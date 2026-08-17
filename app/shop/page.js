import { Suspense } from 'react';
import ShopClient from '@/components/shop/ShopClient';

export const metadata = {
  title: 'Shop Tiles & Building Materials | Meenakshi Build World',
  description: 'Browse floor tiles, wall tiles, marble slabs, granite, sanitaryware and more at Meenakshi Build World.'
};

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1380px] px-6 py-16 text-center text-slate-400">Loading shop…</div>}>
      <ShopClient />
    </Suspense>
  );
}

