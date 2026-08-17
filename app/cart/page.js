'use client';

import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { FALLBACK_IMG, formatPrice } from '@/lib/api';
import { Icon } from '@/components/ui/Icons';

export default function CartPage() {
  const router = useRouter();
  const { cart, updateCartQty, removeFromCart, cartTotal } = useApp();

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-[1380px] px-6 py-24 text-center">
        <Icon.bag className="mx-auto h-14 w-14 text-slate-300" />
        <h1 className="mt-4 font-heading text-2xl font-bold text-ink dark:text-white">Your cart is empty</h1>
        <p className="mt-2 text-sm text-slate-400">Browse our premium tile collection to get started.</p>
        <button onClick={() => router.push('/shop')} className="mt-5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-deep px-6 py-3 text-sm font-bold text-white">
          Shop Tiles
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1380px] px-6 py-10">
      <h1 className="mb-6 font-heading text-3xl font-extrabold text-ink dark:text-white">Shopping Cart</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          {cart.map(item => (
            <div key={item.product.id} className="flex gap-4 rounded-2xl border border-border bg-white p-4 dark:bg-navy2 dark:border-white/10">
              <img src={item.product.image_url || item.product.primary_image || FALLBACK_IMG} alt={item.product.name} className="h-28 w-28 shrink-0 rounded-xl object-cover" />
              <div className="flex flex-1 flex-col">
                <button onClick={() => router.push(`/product/${item.product.slug}`)} className="text-left font-heading text-sm font-semibold text-ink transition hover:text-brand-blue dark:text-white">
                  {item.product.name}
                </button>
                <div className="mt-0.5 text-xs text-slate-400">{item.product.tile_size} • {item.product.brand_name}</div>
                <div className="mt-1 text-sm font-bold text-brand-blue">{formatPrice(item.product)}/box</div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-1 rounded-lg border border-border dark:border-white/10">
                    <button onClick={() => updateCartQty(item.product.id, item.quantityBoxes - 1)} className="px-3 py-1.5 text-ink dark:text-white">−</button>
                    <span className="w-8 text-center text-sm font-semibold text-ink dark:text-white">{item.quantityBoxes}</span>
                    <button onClick={() => updateCartQty(item.product.id, item.quantityBoxes + 1)} className="px-3 py-1.5 text-ink dark:text-white">+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.product.id)} className="text-xs font-semibold text-slate-400 transition hover:text-red-500">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-2xl border border-border bg-white p-6 dark:bg-navy2 dark:border-white/10">
          <h2 className="font-heading text-lg font-bold text-ink dark:text-white">Order Summary</h2>
          <div className="mt-4 flex items-center justify-between border-b border-border pb-4 dark:border-white/10">
            <span className="text-sm text-slate-400">Subtotal</span>
            <span className="font-heading text-xl font-extrabold text-brand-blue">₹{cartTotal.toLocaleString('en-IN')}</span>
          </div>
          <p className="mt-3 text-xs text-slate-400">GST & shipping calculated at checkout.</p>
          <button
            onClick={() => router.push('/checkout')}
            className="mt-5 w-full rounded-xl bg-gradient-to-r from-brand-blue to-brand-deep py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
          >
            Proceed to Checkout
          </button>
          <button onClick={() => router.push('/shop')} className="mt-2 w-full rounded-xl border-[1.5px] border-brand-blue py-3 text-sm font-bold text-brand-blue transition hover:bg-brand-blue/5">
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
