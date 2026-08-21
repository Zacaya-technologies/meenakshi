'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icons';
import { useBusiness, telHref, waLink, waGreeting } from '@/lib/business';

export default function Footer() {
  const router = useRouter();
  const go = (url) => router.push(url);
  const business = useBusiness();

  const quickLinks = [
    { label: 'Home', url: '/' },
    { label: 'About Us', url: '/about' },
    { label: 'Categories', url: '/all-tiles' },
    { label: 'Products', url: '/products' },
    { label: 'Shop', url: '/shop' },
    { label: 'Brands', url: '/brands' },
    { label: 'Contact Us', url: '/contact' }
  ];

  const productLinks = [
    { label: 'Tiles', url: '/all-tiles' },
    { label: 'Sanitary Ware', url: '/shop' },
    { label: 'Kitchen', url: '/shop' },
    { label: 'Steel', url: '/shop' },
    { label: 'Cement', url: '/shop' },
    { label: 'Plumbing', url: '/shop' }
  ];

  const phones = [business.primary_phone, business.secondary_phone, business.additional_phone].filter(Boolean);

  const socialLinks = [
    { url: business.facebook_url, label: 'Facebook', Icon: Icon.facebook },
    { url: business.instagram_url, label: 'Instagram', Icon: Icon.instagram },
    { url: business.twitter_url, label: 'X (Twitter)', Icon: Icon.twitter },
    { url: business.linkedin_url, label: 'LinkedIn', Icon: Icon.linkedin },
    { url: business.youtube_url, label: 'YouTube', Icon: Icon.youtube }
  ].filter(s => s.url);

  return (
    <footer className="mt-auto bg-ink text-white">
      <div className="mx-auto max-w-[1380px] px-6 py-16">
        <div className="mb-14 grid grid-cols-2 gap-10 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4 inline-flex items-center rounded-xl bg-white px-3 py-1.5">
              <img src={business.logo || '/images/logo.png'} alt={business.business_name} className="h-11 w-auto" />
            </div>
            <p className="text-sm text-slate-400">
              One-stop destination for quality building materials, tiles, sanitary ware, steel, cement,
              plumbing and kitchen solutions in Bangalore.
            </p>
            <p className="mt-4 flex items-center gap-2 text-sm text-slate-400">
              <Icon.phoneCall className="h-4 w-4 shrink-0 text-brand-blue" /> {business.business_hours}
            </p>

            {socialLinks.length > 0 && (
              <div className="mt-5 flex items-center gap-2.5">
                {socialLinks.map(({ url, label, Icon: SocialIcon }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-brand-blue hover:text-white"
                  >
                    <SocialIcon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="mb-4 font-heading text-sm font-bold text-brand-blue">Quick Links</h4>
            <ul className="flex flex-col gap-2.5 text-sm text-slate-400">
              {quickLinks.map(l => (
                <li key={l.label}>
                  <button onClick={() => go(l.url)} className="transition hover:text-brand-blue">{l.label}</button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-sm font-bold text-brand-blue">Products</h4>
            <ul className="flex flex-col gap-2.5 text-sm text-slate-400">
              {productLinks.map(l => (
                <li key={l.label}>
                  <button onClick={() => go(l.url)} className="transition hover:text-brand-blue">{l.label}</button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-sm font-bold text-brand-blue">Contact</h4>
            <ul className="flex flex-col gap-2.5 text-sm text-slate-400">
              {phones.map(p => (
                <li key={p}>
                  <a href={telHref(p)} className="flex items-center gap-2 transition hover:text-brand-blue">
                    <Icon.phone className="h-3.5 w-3.5 shrink-0 text-brand-blue" /> {p}
                  </a>
                </li>
              ))}
              <li>
                <a href={`mailto:${business.email}`} className="flex items-center gap-2 break-all transition hover:text-brand-blue">
                  <Icon.mail className="h-3.5 w-3.5 shrink-0 text-brand-blue" /> {business.email}
                </a>
              </li>
              <li>
                <a
                  href={waLink(business.whatsapp_number, waGreeting(business))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition hover:text-brand-blue"
                >
                  <Icon.whatsapp className="h-3.5 w-3.5 shrink-0 text-[#25D366]" /> WhatsApp us
                </a>
              </li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1">
            <h4 className="mb-4 font-heading text-sm font-bold text-brand-blue">Corporate Office</h4>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-400">{business.corporate_address}</p>
            <h4 className="mb-4 mt-6 font-heading text-sm font-bold text-brand-blue">Store</h4>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-400">{business.store_address}</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-slate-500 md:flex-row">
          <span>{business.copyright_text}</span>
          <a
            href={waLink(
              business.whatsapp_number,
              `Hi ${business.business_name}, I am looking for a quotation on building materials.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-bold text-white transition hover:scale-105"
          >
            <Icon.whatsapp className="h-4 w-4" /> WhatsApp Support
          </a>
        </div>
      </div>
    </footer>
  );
}
