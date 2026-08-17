'use client';

import { useEffect, useState } from 'react';
import { API } from '@/lib/api';
import { PageHeader, Card, Button, Field, Input, Select, Modal, Badge, EmptyState } from '@/components/admin/AdminUI';
import { Icon } from '@/components/ui/Icons';

const emptyAttr = { id: null, category_id: '', name: '', input_type: 'text', unit: '', display_order: 0 };

export default function AdminAttributesPage() {
  const [mains, setMains] = useState([]);
  const [mainId, setMainId] = useState('');
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [valueModal, setValueModal] = useState(null); // { attributeId, value }

  useEffect(() => {
    (async () => {
      const res = await API.getCategories();
      if (res.success) {
        const roots = res.categories.filter(c => !c.parent_id);
        setMains(roots);
        if (roots.length) setMainId(String(roots[0].id));
      }
    })();
  }, []);

  const load = async (id) => {
    if (!id) return;
    setLoading(true);
    const res = await API.getCategoryAttributes(id);
    if (res.success) setAttributes(res.attributes);
    setLoading(false);
  };

  useEffect(() => { load(mainId); }, [mainId]);

  const save = async (form) => {
    const payload = { category_id: mainId, name: form.name, input_type: form.input_type, unit: form.unit || null, display_order: parseInt(form.display_order) || 0 };
    const res = form.id ? await API.updateCategoryAttribute(form.id, payload) : await API.createCategoryAttribute(payload);
    if (!res.success) { alert(res.message); return; }
    setModal(null);
    await load(mainId);
  };

  const remove = async (attr) => {
    if (!confirm(`Delete attribute "${attr.name}" and all its values?`)) return;
    await API.deleteCategoryAttribute(attr.id);
    await load(mainId);
  };

  const saveValue = async (attributeId, value) => {
    if (!value.trim()) return;
    await API.addAttributeValue(attributeId, { value: value.trim() });
    setValueModal(null);
    await load(mainId);
  };

  const removeValue = async (id) => {
    if (!confirm('Delete this value?')) return;
    await API.deleteAttributeValue(id);
    await load(mainId);
  };

  return (
    <div>
      <PageHeader
        title="Spec Attributes"
        subtitle="Technical specification fields shown on the product detail page (Water Absorption, PEI Rating, Slip Resistance…) — separate from the browsable Area/Size/Design taxonomy."
        action={<Button onClick={() => setModal({ ...emptyAttr })}><Icon.grid className="h-4 w-4" /> Add Attribute</Button>}
      />

      <div className="mb-5 max-w-xs">
        <Select value={mainId} onChange={e => setMainId(e.target.value)}>
          {mains.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </Select>
      </div>

      {loading ? (
        <EmptyState label="Loading attributes…" />
      ) : attributes.length === 0 ? (
        <EmptyState label="No spec attributes for this category yet." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {attributes.map(attr => (
            <Card key={attr.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading text-sm font-bold text-ink dark:text-white">{attr.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {attr.input_type}{attr.unit ? ` • unit: ${attr.unit}` : ''}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setModal(attr)} className="text-xs font-bold text-brand-blue hover:underline">Edit</button>
                  <button onClick={() => remove(attr)} className="text-xs font-bold text-rose-500 hover:underline">Delete</button>
                </div>
              </div>

              {attr.input_type === 'select' && (
                <div className="mt-3 border-t border-border pt-3 dark:border-white/10">
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {attr.values.map(v => (
                      <span key={v.id} className="group flex items-center gap-1 rounded-full bg-brand-light px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
                        {v.value}
                        <button onClick={() => removeValue(v.id)} className="text-slate-400 hover:text-rose-500" aria-label="Remove value">
                          <Icon.close className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    {attr.values.length === 0 && <span className="text-[11px] text-slate-400">No values yet</span>}
                  </div>
                  <button onClick={() => setValueModal({ attributeId: attr.id, value: '' })} className="text-xs font-bold text-brand-blue hover:underline">
                    + Add value
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <AttributeFormModal form={modal} onClose={() => setModal(null)} onSave={save} />
      )}

      {valueModal && (
        <Modal open onClose={() => setValueModal(null)} title="Add Attribute Value">
          <form onSubmit={e => { e.preventDefault(); saveValue(valueModal.attributeId, valueModal.value); }}>
            <Field label="Value" required>
              <Input autoFocus value={valueModal.value} onChange={e => setValueModal(v => ({ ...v, value: e.target.value }))} placeholder="e.g. R11" required />
            </Field>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setValueModal(null)}>Cancel</Button>
              <Button type="submit">Add Value</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function AttributeFormModal({ form: initial, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Modal open onClose={onClose} title={form.id ? 'Edit Attribute' : 'Add Attribute'}>
      <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="grid grid-cols-1 gap-4">
        <Field label="Name" required>
          <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Water Absorption" required autoFocus />
        </Field>
        <Field label="Input type">
          <Select value={form.input_type} onChange={e => set('input_type', e.target.value)}>
            <option value="text">Free text (e.g. "&lt; 0.5%")</option>
            <option value="select">Controlled values (e.g. R9 / R10 / R11)</option>
          </Select>
        </Field>
        <Field label="Unit" hint="Optional, e.g. %, mm, N/mm²">
          <Input value={form.unit} onChange={e => set('unit', e.target.value)} />
        </Field>
        <Field label="Display order">
          <Input type="number" value={form.display_order} onChange={e => set('display_order', e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">{form.id ? 'Save Changes' : 'Create Attribute'}</Button>
        </div>
      </form>
    </Modal>
  );
}
