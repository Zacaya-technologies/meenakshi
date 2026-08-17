'use client';

import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { FALLBACK_IMG, formatPrice } from '@/lib/api';
import { Icon } from '@/components/ui/Icons';

const ATTRS = [
  { key: 'type', label: 'Type' },
  { key: 'finish', label: 'Finish' },
  { key: 'design', label: 'Design' },
  { key: 'color', label: 'Color' },
  { key: 'size', label: 'Tile Size' },
  { key: 'area', label: 'Area' },
  { key: 'brand_name', label: 'Brand' },
  { key: 'stock', label: 'Stock' }
];

export default function ComparePage() {
  const router = useRouter();
  const { compare, toggleCompare, addToCart } = useApp();

  if (compare.length === 0) {
    return (
      <div className="mx-auto max-w-[1380px] px-6 py-24 text-center">
        <Icon.scales className="mx-auto h-14 w-14 text-slate-300" />
        <h1 className="mt-4 font-heading text-2xl font-bold text-ink dark:text-white">Nothing to compare yet</h1>
        <p className="mt-2 text-sm text-slate-400">Add products to compare using the scale icon on any product card.</p>
        <button onClick={() => router.push('/shop')} className="mt-5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-deep px-6 py-3 text-sm font-bold text-white">
          Browse Tiles
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1380px] px-6 py-10">
      <h1 className="mb-6 font-heading text-3xl font-extrabold text-ink dark:text-white">Compare Products</h1>

      <div className="overflow-x-auto rounded-2xl border border-border bg-white dark:bg-navy2 dark:border-white/10">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="border-b border-border dark:border-white/10">
              <th className="w-40 p-4 text-left align-bottom">
                <button onClick={() => router.push('/shop')} className="rounded-xl border-[1.5px] border-dashed border-brand-blue px-4 py-2 text-xs font-bold text-brand-blue hover:bg-brand-blue/5">
                  + Add More
                </button>
              </th>
              {compare.map(p => (
                <th key={p.id} className="p-4 text-center">
                  <div className="relative">
                    <button onClick={() => toggleCompare(p)} className="absolute right-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-red-500" aria-label="Remove">
                      <Icon.close className="h-4 w-4" />
                    </button>
                    <div className="h-40 overflow-hidden rounded-xl bg-slate-100 dark:bg-navy">
                      <img src={p.image_url || p.primary_image || FALLBACK_IMG} alt={p.name} className="h-full w-full object-cover" />
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border dark:border-white/10">
              <td className="p-4 text-xs font-bold uppercase text-slate-400">Product</td>
              {compare.map(p => (
                <td key={p.id} className="p-4 text-center">
                  <button onClick={() => router.push(`/product/${p.slug}`)} className="line-clamp-2 text-sm font-semibold text-ink transition hover:text-brand-blue dark:text-white">
                    {p.name}
                  </button>
                </td>
              ))}
            </tr>
            <tr className="border-b border-border dark:border-white/10">
              <td className="p-4 text-xs font-bold uppercase text-slate-400">Price</td>
              {compare.map(p => (
                <td key={p.id} className="p-4 text-center font-heading text-xl font-extrabold text-brand-blue">
                  {formatPrice(p)}
                </td>
              ))}
            </tr>
            {ATTRS.map(a => (
              <tr key={a.key} className="border-b border-border dark:border-white/10">
                <td className="p-4 text-xs font-bold uppercase text-slate-400">{a.label}</td>
                {compare.map(p => (
                  <td key={p.id} className="p-4 text-center text-sm text-slate-600 dark:text-slate-300">
                    {p[a.key] || '—'}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="p-4 text-xs font-bold uppercase text-slate-400">Action</td>
              {compare.map(p => (
                <td key={p.id} className="p-4 text-center">
                  <button onClick={() => addToCart(p)} className="rounded-xl bg-gradient-to-r from-brand-blue to-brand-deep px-4 py-2 text-xs font-bold text-white">
                    Add to Cart
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
