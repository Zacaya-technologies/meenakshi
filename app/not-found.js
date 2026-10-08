import Link from 'next/link';

export const metadata = { title: 'Page not found | Meenakshi Build World', robots: { index: false } };

// Branded 404 with routes back into the catalogue (replaces Next's bare default).
export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-[1380px] flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <span className="font-heading text-7xl font-black text-brand-blue/20 sm:text-8xl">404</span>
      <h1 className="mt-2 font-heading text-2xl font-extrabold text-ink dark:text-white sm:text-3xl">We couldn&apos;t find that page</h1>
      <p className="mt-3 max-w-md text-sm text-slate-500 dark:text-slate-400">
        The link may be old or the product may have moved. Browse the catalogue or get in touch and we&apos;ll help you find it.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="rounded-xl bg-gradient-to-r from-brand-blue to-brand-deep px-6 py-3 text-sm font-bold text-white shadow-glow">
          Browse All Tiles
        </Link>
        <Link href="/" className="rounded-xl border-[1.5px] border-brand-blue px-6 py-3 text-sm font-bold text-brand-blue transition hover:bg-brand-blue/5">
          Go to Home
        </Link>
        <Link href="/contact" className="rounded-xl border-[1.5px] border-border px-6 py-3 text-sm font-bold text-slate-600 transition hover:border-brand-blue hover:text-brand-blue dark:border-white/10 dark:text-slate-300">
          Contact Us
        </Link>
      </div>
    </section>
  );
}
