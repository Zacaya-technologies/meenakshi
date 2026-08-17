'use client';

import { useEffect, useState } from 'react';
import { API } from '@/lib/api';
import { PageHeader, Card, Button, Field, Input, TextArea, Toggle, Modal, Badge, EmptyState } from '@/components/admin/AdminUI';
import { Icon } from '@/components/ui/Icons';

const empty = { name: '', logo_url: '', banner_url: '', description: '', is_featured: false };

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = async () => {
    setLoading(true);
    const res = await API.getBrands();
    if (res.success) setBrands(res.brands);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (form) => {
    const res = await API.createBrand(form);
    if (!res.success) { alert(res.message); return; }
    setModal(null);
    load();
  };

  const remove = async (b) => {
    if (!confirm(`Delete brand "${b.name}"?`)) return;
    await API.deleteBrand(b.id);
    load();
  };

  return (
    <div>
      <PageHeader title="Brands" subtitle={`${brands.length} manufacturing partners`} action={<Button onClick={() => setModal({ ...empty })}><Icon.grid className="h-4 w-4" /> Add Brand</Button>} />

      {loading ? (
        <EmptyState label="Loading brands…" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map(b => (
            <Card key={b.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading text-sm font-bold text-ink dark:text-white">{b.name}</h3>
                  <p className="text-xs text-slate-400">/{b.slug}</p>
                </div>
                {b.is_featured ? <Badge tone="blue">Featured</Badge> : null}
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-slate-400">{b.description}</p>
              <button onClick={() => remove(b)} className="mt-3 text-xs font-bold text-rose-500 hover:underline">Delete</button>
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <Modal open onClose={() => setModal(null)} title="Add Brand">
          <BrandForm form={modal} onSave={save} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

function BrandForm({ form: initial, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="grid grid-cols-1 gap-4">
      <Field label="Name" required><Input value={form.name} onChange={e => set('name', e.target.value)} required autoFocus /></Field>
      <Field label="Logo URL"><Input value={form.logo_url} onChange={e => set('logo_url', e.target.value)} /></Field>
      <Field label="Banner URL"><Input value={form.banner_url} onChange={e => set('banner_url', e.target.value)} /></Field>
      <Field label="Description"><TextArea rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></Field>
      <Toggle checked={form.is_featured} onChange={v => set('is_featured', v)} label="Featured brand" />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit">Create Brand</Button>
      </div>
    </form>
  );
}
