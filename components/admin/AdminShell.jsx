'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { Icon, AnyIcon } from '@/components/ui/Icons';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: 'grid', exact: true },
  { href: '/admin/categories', label: 'Categories', icon: 'layout' },
  { href: '/admin/attributes', label: 'Attributes', icon: 'filter' },
  { href: '/admin/products', label: 'Products', icon: 'gem' },
  { href: '/admin/brands', label: 'Brands', icon: 'star' },
  { href: '/admin/collections', label: 'Collections', icon: 'layers' },
  { href: '/admin/orders', label: 'Orders', icon: 'bag' },
  { href: '/admin/inquiries', label: 'Inquiries', icon: 'chat' },
  { href: '/admin/business', label: 'Business Info', icon: 'building' }
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrated, logout } = useApp();
  const [navOpen, setNavOpen] = useState(false);

  const isLogin = pathname === '/admin/login';

  useEffect(() => {
    if (!hydrated || isLogin) return;
    if (!user || user.role !== 'admin') router.replace('/admin/login');
  }, [hydrated, user, isLogin, router]);

  if (isLogin) return children;

  if (!hydrated || !user || user.role !== 'admin') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-400">
        {hydrated ? 'Redirecting to admin login…' : 'Loading admin console…'}
      </div>
    );
  }

  const isActive = (item) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));

  return (
    <div className="flex min-h-screen bg-brand-light dark:bg-navy">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 flex-col border-r border-border bg-white transition-transform dark:bg-navy2 dark:border-white/10 lg:static lg:flex lg:translate-x-0 ${navOpen ? 'flex translate-x-0' : 'hidden -translate-x-full'}`}>
        <div className="flex h-16 items-center gap-2 border-b border-border px-5 dark:border-white/10">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-blue to-brand-deep font-heading text-sm font-black text-white">M</span>
          <span className="font-heading text-sm font-extrabold text-ink dark:text-white">Admin Console</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setNavOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                isActive(item) ? 'bg-brand-blue text-white shadow-glow' : 'text-slate-500 hover:bg-brand-light dark:text-slate-400 dark:hover:bg-white/5'
              }`}
            >
              <AnyIcon id={item.icon} className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-3 dark:border-white/10">
          <Link href="/" className="mb-2 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-brand-light dark:text-slate-400 dark:hover:bg-white/5">
            <Icon.arrowRight className="h-4.5 w-4.5 rotate-180" /> View Storefront
          </Link>
          <button
            onClick={() => { logout(); router.push('/admin/login'); }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
          >
            <Icon.close className="h-4.5 w-4.5" /> Logout
          </button>
        </div>
      </aside>

      {navOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setNavOpen(false)} />}

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-border bg-white px-5 dark:bg-navy2 dark:border-white/10 lg:hidden">
          <button onClick={() => setNavOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-border dark:border-white/10" aria-label="Open menu">
            <Icon.menu className="h-5 w-5" />
          </button>
          <span className="font-heading text-sm font-extrabold text-ink dark:text-white">Admin Console</span>
        </div>
        <main className="min-w-0 flex-1 overflow-x-hidden p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
