import { AppProvider } from '@/lib/store';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FloatingActions from '@/components/layout/FloatingActions';
import './globals.css';

export const metadata = {
  title: 'Meenakshi Build World | Enterprise Building Materials Marketplace',
  description: "India's Premier Enterprise Tile Marketplace featuring Italian Statuario Marble Slabs, Vitrified Slabs, Outdoor Anti-skid pavers, Wood Porcelain planks, 3D Room Visualizer, and Tile Box Calculator.",
  keywords: 'tiles, vitrified slabs, porcelain tiles, Italian marble, floor tiles, wall tiles'
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
      </head>
      <body className="flex min-h-screen flex-col bg-brand-light font-body text-ink antialiased dark:bg-navy dark:text-white">
        <AppProvider>
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
        </AppProvider>
      </body>
    </html>
  );
}

