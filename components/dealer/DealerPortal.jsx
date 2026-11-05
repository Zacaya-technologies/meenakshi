'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API } from '@/lib/api';
import { useApp } from '@/lib/store';
import { Icon } from '@/components/ui/Icons';

const inputClass = 'w-full rounded-xl border-[1.5px] border-border bg-white px-3.5 py-2.5 text-sm text-ink outline-hidden transition focus:border-brand-blue dark:bg-navy dark:text-white dark:border-white/10';

export default function DealerPortal() {
  const { user, hydrated } = useApp();

  if (!hydrated) {
    return <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500 dark:text-slate-400">Loading…</div>;
  }
  if (user && (user.role === 'dealer' || user.role === 'admin')) return <DealerDashboard />;
  return <DealerLoginForm />;
}

function DealerLoginForm() {
  const { user, login, logout } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await API.login(email, password);
    setLoading(false);
    if (!res.success) { setError(res.message || 'Login failed'); return; }
    if (res.user.role !== 'dealer' && res.user.role !== 'admin') {
      setError('This account is not a dealer account. Contact us to apply for dealer access.');
      return;
    }
    login(res.user, res.token);
  };

  return (
    <div className="mx-auto grid max-w-shell grid-cols-1 items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
      <div>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-blue">Trade Partners</span>
        <h1 className="mt-2 font-heading text-4xl font-extrabold text-ink dark:text-white">Dealer Login</h1>
        <p className="mt-3 max-w-md text-sm text-slate-500 dark:text-slate-400">
          Sign in to see dealer pricing on every product, track your orders and your credit limit.
        </p>
        <ul className="mt-6 space-y-3 text-sm text-ink dark:text-slate-200">
          {['Dealer price on every product page', 'Your orders and their status', 'Credit limit and account details'].map(t => (
            <li key={t} className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue"><Icon.check className="h-3.5 w-3.5" /></span>
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          Not a dealer yet? <Link href="/contact" className="font-semibold text-brand-blue hover:underline">Contact us</Link> to apply.
        </p>
      </div>

      <form onSubmit={submit} className="w-full max-w-md justify-self-center rounded-2xl border-[1.5px] border-border bg-white p-8 shadow-card dark:bg-navy2 dark:border-white/10 lg:justify-self-end">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-brand-blue to-brand-deep text-white shadow-glow">
            <Icon.user className="h-6 w-6" />
          </span>
          <div>
            <h2 className="font-heading text-lg font-extrabold text-ink dark:text-white">Sign in to your account</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Use the login details from Meenakshi Build World</p>
          </div>
        </div>

        {user && (
          <div className="mb-4 rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            You are signed in as {user.email}, which is not a dealer account.{' '}
            <button type="button" onClick={logout} className="underline">Sign out</button>
          </div>
        )}
        {error && <div className="mb-4 rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-600 dark:bg-rose-500/10">{error}</div>}

        <label className="mb-3 block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" className={inputClass} />
        </label>
        <label className="mb-5 block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Password</span>
          <span className="relative block">
            <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" className={`${inputClass} pr-16`} />
            <button type="button" onClick={() => setShow(s => !s)} className="absolute inset-y-0 right-3 text-xs font-bold text-brand-blue">
              {show ? 'Hide' : 'Show'}
            </button>
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand-blue to-brand-deep py-3 text-sm font-bold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">Forgot your password? Ask your Meenakshi Build World contact to reset it.</p>
      </form>
    </div>
  );
}

const STATUS_TONE = {
  delivered: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  cancelled: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400'
};

function DealerDashboard() {
  const { user, logout } = useApp();
  const [profile, setProfile] = useState(user);
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    API.me().then(res => { if (res.success) setProfile(res.user); });
    API.getOrders().then(res => setOrders(res.success ? res.orders || [] : []));
  }, []);

  const p = profile || user;

  return (
    <div className="mx-auto max-w-shell px-4 py-10 sm:px-6 lg:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-blue">Dealer Portal</span>
          <h1 className="mt-1 font-heading text-3xl font-extrabold text-ink dark:text-white">Welcome, {p.name}</h1>
          {p.company_name && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{p.company_name}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {user.role === 'admin' && (
            <Link href="/admin" className="rounded-xl border-[1.5px] border-brand-blue px-4 py-2.5 text-sm font-bold text-brand-blue transition hover:bg-brand-blue/5">Admin Console</Link>
          )}
          <button onClick={logout} className="rounded-xl border-[1.5px] border-rose-400 px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10">Sign out</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Credit limit" value={p.credit_limit ? `₹${Number(p.credit_limit).toLocaleString('en-IN')}` : '—'} />
        <Stat label="GSTIN" value={p.gstin || '—'} />
        <Stat label="Orders placed" value={orders ? orders.length : '…'} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickLink href="/all-tiles" title="Browse catalogue" text="Dealer prices show on each product page while you are signed in." />
        <QuickLink href="/calculator" title="Tile calculator" text="Work out boxes needed for a site." />
        <QuickLink href="/contact" title="Contact sales" text="Bulk quotes, stock checks and delivery." />
      </div>

      <section className="mt-10 rounded-2xl border-[1.5px] border-border bg-white p-5 shadow-card dark:bg-navy2 dark:border-white/10">
        <h2 className="mb-4 font-heading text-lg font-bold text-ink dark:text-white">Your orders</h2>
        {orders === null ? (
          <p className="py-6 text-center text-sm text-slate-500">Loading orders…</p>
        ) : orders.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-slate-500 dark:border-white/10">
                  <th className="p-3">Order</th>
                  <th className="hidden p-3 sm:table-cell">Date</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-b border-border last:border-0 dark:border-white/5">
                    <td className="p-3 font-semibold text-ink dark:text-white">{o.order_number}</td>
                    <td className="hidden p-3 text-xs text-slate-500 sm:table-cell">{String(o.created_at || '').slice(0, 10)}</td>
                    <td className="p-3 font-bold text-brand-blue">₹{Number(o.net_payable || o.total_amount || 0).toLocaleString('en-IN')}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${STATUS_TONE[o.order_status] || 'bg-brand-blue/10 text-brand-blue'}`}>{o.order_status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <DealerPassword />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border-[1.5px] border-border bg-white p-5 shadow-card dark:bg-navy2 dark:border-white/10">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 break-all font-heading text-2xl font-extrabold text-ink dark:text-white">{value}</div>
    </div>
  );
}

function QuickLink({ href, title, text }) {
  return (
    <Link href={href} className="group rounded-2xl border-[1.5px] border-border bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-blue dark:bg-navy2 dark:border-white/10">
      <div className="flex items-center justify-between font-heading text-base font-bold text-ink dark:text-white">
        {title}
        <Icon.arrowRight className="h-4 w-4 text-brand-blue transition group-hover:translate-x-0.5" />
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{text}</p>
    </Link>
  );
}

function DealerPassword() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const res = await API.changePassword(current, next);
    setBusy(false);
    setMsg({ ok: res.success, text: res.success ? 'Password changed.' : res.message || 'Could not change password' });
    if (res.success) { setCurrent(''); setNext(''); }
  };

  return (
    <section className="mt-6 max-w-xl rounded-2xl border-[1.5px] border-border bg-white p-5 shadow-card dark:bg-navy2 dark:border-white/10">
      <h2 className="mb-4 font-heading text-lg font-bold text-ink dark:text-white">Change password</h2>
      <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Current password</span>
          <input type="password" value={current} onChange={e => setCurrent(e.target.value)} required autoComplete="current-password" className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">New password</span>
          <input type="password" value={next} onChange={e => setNext(e.target.value)} required minLength={8} autoComplete="new-password" className={inputClass} />
        </label>
        {msg && <div className={`rounded-xl px-4 py-2.5 text-xs font-semibold sm:col-span-2 ${msg.ok ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10'}`}>{msg.text}</div>}
        <div className="sm:col-span-2">
          <button type="submit" disabled={busy} className="rounded-xl bg-linear-to-r from-brand-blue to-brand-deep px-5 py-2.5 text-sm font-bold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60">
            {busy ? 'Saving…' : 'Update Password'}
          </button>
        </div>
      </form>
    </section>
  );
}
