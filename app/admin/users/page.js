'use client';

import { useCallback, useEffect, useState } from 'react';
import { API } from '@/lib/api';
import { useApp } from '@/lib/store';
import { PageHeader, Card, Button, Field, Input, Select, Badge, Modal, EmptyState } from '@/components/admin/AdminUI';
import { Icon } from '@/components/ui/Icons';

const EMPTY = { name: '', email: '', password: '', role: 'dealer', phone: '', company_name: '', gstin: '', credit_limit: '' };

function randomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = new Uint32Array(10);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => chars[b % chars.length]).join('') + '@' + (bytes[0] % 90 + 10);
}

export default function AdminUsersPage() {
  const { user: me } = useApp();
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('dealer');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | user
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [issued, setIssued] = useState(null); // credentials to hand out after save

  const load = useCallback(async () => {
    setLoading(true);
    const res = await API.getUsers(filter === 'all' ? '' : filter);
    if (res.success) setUsers(res.users);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ ...EMPTY, password: randomPassword() }); setError(''); setEditing('new'); };
  const openEdit = (u) => {
    setForm({ ...EMPTY, ...u, password: '', credit_limit: u.credit_limit ?? '' });
    setError('');
    setEditing(u);
  };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = { ...form };
    if (editing !== 'new' && !payload.password) delete payload.password;
    const res = editing === 'new' ? await API.createUser(payload) : await API.updateUser(editing.id, payload);
    setSaving(false);
    if (!res.success) { setError(res.message || 'Could not save'); return; }
    if (form.password) setIssued({ email: res.user.email, password: form.password, role: res.user.role });
    setEditing(null);
    load();
  };

  const remove = async (u) => {
    if (!confirm(`Delete the login for ${u.email}? They will no longer be able to sign in.`)) return;
    const res = await API.deleteUser(u.id);
    if (!res.success) { alert(res.message); return; }
    load();
  };

  const loginUrl = (role) => (typeof window === 'undefined' ? '' : `${window.location.origin}${role === 'admin' ? '/admin/login' : '/dealer-login'}`);

  return (
    <div>
      <PageHeader
        title="Logins"
        subtitle="Create dealer and admin accounts, reset passwords and hand out credentials."
        action={<Button onClick={openNew}><Icon.user className="h-4 w-4" /> Add Login</Button>}
      />

      {issued && (
        <Card className="mb-5 border-brand-blue">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-sm font-bold text-ink dark:text-white">Login credentials — share these with the {issued.role}</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">The password is shown only now. You can reset it later from Edit.</p>
            </div>
            <button onClick={() => setIssued(null)} aria-label="Dismiss" className="text-slate-500"><Icon.close className="h-4 w-4" /></button>
          </div>
          <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
            <div><dt className="text-xs font-bold uppercase text-slate-500">Login page</dt><dd className="break-all font-semibold text-ink dark:text-white">{loginUrl(issued.role)}</dd></div>
            <div><dt className="text-xs font-bold uppercase text-slate-500">Email</dt><dd className="break-all font-semibold text-ink dark:text-white">{issued.email}</dd></div>
            <div><dt className="text-xs font-bold uppercase text-slate-500">Password</dt><dd className="font-mono font-semibold text-ink dark:text-white">{issued.password}</dd></div>
          </dl>
          <Button
            variant="outline"
            className="mt-3"
            onClick={() => navigator.clipboard?.writeText(`Login: ${loginUrl(issued.role)}\nEmail: ${issued.email}\nPassword: ${issued.password}`)}
          >
            Copy credentials
          </Button>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {[['dealer', 'Dealers'], ['admin', 'Admins'], ['customer', 'Customers'], ['all', 'All']].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${filter === k ? 'bg-brand-blue text-white' : 'bg-white text-slate-500 hover:bg-slate-100 dark:bg-navy2 dark:text-slate-400'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <Card className="p-0">
        {loading ? <EmptyState label="Loading accounts…" /> : users.length === 0 ? <EmptyState label="No accounts yet. Use “Add Login” to create one." /> : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-slate-500 dark:border-white/10">
                  <th className="p-3.5">Name</th>
                  <th className="hidden p-3.5 md:table-cell">Company</th>
                  <th className="hidden p-3.5 sm:table-cell">Role</th>
                  <th className="hidden p-3.5 lg:table-cell">Credit limit</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-border last:border-0 dark:border-white/5">
                    <td className="p-3.5">
                      <div className="font-semibold text-ink dark:text-white">{u.name}</div>
                      <div className="break-all text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="hidden p-3.5 text-xs text-slate-500 md:table-cell">{u.company_name || '—'}</td>
                    <td className="hidden p-3.5 sm:table-cell"><Badge tone={u.role === 'admin' ? 'blue' : u.role === 'dealer' ? 'green' : 'slate'}>{u.role}</Badge></td>
                    <td className="hidden p-3.5 text-xs text-slate-500 lg:table-cell">{u.credit_limit ? `₹${Number(u.credit_limit).toLocaleString('en-IN')}` : '—'}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => openEdit(u)} className="text-xs font-bold text-brand-blue hover:underline">Edit / Reset password</button>
                        {String(u.id) !== String(me?.id) && (
                          <button onClick={() => remove(u)} className="text-xs font-bold text-rose-600 hover:underline dark:text-rose-400">Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ChangeOwnPassword />

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add Login' : `Edit — ${editing?.email || ''}`} wide>
        <form onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Contact name" required><Input value={form.name} onChange={e => set('name', e.target.value)} required /></Field>
          <Field label="Email (login ID)" required><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} required /></Field>
          <Field label={editing === 'new' ? 'Password' : 'New password'} required={editing === 'new'} hint={editing === 'new' ? 'At least 8 characters. A strong one is pre-filled.' : 'Leave blank to keep the current password.'}>
            <div className="flex gap-2">
              <Input value={form.password} onChange={e => set('password', e.target.value)} required={editing === 'new'} minLength={8} className="font-mono" autoComplete="new-password" />
              <button type="button" onClick={() => set('password', randomPassword())} className="shrink-0 rounded-xl border-[1.5px] border-border px-3 text-xs font-bold text-slate-500 dark:border-white/10">Generate</button>
            </div>
          </Field>
          <Field label="Role">
            <Select value={form.role} onChange={e => set('role', e.target.value)} disabled={editing !== 'new' && String(editing?.id) === String(me?.id)}>
              <option value="dealer">Dealer</option>
              <option value="admin">Admin</option>
              <option value="customer">Customer</option>
            </Select>
          </Field>
          <Field label="Company"><Input value={form.company_name || ''} onChange={e => set('company_name', e.target.value)} /></Field>
          <Field label="Phone"><Input value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></Field>
          <Field label="GSTIN"><Input value={form.gstin || ''} onChange={e => set('gstin', e.target.value)} /></Field>
          <Field label="Credit limit (₹)"><Input type="number" min="0" step="1" value={form.credit_limit} onChange={e => set('credit_limit', e.target.value)} /></Field>
          {error && <div className="rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-600 dark:bg-rose-500/10 sm:col-span-2">{error}</div>}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Login'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ChangeOwnPassword() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const res = await API.changePassword(current, next);
    setBusy(false);
    setMsg({ ok: res.success, text: res.success ? 'Your password was changed.' : res.message || 'Could not change password' });
    if (res.success) { setCurrent(''); setNext(''); }
  };

  return (
    <Card className="mt-6 max-w-xl">
      <h2 className="mb-1 font-heading text-sm font-bold text-ink dark:text-white">Change my password</h2>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Change the default admin password after your first sign-in.</p>
      <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Current password"><Input type="password" value={current} onChange={e => setCurrent(e.target.value)} required autoComplete="current-password" /></Field>
        <Field label="New password"><Input type="password" value={next} onChange={e => setNext(e.target.value)} required minLength={8} autoComplete="new-password" /></Field>
        {msg && <div className={`rounded-xl px-4 py-2.5 text-xs font-semibold sm:col-span-2 ${msg.ok ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10'}`}>{msg.text}</div>}
        <div className="sm:col-span-2"><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Update Password'}</Button></div>
      </form>
    </Card>
  );
}
