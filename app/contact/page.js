'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icons';
import { API } from '@/lib/api';
import { useBusiness, telHref, waLink, waGreeting } from '@/lib/business';

export default function ContactPage() {
  const business = useBusiness();
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [status, setStatus] = useState(null);

  const phones = [business.primary_phone, business.secondary_phone, business.additional_phone].filter(Boolean);

  const submit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    const res = await API.submitInquiry({ type: 'contact', ...form });
    if (res?.success) {
      setStatus('sent');
      setForm({ name: '', phone: '', email: '', message: '' });
    } else {
      setStatus('error');
    }
  };

  return (
    <div className="bg-brand-light dark:bg-navy">
      {/* Hero */}
      <section className="bg-brand-navy py-16 text-white">
        <div className="mx-auto max-w-[1380px] px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-blue">Contact Us</p>
          <h1 className="mt-3 font-heading text-3xl font-black uppercase leading-tight sm:text-4xl md:text-5xl">
            Get in Touch with<br className="hidden sm:block" /> Meenakshi Build World
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">
            We&apos;re here to help you find the right building materials for your home, project or business.
          </p>
        </div>
      </section>

      {/* Action buttons */}
      <section className="mx-auto -mt-8 max-w-[1380px] px-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <ActionCard href={telHref(business.primary_phone)} icon={<Icon.phoneCall className="h-6 w-6" />} label="Call Now" sub={business.primary_phone} tone="from-brand-blue to-brand-deep" />
          <ActionCard href={waLink(business.whatsapp_number, waGreeting(business))} external icon={<Icon.whatsapp className="h-6 w-6" />} label="WhatsApp" sub={business.primary_phone} tone="from-[#25D366] to-[#128C7E]" />
          <ActionCard href={`mailto:${business.email}`} icon={<Icon.mail className="h-6 w-6" />} label="Email Us" sub={business.email} tone="from-amber-500 to-orange-600" />
          <ActionCard href={business.google_maps_url} external icon={<Icon.mapPin className="h-6 w-6" />} label="Get Directions" sub="Corporate Office, Hennur Road" tone="from-violet-500 to-purple-700" />
        </div>
      </section>

      {/* Info + form */}
      <section className="mx-auto grid max-w-[1380px] gap-8 px-6 py-14 lg:grid-cols-5">
        <div className="flex flex-col gap-6 lg:col-span-3">
          <InfoBlock title="Contact Information">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="mb-2 flex items-center gap-2 font-heading text-sm font-bold text-ink dark:text-white">
                  <Icon.phone className="h-4 w-4 text-brand-blue" /> Phone
                </h4>
                <ul className="flex flex-col gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  {phones.map(p => (
                    <li key={p}><a href={telHref(p)} className="transition hover:text-brand-blue">{p}</a></li>
                  ))}
                  {String(business.landline || '').split(',').map(l => l.trim()).filter(Boolean).map(l => (
                    <li key={l}><a href={telHref(l)} className="transition hover:text-brand-blue">{l}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="mb-2 flex items-center gap-2 font-heading text-sm font-bold text-ink dark:text-white">
                  <Icon.mail className="h-4 w-4 text-brand-blue" /> Email
                </h4>
                <a href={`mailto:${business.email}`} className="text-sm transition hover:text-brand-blue">{business.email}</a>
                <h4 className="mb-2 mt-5 flex items-center gap-2 font-heading text-sm font-bold text-ink dark:text-white">
                  <Icon.phoneCall className="h-4 w-4 text-brand-blue" /> Business Hours
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">{business.business_hours}</p>
              </div>
            </div>
          </InfoBlock>

          <InfoBlock title="Corporate Office">
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-500 dark:text-slate-400">{business.corporate_address}</p>
          </InfoBlock>

          <InfoBlock title="Store">
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-500 dark:text-slate-400">{business.store_address}</p>
          </InfoBlock>

          {/* Google Map — corporate office */}
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-card dark:border-white/10 dark:bg-navy2">
            <iframe
              title={`${business.business_name} — Corporate Office location map`}
              src="https://www.google.com/maps?q=Byrathi%20Cross%2C%20Hennur%20Road%2C%20Bangalore%20560077&output=embed"
              className="h-[320px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>

        {/* Enquiry form */}
        <div className="lg:col-span-2">
          <form onSubmit={submit} className="rounded-2xl border-[1.5px] border-border bg-white p-6 shadow-card dark:border-white/10 dark:bg-navy2">
            <h3 className="font-heading text-lg font-extrabold text-ink dark:text-white">Send an Enquiry</h3>
            <p className="mb-5 mt-1 text-sm text-slate-400">Tell us what you need — our team will get back to you.</p>

            <label className="mb-4 block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Name *</span>
              <input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border-[1.5px] border-border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-blue dark:border-white/10 dark:bg-navy dark:text-white"
                placeholder="Your full name"
              />
            </label>
            <label className="mb-4 block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Phone *</span>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-xl border-[1.5px] border-border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-blue dark:border-white/10 dark:bg-navy dark:text-white"
                placeholder="+91"
              />
            </label>
            <label className="mb-4 block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border-[1.5px] border-border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-blue dark:border-white/10 dark:bg-navy dark:text-white"
                placeholder="you@example.com"
              />
            </label>
            <label className="mb-5 block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Message *</span>
              <textarea
                required
                rows={4}
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                className="w-full rounded-xl border-[1.5px] border-border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-blue dark:border-white/10 dark:bg-navy dark:text-white"
                placeholder="Products, quantities or project details…"
              />
            </label>

            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full rounded-xl bg-gradient-to-r from-brand-blue to-brand-deep px-4 py-3 text-sm font-bold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              {status === 'sending' ? 'Sending…' : 'Submit Enquiry'}
            </button>

            {status === 'sent' && (
              <p className="mt-3 rounded-xl bg-green-100 px-4 py-2.5 text-center text-sm font-semibold text-green-700 dark:bg-green-500/15 dark:text-green-400">
                Thank you! Your enquiry has been received.
              </p>
            )}
            {status === 'error' && (
              <p className="mt-3 rounded-xl bg-rose-100 px-4 py-2.5 text-center text-sm font-semibold text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                Something went wrong. Please call us at {business.primary_phone}.
              </p>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}

function ActionCard({ href, icon, label, sub, tone, external }) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="group flex items-center gap-3 rounded-2xl border-[1.5px] border-border bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand-blue dark:border-white/10 dark:bg-navy2"
    >
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tone} text-white`}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-heading text-sm font-bold text-ink dark:text-white">{label}</span>
        <span className="block truncate text-xs text-slate-400">{sub}</span>
      </span>
    </a>
  );
}

function InfoBlock({ title, children }) {
  return (
    <div className="rounded-2xl border-[1.5px] border-border bg-white p-6 shadow-card dark:border-white/10 dark:bg-navy2">
      <h3 className="mb-4 font-heading text-base font-extrabold uppercase tracking-wide text-ink dark:text-white">{title}</h3>
      {children}
    </div>
  );
}
