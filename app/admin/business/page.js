'use client';

import { useEffect, useState } from 'react';
import { API } from '@/lib/api';
import { PageHeader, Card, Button, Field, Input, TextArea } from '@/components/admin/AdminUI';
import { useBusiness } from '@/lib/business';

const GROUPS = [
  {
    title: 'Identity',
    fields: [
      { key: 'business_name', label: 'Business Name' },
      { key: 'logo', label: 'Logo URL', hint: 'e.g. /images/logo.png' },
      { key: 'tagline', label: 'Tagline' },
      { key: 'website_url', label: 'Website URL' }
    ]
  },
  {
    title: 'Contact',
    fields: [
      { key: 'primary_phone', label: 'Primary Phone (CTA number)' },
      { key: 'secondary_phone', label: 'Secondary Phone' },
      { key: 'additional_phone', label: 'Additional Phone' },
      { key: 'landline', label: 'Landline(s)', hint: 'Separate multiple numbers with commas' },
      { key: 'email', label: 'Email' },
      { key: 'whatsapp_number', label: 'WhatsApp Number', hint: 'Digits only with country code, e.g. 919900027700' },
      { key: 'business_hours', label: 'Business Hours' }
    ]
  },
  {
    title: 'Addresses & Map',
    fields: [
      { key: 'corporate_address', label: 'Corporate Address', textarea: true },
      { key: 'store_address', label: 'Store Address', textarea: true },
      { key: 'google_maps_url', label: 'Google Maps URL' }
    ]
  },
  {
    title: 'Social Profiles',
    fields: [
      { key: 'facebook_url', label: 'Facebook URL' },
      { key: 'instagram_url', label: 'Instagram URL' },
      { key: 'linkedin_url', label: 'LinkedIn URL' },
      { key: 'youtube_url', label: 'YouTube URL' }
    ]
  },
  {
    title: 'Description & Footer',
    fields: [
      { key: 'description', label: 'Business Description', textarea: true },
      { key: 'copyright_text', label: 'Copyright Text' }
    ]
  }
];

export default function AdminBusinessPage() {
  const business = useBusiness();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    API.getBusinessSettings().then(res => {
      if (cancelled || !res?.success || !res.business) return;
      setForm({ ...res.business });
    });
    return () => { cancelled = true; };
  }, []);

  // Seed the form from the provider while the fetch is in flight.
  useEffect(() => {
    setForm(prev => prev || { ...business });
  }, [business]);

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const res = await API.updateBusinessSettings(form);
    setSaving(false);
    setMessage(res?.success
      ? { tone: 'ok', text: 'Business information saved. The website updates everywhere automatically.' }
      : { tone: 'err', text: res?.message || 'Failed to save. Please try again.' });
  };

  return (
    <div>
      <PageHeader
        title="Business Information"
        subtitle="Company identity and contact details used across the storefront, contact page, footer, buttons and SEO."
        action={<Button onClick={save} disabled={saving || !form}>{saving ? 'Saving…' : 'Save Changes'}</Button>}
      />

      {!form ? (
        <Card><p className="py-8 text-center text-sm text-slate-400">Loading business settings…</p></Card>
      ) : (
        <>
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
            {GROUPS.map(g => (
              <Card key={g.title}>
                <h3 className="mb-4 font-heading text-sm font-extrabold uppercase tracking-wide text-brand-blue">{g.title}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {g.fields.map(f => (
                    <Field key={f.key} label={f.label} hint={f.hint} className={f.textarea ? 'sm:col-span-2' : ''}>
                      {f.textarea ? (
                        <TextArea rows={4} value={form[f.key] || ''} onChange={e => setField(f.key, e.target.value)} />
                      ) : (
                        <Input value={form[f.key] || ''} onChange={e => setField(f.key, e.target.value)} />
                      )}
                    </Field>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
          </div>
        </>
      )}
    </div>
  );
}
