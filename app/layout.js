import { AppProvider } from '@/lib/store';
import { BusinessProvider } from '@/lib/business';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FloatingActions from '@/components/layout/FloatingActions';
import { BUSINESS_DEFAULTS as B } from '@/lib/businessDefaults';
import './globals.css';

export const metadata = {
  title: 'Meenakshi Build World | Building Materials, Tiles, Sanitary Ware & More in Bangalore',
  description:
    'Meenakshi Build World is a trusted one-stop destination for building materials in Bangalore since 1996 — tiles, sanitary ware, steel, cement, plumbing, kitchen products and building materials for homes, contractors and commercial projects.',
  keywords:
    'building materials Bangalore, tiles Bangalore, sanitary ware, steel, cement, plumbing, kitchen products, Meenakshi Build World, vitrified tiles, ceramic tiles',
  metadataBase: new URL(B.website_url),
  openGraph: {
    title: 'Meenakshi Build World | Building Materials in Bangalore',
    description:
      'One-stop destination for tiles, sanitary ware, steel, cement, plumbing and kitchen solutions in Bangalore. Serving homeowners, builders and contractors since 1996.',
    url: B.website_url,
    siteName: B.business_name,
    locale: 'en_IN',
    type: 'website'
  }
};

const localBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: B.business_name,
  description:
    'Meenakshi Build World is a trusted building-material destination in Bangalore offering tiles, sanitary ware, steel, cement, plumbing products and kitchen solutions.',
  url: B.website_url,
  email: B.email,
  telephone: B.primary_phone,
  foundingDate: '1996',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Site #1 & #2, Opp. Puma Showroom, Byrathi Cross, Hennur Road',
    addressLocality: 'Bangalore',
    addressRegion: 'Karnataka',
    postalCode: '560077',
    addressCountry: 'IN'
  },
  areaServed: 'Bangalore, Karnataka, India',
  knowsAbout: ['Tiles', 'Sanitary Ware', 'Kitchen Products', 'Steel', 'Cement', 'Plumbing', 'Building Materials']
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-brand-light font-body text-ink antialiased dark:bg-navy dark:text-white">
        <AppProvider>
          <BusinessProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[5000] focus:rounded-lg focus:bg-brand-blue focus:px-4 focus:py-2 focus:font-bold focus:text-white"
            >
              Skip to main content
            </a>
            <Header />
            <main id="main" className="flex-1">{children}</main>
            <Footer />
            <FloatingActions />
          </BusinessProvider>
        </AppProvider>
      </body>
    </html>
  );
}
