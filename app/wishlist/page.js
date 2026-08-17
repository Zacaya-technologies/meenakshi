'use client';

import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import ProductCard from '@/components/shop/ProductCard';
import { Icon } from '@/components/ui/Icons';

export default function WishlistPage() {
  const router = useRouter();
  const { wishlist } = useApp();

  if (wishlist.length === 0) {
    return (
      <div className="mx-auto max-w-[1380px] px-6 py-24 text-center">
        <Icon.heart className="mx-auto h-14 w-14 text-slate-300" />
        <h1 className="mt-4 font-heading text-2xl font-bold text-ink dark:text-white">Your wishlist is empty</h1>
        <p className="mt-2 text-sm text-slate-400">Tap the heart icon on any product to save it here.</p>
        <button onClick={() => router.push('/shop')} className="mt-5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-deep px-6 py-3 text-sm font-bold text-white">
          Discover Tiles
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1380px] px-6 py-10">
      <h1 className="mb-6 font-heading text-3xl font-extrabold text-ink dark:text-white">
        My Wishlist <span className="text-lg font-normal text-slate-400">({wishlist.length})</span>
      </h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {wishlist.map(p => (
          <ProductCard key={p.id} product={p} onQuickView={() => {}} />
        ))}
      </div>
    </div>
  );
}
