// Meenakshi Build World — the mega menu, filters and category pages are 100%
// database-driven (see /api/v1/menu, /api/v1/menu/:slug, /api/v1/products/facets).
// This file only holds the "All Products" virtual-root sentinel used to talk to
// that API — there is no hardcoded taxonomy here.

export const ALL_PRODUCTS = 'all-products';

// "Floor Tiles" + "By Size" -> "Floor Tiles By Size". "All Products" is the
// catalog root, so it falls back to the generic noun "Tiles".
export function groupHeading(categoryName, label) {
    const noun = !categoryName || categoryName === 'All Products' ? 'Tiles' : categoryName;
    return `${noun} ${label}`;
}
