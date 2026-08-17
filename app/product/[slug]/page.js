import { Suspense } from 'react';
import ProductDetailClient from '@/components/shop/ProductDetailClient';

const API_BASE = process.env.API_PROXY_TARGET || 'http://localhost:3000';

async function fetchProduct(slug) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/products/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const data = await fetchProduct(params.slug);
  if (!data) return {};
  const { product, images } = data;
  const image = images?.[0]?.image_url;
  return {
    title: product.seo_title || `${product.name} | Meenakshi Build World`,
    description: product.seo_description || product.description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: image ? { images: [image] } : undefined
  };
}

export default async function ProductDetailPage({ params }) {
  const data = await fetchProduct(params.slug);
  const jsonLd = data ? buildProductSchema(data) : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Suspense fallback={<div className="mx-auto max-w-[1380px] px-6 py-16 text-center text-slate-400">Loading product…</div>}>
        <ProductDetailClient slug={params.slug} />
      </Suspense>
    </>
  );
}

function buildProductSchema({ product, images }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    description: product.description,
    image: (images || []).map(i => i.image_url),
    brand: product.brand_name ? { '@type': 'Brand', name: product.brand_name } : undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.offer_price || product.price,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://www.meenakshibuildworld.com/product/${product.slug}`
    },
    aggregateRating: product.reviews_count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating_avg,
      reviewCount: product.reviews_count
    } : undefined
  };
}
