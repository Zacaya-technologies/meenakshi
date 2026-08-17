import { Suspense } from 'react';
import ProductDetailClient from '@/components/shop/ProductDetailClient';

export default function ProductDetailPage({ params }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1380px] px-6 py-16 text-center text-slate-400">Loading product…</div>}>
      <ProductDetailClient slug={params.slug} />
    </Suspense>
  );
}
