'use client';

import { useEffect, useState } from 'react';
import { API } from '@/lib/api';
import { PageHeader, Card, Button, Field, Input, Toggle } from '@/components/admin/AdminUI';
import { Icon } from '@/components/ui/Icons';
import { TILE_UNITS } from '@/lib/calculator';

export default function AdminCalculatorPage() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    API.getCalculatorSettings().then(res => {
      if (res?.success && res.settings) setForm({ ...res.settings });
    });
  }, []);

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const res = await API.updateCalculatorSettings(form);
    setSaving(false);
    setMessage(res?.success
      ? { tone: 'ok', text: 'Calculator settings saved.' }
      : { tone: 'err', text: res?.message || 'Failed to save. Please try again.' });
  };

  if (!form) {
    return (
      <div>
        <PageHeader title="Tile Calculator" subtitle="Configure the customer-facing tile quantity calculator." />
        <Card><p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading settings…</p></Card>
      </div>
    );
  }

  const wastageOptions = form.wastage_options || [];
  const tileSizePresets = form.tile_size_presets || [];
  const areaPresets = form.area_presets || [];

  return (
    <div>
      <PageHeader
        title="Tile Calculator"
        subtitle="Configure wastage defaults, tile size presets and area presets used on /calculator — no code changes needed."
        action={<Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>}
      />

      {message && (
        <div className={`mb-5 rounded-xl px-4 py-3 text-sm font-semibold ${
          message.tone === 'ok'
            ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400'
            : 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-col gap-6">
        <Card>
          <h3 className="mb-4 font-heading text-sm font-extrabold uppercase tracking-wide text-brand-blue">General</h3>
          <div className="flex flex-col gap-4">
            <Toggle checked={!!form.enabled} onChange={v => setField('enabled', v)} label="Calculator enabled on the website" />
            <Toggle checked={form.enable_price !== false} onChange={v => setField('enable_price', v)} label="Show estimated cost (when product price is available)" />
            <Toggle checked={form.enable_box !== false} onChange={v => setField('enable_box', v)} label="Show boxes required (when product packaging data is available)" />
            <Toggle checked={form.enable_whatsapp !== false} onChange={v => setField('enable_whatsapp', v)} label="Show “Enquire For These Tiles” WhatsApp button" />
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-heading text-sm font-extrabold uppercase tracking-wide text-brand-blue">Wastage</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Default Wastage %" hint="Pre-selected when a customer opens the calculator.">
              <Input type="number" min="0" value={form.default_wastage ?? ''} onChange={e => setField('default_wastage', Number(e.target.value))} />
            </Field>
            <Field label="Maximum Wastage %" hint="Caps the custom wastage input.">
              <Input type="number" min="0" value={form.max_wastage ?? ''} onChange={e => setField('max_wastage', Number(e.target.value))} />
            </Field>
          </div>
          <div className="mt-4">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Quick-select Wastage Options (%)</span>
            <ListEditor
              items={wastageOptions}
              onChange={items => setField('wastage_options', items)}
              renderItem={(item, onEdit) => (
                <Input type="number" min="0" value={item} onChange={e => onEdit(Number(e.target.value))} className="w-24" />
              )}
              newItem={() => 10}
            />
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-heading text-sm font-extrabold uppercase tracking-wide text-brand-blue">Tile Size Presets</h3>
          <ListEditor
            items={tileSizePresets}
            onChange={items => setField('tile_size_presets', items)}
            newItem={() => ({ length: 600, width: 600, unit: 'mm' })}
            renderItem={(item, onEdit) => (
              <div className="grid grid-cols-3 gap-2">
                <Input type="number" min="0" value={item.length} onChange={e => onEdit({ ...item, length: Number(e.target.value) })} placeholder="Length" />
                <Input type="number" min="0" value={item.width} onChange={e => onEdit({ ...item, width: Number(e.target.value) })} placeholder="Width" />
                <select
                  value={item.unit}
                  onChange={e => onEdit({ ...item, unit: e.target.value })}
                  className="w-full cursor-pointer rounded-xl border-[1.5px] border-border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand-blue dark:bg-navy dark:text-white dark:border-white/10"
                >
                  {TILE_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
            )}
          />
        </Card>

        <Card>
          <h3 className="mb-4 font-heading text-sm font-extrabold uppercase tracking-wide text-brand-blue">Area Presets</h3>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Organizational labels shown when a customer names an area in Multiple Areas mode — these never auto-fill dimensions.</p>
          <ListEditor
            items={areaPresets}
            onChange={items => setField('area_presets', items)}
            newItem={() => 'New Area'}
            renderItem={(item, onEdit) => <Input value={item} onChange={e => onEdit(e.target.value)} />}
          />
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
      </div>
    </div>
  );
}

function ListEditor({ items, onChange, renderItem, newItem }) {
  const update = (i, value) => onChange(items.map((it, idx) => (idx === i ? value : it)));
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, newItem()]);

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex-1">{renderItem(item, v => update(i, v))}</div>
          <button
            onClick={() => remove(i)}
            aria-label="Remove"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10 dark:text-slate-400"
          >
            <Icon.close className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-border py-2.5 text-sm font-bold text-brand-blue transition hover:border-brand-blue dark:border-white/15"
      >
        + Add
      </button>
    </div>
  );
}
