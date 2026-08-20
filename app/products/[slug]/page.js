import { redirect } from 'next/navigation';

// Product URL alias: /products/<slug> redirects to the canonical
// /product/<slug> so both link conventions work for shoppers and SEO.
export default function ProductsAlias({ params }) {
  redirect(`/product/${params.slug}`);
}