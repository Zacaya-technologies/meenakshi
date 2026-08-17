import { redirect } from 'next/navigation';

// Legacy URL shape (/category/floor-tiles) permanently redirects to the clean
// taxonomy route (/floor-tiles) introduced with the dynamic catalog rebuild.
export default function LegacyCategoryRedirect({ params }) {
  redirect(`/${params.slug}`);
}
