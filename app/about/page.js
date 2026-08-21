'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icons';
import { useBusiness, telHref, waLink, waGreeting } from '@/lib/business';

export default function AboutPage() {
  const business = useBusiness();

  const stats = [
    { value: '30+', label: 'Years of Experience' },
    { value: '25K+', label: 'Variety of Products' },
    { value: '50+', label: 'Brand Partners' },
    { value: '100+', label: 'Corporate Clients' }
  ];

  const whyUs = [
    { icon: <Icon.star className="h-5 w-5" />, title: '30+ Years Experience', desc: 'Serving Bangalore since 1996 with deep industry expertise.' },
    { icon: <Icon.grid className="h-5 w-5" />, title: 'Wide Product Selection', desc: 'A comprehensive range across every building material category.' },
    { icon: <Icon.starFill className="h-5 w-5" />, title: 'Trusted Brand Partners', desc: 'Authorised supply from leading national and international brands.' },
    { icon: <Icon.user className="h-5 w-5" />, title: 'Expert Product Assistance', desc: 'Knowledgeable staff to guide your material selection.' },
    { icon: <Icon.gem className="h-5 w-5" />, title: 'Quality Products', desc: 'Genuine, certified products for lasting results.' },
    { icon: <Icon.chat className="h-5 w-5" />, title: 'Customer Support', desc: 'Responsive support before and after your purchase.' },
    { icon: <Icon.package className="h-5 w-5" />, title: 'After-Sales Assistance', desc: 'Help with logistics, installation guidance and more.' },
    { icon: <Icon.building className="h-5 w-5" />, title: 'Solutions Under One Roof', desc: 'Everything for residential, commercial and construction projects.' }
  ];

  return (
    <div className="bg-brand-light dark:bg-navy">
      {/* Hero */}
      <section className="bg-brand-navy py-16 text-white">
        <div className="mx-auto max-w-[1380px] px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-blue">About Meenakshi Build World</p>
          <h1 className="mt-3 font-heading text-3xl font-black sm:text-4xl md:text-5xl">Building Trust Since 1996</h1>
          <p className="mx-auto mt-5 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Meenakshi Build World has been serving Bangalore&apos;s building material requirements since 1996.
            Founded by Mr. Anil Kumar A and Mr. Naresh Kumar A, the company has developed into a trusted
            destination for tiles, sanitary ware, steel, cement, plumbing and kitchen products.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto -mt-8 max-w-[1380px] px-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map(s => (
            <div key={s.label} className="rounded-2xl border-[1.5px] border-border bg-white p-6 text-center shadow-card dark:border-white/10 dark:bg-navy2">
              <div className="font-heading text-3xl font-black text-brand-blue sm:text-4xl">{s.value}</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Our Story + Experience */}
      <section className="mx-auto grid max-w-[1380px] gap-8 px-6 py-14 lg:grid-cols-2">
        <SectionCard title="Our Story">
          <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Meenakshi Build World is a trusted building-material destination in Bangalore, offering a
            comprehensive range of tiles, sanitary ware, steel, cement, plumbing products and kitchen solutions.
            Founded in 1996 by Mr. Anil Kumar A and Mr. Naresh Kumar A, the company has grown into an established
            name in the building materials industry.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            What began as a single showroom has grown with Bangalore itself — evolving alongside the homes,
            apartments and commercial spaces that define the city today.
          </p>
        </SectionCard>

        <SectionCard title="Our Experience">
          <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            With more than three decades in the trade, we understand what homeowners, builders, contractors,
            architects and interior designers need at every stage of a project — from selecting the right
            material to timely supply and dependable after-sales support.
          </p>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-slate-500 dark:text-slate-400">
            <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" /> Serving homeowners, builders, contractors, architects, interior designers and commercial projects</li>
            <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" /> Residential, commercial and large-scale construction project supplies</li>
            <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" /> Strong focus on quality products, expert assistance and customer satisfaction</li>
          </ul>
        </SectionCard>
      </section>

      {/* Our Products */}
      <section className="mx-auto max-w-[1380px] px-6 pb-14">
        <SectionCard title="Our Products">
          <p className="mb-5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            One-stop destination covering every major category of construction and building materials:
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {['Tiles', 'Sanitary Ware', 'Kitchen', 'Steel', 'Cement', 'Plumbing', 'Building Materials'].map(c => (
              <Link
                key={c}
                href={c === 'Tiles' ? '/all-tiles' : '/shop'}
                className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm font-bold text-ink transition hover:border-brand-blue hover:text-brand-blue dark:border-white/10 dark:text-white"
              >
                {c} <Icon.arrowRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </SectionCard>
      </section>

      {/* Why Choose Us */}
      <section className="bg-white py-14 dark:bg-navy2">
        <div className="mx-auto max-w-[1380px] px-6">
          <h2 className="text-center font-heading text-2xl font-extrabold uppercase tracking-wide text-ink dark:text-white">Why Choose Us</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {whyUs.map(w => (
              <div key={w.title} className="rounded-2xl border-[1.5px] border-border bg-brand-light p-5 transition hover:-translate-y-0.5 hover:shadow-card dark:border-white/10 dark:bg-navy">
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">{w.icon}</span>
                <h3 className="font-heading text-sm font-bold text-ink dark:text-white">{w.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brands + Customer Support */}
      <section className="mx-auto grid max-w-[1380px] gap-8 px-6 py-14 lg:grid-cols-2">
        <SectionCard title="Our Brands">
          <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            We partner with leading manufacturers across every category we serve. Browse the brands currently
            available on our marketplace.
          </p>
          <Link href="/brands" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-deep px-4 py-2.5 text-sm font-bold text-white shadow-glow">
            View Brands <Icon.arrowRight className="h-4 w-4" />
          </Link>
        </SectionCard>

        <SectionCard title="Customer Support">
          <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Questions about products, pricing or project quantities? Our team is here to help.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={telHref(business.primary_phone)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-deep px-4 py-2.5 text-sm font-bold text-white shadow-glow">
              <Icon.phoneCall className="h-4 w-4" /> {business.primary_phone}
            </a>
            <a
              href={waLink(business.whatsapp_number, waGreeting(business))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white transition hover:scale-105"
            >
              <Icon.whatsapp className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </SectionCard>
      </section>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="rounded-2xl border-[1.5px] border-border bg-white p-6 shadow-card dark:border-white/10 dark:bg-navy2 sm:p-8">
      <h2 className="mb-4 font-heading text-xl font-extrabold uppercase tracking-wide text-ink dark:text-white">{title}</h2>
      {children}
    </div>
  );
}
