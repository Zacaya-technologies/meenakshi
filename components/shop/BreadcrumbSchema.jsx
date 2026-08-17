// Renders a BreadcrumbList JSON-LD block from the same breadcrumb array the
// visible <nav> uses, so category/product pages carry structured breadcrumb
// data for search engines without a second source of truth.
export default function BreadcrumbSchema({ breadcrumb, siteUrl = 'https://www.meenakshibuildworld.com' }) {
  if (!breadcrumb?.length) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumb.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: `${siteUrl}${crumb.url}`
    }))
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
