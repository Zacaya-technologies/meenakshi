import { redirect } from 'next/navigation';

// Product URL alias: /products/<slug> redirects to the canonical
// /product/<slug> so both link conventions work for shoppers and SEO.
export default async function ProductsAlias({ params }) {
  const { slug } = await params;
  redirect(`/product/${slug}`);
}