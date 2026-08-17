'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API } from '@/lib/api';
import { PageHeader, Card } from '@/components/admin/AdminUI';
import { Icon, AnyIcon } from '@/components/ui/Icons';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [productsRes, categoriesRes, ordersRes, inquiriesRes] = await Promise.all([
        API.getProducts('?limit=1'),
        API.getCategories(),
        API.getOrders(),
        API.getInquiries()
      ]);
      if (cancelled) return;
      const orders = ordersRes.success ? ordersRes.orders : [];
      const categories = categoriesRes.success ? categoriesRes.categories : [];
      setStats({
        revenue: orders.reduce((sum, o) => sum + (parseFloat(o.net_payable) || 0), 0),
        products: productsRes.success ? productsRes.pagination.total : 0,
        mainCategories: categories.filter(c => !c.parent_id).length,
        totalCategories: categories.length,
        orders: orders.length,
        inquiries: inquiriesRes.success ? inquiriesRes.inquiries.length : 0
      });
    })();
    return () => { cancelled = true; };
  }, []);

  const cards = [
    { label: 'Marketplace Revenue', value: stats ? `₹${stats.revenue.toLocaleString('en-IN')}` : '—', icon: 'bag', tone: 'text-brand-blue' },
    { label: 'Published Products', value: stats?.products ?? '—', icon: 'gem', tone: 'text-emerald-500' },
    { label: 'Main Categories', value: stats?.mainCategories ?? '—', icon: 'layout', tone: 'text-amber-500', sub: stats ? `${stats.totalCategories} taxonomy entries total` : null },
    { label: 'Customer Orders', value: stats?.orders ?? '—', icon: 'scales', tone: 'text-violet-500' },
    { label: 'Open Inquiries', value: stats?.inquiries ?? '—', icon: 'chat', tone: 'text-rose-500' }
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Live snapshot of the Meenakshi Build World catalog." />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(c => (
          <Card key={c.label}>
            <div className="flex items-center gap-4">
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light dark:bg-white/5 ${c.tone}`}>
                <AnyIcon id={c.icon} className="h-6 w-6" />
              </span>
              <div>
                <div className="font-heading text-2xl font-extrabold text-ink dark:text-white">{c.value}</div>
                <div className="text-xs font-medium text-slate-400">{c.label}</div>
                {c.sub && <div className="mt-0.5 text-[10px] text-slate-400">{c.sub}</div>}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: '/admin/categories', label: 'Manage Categories', desc: 'Add areas, sizes, designs & more' },
          { href: '/admin/products/new', label: 'Add Product', desc: 'Publish a new SKU' },
          { href: '/admin/orders', label: 'Review Orders', desc: 'Update fulfilment status' },
          { href: '/admin/attributes', label: 'Spec Attributes', desc: 'Manage technical spec fields' }
        ].map(a => (
          <Link key={a.href} href={a.href} className="group rounded-2xl border-[1.5px] border-dashed border-border bg-white p-5 transition hover:border-brand-blue dark:bg-navy2 dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="font-heading text-sm font-bold text-ink dark:text-white">{a.label}</span>
              <Icon.arrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-brand-blue" />
            </div>
            <p className="mt-1.5 text-xs text-slate-400">{a.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
