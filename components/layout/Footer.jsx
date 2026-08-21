'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icons';

export default function Footer() {
  const router = useRouter();
  const go = (url) => router.push(url);

  return (
    <footer className="mt-auto bg-ink text-white">
      <div className="mx-auto max-w-[1380px] px-6 py-16">
        <div className="mb-14 grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4 inline-flex items-center rounded-xl bg-white px-3 py-1.5">
              <img src="/images/logo.png" alt="Meenakshi Build World" className="h-11 w-auto" />
            </div>
            <p className="text-sm text-slate-400">
              India’s leading database-driven enterprise marketplace for architectural ceramic tiles, Italian marble vitrified slabs, and outdoor paver systems.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-sm font-bold text-brand-blue">Shop Categories</h4>
            <ul className="flex flex-col gap-2.5 text-sm text-slate-400">
              <li><button onClick={() => go('/floor-tiles')} className="transition hover:text-brand-blue">Floor Tiles</button></li>
              <li><button onClick={() => go('/wall-tiles')} className="transition hover:text-brand-blue">Wall Tiles</button></li>
              <li><button onClick={() => go('/floor-tiles/marble')} className="transition hover:text-brand-blue">Marble Floor Tiles</button></li>
              <li><button onClick={() => go('/floor-tiles/outdoor')} className="transition hover:text-brand-blue">Outdoor Floor Tiles</button></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-sm font-bold text-brand-blue">Interactive Tools</h4>
            <ul className="flex flex-col gap-2.5 text-sm text-slate-400">
              <li><button onClick={() => go('/visualizer')} className="transition hover:text-brand-blue">3D Room Visualizer</button></li>
              <li><button onClick={() => go('/calculator')} className="transition hover:text-brand-blue">Tile & Box Calculator</button></li>
              <li><button onClick={() => go('/compare')} className="transition hover:text-brand-blue">Product Comparison</button></li>
              <li><button onClick={() => go('/architect-zone')} className="transition hover:text-brand-blue">Architect Commercial RFQ</button></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-sm font-bold text-brand-blue">Portals</h4>
            <ul className="flex flex-col gap-2.5 text-sm text-slate-400">
              <li><button onClick={() => go('/customer-dash')} className="transition hover:text-brand-blue">Customer Orders</button></li>
              <li><button onClick={() => go('/dealer-dash')} className="transition hover:text-brand-blue">B2B Dealer Credit Portal</button></li>
              <li><button onClick={() => go('/admin')} className="transition hover:text-brand-blue">Master Admin CMS</button></li>
              <li><Link href="/sitemap.xml" target="_blank" className="transition hover:text-brand-blue">Dynamic XML Sitemap</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-slate-500 md:flex-row">
          <span>© 2026 Meenakshi Build World. All Rights Reserved.</span>
          <a
            href="https://wa.me/919876543210?text=Hi%20Meenakshi%20Build%20World%20Sales%20Team%2C%20I%20am%20looking%20for%20a%20quotation%20on%20vitrified%20tiles."
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-bold text-white transition hover:scale-105"
          >
            <Icon.whatsapp className="h-4 w-4" /> WhatsApp Support
          </a>
        </div>
      </div>
    </footer>
  );
}
