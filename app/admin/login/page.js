'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API } from '@/lib/api';
import { useApp } from '@/lib/store';
import { Icon } from '@/components/ui/Icons';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useApp();
  const [email, setEmail] = useState('admin@meenakshibuildworld.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await API.login(email, password);
    setLoading(false);
    if (!res.success) { setError(res.message || 'Login failed'); return; }
    if (res.user.role !== 'admin') { setError('This account does not have admin access.'); return; }
    login(res.user, res.token);
    router.push('/admin');
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border-[1.5px] border-border bg-white p-8 shadow-card dark:bg-navy2 dark:border-white/10">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-deep font-heading text-2xl font-black text-white shadow-glow">M</span>
          <h1 className="font-heading text-xl font-extrabold text-ink dark:text-white">Admin Console</h1>
          <p className="mt-1 text-xs text-slate-400">Meenakshi Build World</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-600 dark:bg-rose-500/10">{error}</div>
        )}

        <label className="mb-3 block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</span>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)} required
            className="w-full rounded-xl border-[1.5px] border-border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand-blue dark:bg-navy dark:text-white dark:border-white/10"
          />
        </label>
        <label className="mb-5 block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Password</span>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)} required
            className="w-full rounded-xl border-[1.5px] border-border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand-blue dark:bg-navy dark:text-white dark:border-white/10"
          />
        </label>

        <button
          type="submit" disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-deep py-3 text-sm font-bold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          {loading ? 'Signing in…' : (<><Icon.user className="h-4 w-4" /> Sign In</>)}
        </button>
      </form>
    </div>
  );
}
