// =====================================================================
//  Meenakshi Build World — JSON-driven mega menu data
//  Mirrors the MyTyles interaction pattern:
//   - Every nav item is a mega-menu trigger
//   - 6 columns: View All + Space / Size / Design / Type / Color / Latest
//   - The latest-products column is fetched live from the API so it always
//     shows fresh catalog data per category.
//  The server /api/v1/menu endpoints remain the source of truth for live
//  facet values; this file provides deterministic, branded hierarchy data
//  (used for instant rendering + mobile drawer) that the live values merge into.
// =====================================================================

export const ALL_PRODUCTS = 'all-products';

export const NAV_ITEMS = [
  { name: 'All Products', slug: ALL_PRODUCTS, url: '/shop', icon: 'grid' },
  { name: 'Floor Tiles', slug: 'floor-tiles', url: '/category/floor-tiles', icon: 'layout' },
  { name: 'Wall Tiles', slug: 'wall-tiles', url: '/category/wall-tiles', icon: 'brush' },
  { name: 'Bathroom', slug: 'bathroom', url: '/category/bathroom', icon: 'drop' },
  { name: 'Kitchen', slug: 'kitchen', url: '/category/kitchen', icon: 'restaurant' },
  { name: 'Outdoor', slug: 'outdoor', url: '/category/outdoor', icon: 'plant' },
  { name: 'Parking', slug: 'parking', url: '/category/parking', icon: 'parking' },
  { name: 'Elevation', slug: 'elevation', url: '/category/elevation', icon: 'building' },
  { name: 'Marble', slug: 'marble', url: '/category/marble', icon: 'gem' },
  { name: 'Granite', slug: 'granite', url: '/category/granite', icon: 'landscape' },
  { name: 'Sanitaryware', slug: 'sanitaryware', url: '/category/sanitaryware', icon: 'showers' },
  { name: 'Bath Fittings', slug: 'bath-fittings', url: '/category/bath-fittings', icon: 'fittings' },
  { name: 'Construction Materials', slug: 'construction-materials', url: '/category/construction-materials', icon: 'construction' }
];

// Column definitions. `noun` is the word slotted into the heading so the panel
// reads "Floor Tiles By Size" under Floor Tiles and "Tiles By Size" under
// All Products — the headings retitle with the active category.
export const COLUMN_DEFS = [
  { key: 'bySpace', title: 'By Space', icon: 'mapPin', param: 'area' },
  { key: 'bySize', title: 'By Size', icon: 'ruler', param: 'size' },
  { key: 'byDesign', title: 'By Design', icon: 'palette', param: 'pattern' },
  { key: 'byType', title: 'By Type', icon: 'stack', param: 'material' },
  { key: 'byColor', title: 'By Color', icon: 'contrast', param: 'color' }
];

// "Floor Tiles" + "By Size" → "Floor Tiles By Size".
// "All Products" is the catalog root, so it falls back to the generic noun.
export function columnHeading(categoryName, def) {
  const noun = !categoryName || categoryName === 'All Products' ? 'Tiles' : categoryName;
  return `${noun} ${def.title}`;
}

// Deterministic facet fallbacks per category — merged with the live API data.
// (These mirror the taxonomy the seeder populates, so the menu renders instantly
//  even before the /menu/:slug fetch resolves.)
const SIZES = [
  '300x300 mm', '300x600 mm', '400x400 mm', '400x600 mm', '600x600 mm',
  '600x900 mm', '600x1200 mm', '800x1600 mm', '800x2400 mm', '800x3000 mm',
  '1200x1800 mm', '200x1200 mm', '150x900 mm', '100x300 mm'
];

const DESIGNS = [
  'Wood', 'Marble', 'Stone', 'Concrete', 'Granite', 'Pattern',
  'Geometric', 'Mosaic', 'Designer', 'Floral', 'Modern', 'Classic',
  'Subway', 'Brick'
];

const TYPES = [
  'Ceramic', 'Porcelain', 'GVT', 'PGVT', 'Double Charge', 'Nano',
  'Full Body', 'Parking', 'Outdoor', 'Subway',
  'Full Body Vitrified 20mm', 'Vitrified Ceramic',
  'Natural Marble', 'Natural Granite'
];

const COLORS = [
  'White', 'Black', 'Grey', 'Beige', 'Brown', 'Blue', 'Green',
  'Ivory', 'Cream', 'Gold', 'Pink', 'Terracotta', 'Multi Blend'
];

const SPACES = [
  'Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Outdoor', 'Parking',
  'Balcony', 'Elevation', 'Terrace', 'Commercial', 'Industrial'
];

const SHARED = {
  bySize: SIZES,
  byDesign: DESIGNS,
  byType: TYPES,
  byColor: COLORS
};

export const MENU_CONTENT = {
  [ALL_PRODUCTS]: {
    name: 'All Products',
    url: '/shop',
    columns: {
      bySpace: SPACES,
      ...SHARED
    }
  },
  'floor-tiles': {
    name: 'Floor Tiles',
    url: '/category/floor-tiles',
    columns: { bySpace: ['Living Room', 'Bedroom', 'Dining Room', 'Hallway', 'Commercial Foyer', 'Office'], ...SHARED }
  },
  'wall-tiles': {
    name: 'Wall Tiles',
    url: '/category/wall-tiles',
    columns: { bySpace: ['Living Room Wall', 'Bathroom Wall', 'Kitchen Wall', 'Feature Wall', 'Lobby Wall', 'Bedroom Accent'], ...SHARED }
  },
  bathroom: {
    name: 'Bathroom',
    url: '/category/bathroom',
    columns: { bySpace: ['Bathroom Floor', 'Bathroom Wall', 'Wet Room', 'Powder Room', 'Shower Cubicle', 'Vanity Backsplash'], ...SHARED }
  },
  kitchen: {
    name: 'Kitchen',
    url: '/category/kitchen',
    columns: { bySpace: ['Kitchen Floor', 'Kitchen Backsplash', 'Kitchen Wall', 'Bar Counter', 'Utility Area', 'Breakfast Nook'], ...SHARED }
  },
  outdoor: {
    name: 'Outdoor',
    url: '/category/outdoor',
    columns: { bySpace: ['Garden Patio', 'Terrace', 'Balcony', 'Pool Deck', 'Walkway', 'Courtyard'], ...SHARED }
  },
  parking: {
    name: 'Parking',
    url: '/category/parking',
    columns: { bySpace: ['Parking', 'Driveway', 'Loading Bay', 'Ramp', 'Basement', 'Commercial Yard'], ...SHARED }
  },
  elevation: {
    name: 'Elevation',
    url: '/category/elevation',
    columns: { bySpace: ['Building Facade', 'Boundary Wall', 'Feature Wall', 'Exterior Cladding', 'Entrance Column', 'Balcony Exterior'], ...SHARED }
  },
  marble: {
    name: 'Marble',
    url: '/category/marble',
    columns: { bySpace: ['Living Room', 'Lobby', 'Staircase', 'Puja Room', 'Hotel Foyer', 'Master Bedroom'], ...SHARED }
  },
  granite: {
    name: 'Granite',
    url: '/category/granite',
    columns: { bySpace: ['Kitchen Countertop', 'Bar Counter', 'Vanity Top', 'Flooring', 'Staircase', 'Table Top'], ...SHARED }
  },
  sanitaryware: {
    name: 'Sanitaryware',
    url: '/category/sanitaryware',
    columns: { bySpace: ['Bathroom', 'Powder Room', 'Hotel Room', 'Commercial Washroom', 'Guest Washroom', 'Public Toilet'], ...SHARED }
  },
  'bath-fittings': {
    name: 'Bath Fittings',
    url: '/category/bath-fittings',
    columns: { bySpace: ['Bathroom', 'Master Suite', 'Hotel Bathroom', 'Guest Bathroom', 'Powder Room', 'Commercial Bathroom'], ...SHARED }
  },
  'construction-materials': {
    name: 'Construction Materials',
    url: '/category/construction-materials',
    columns: { bySpace: ['Foundation', 'Wall Construction', 'Flooring Base', 'Roofing', 'Landscaping', 'Site Work'], ...SHARED }
  }
};

// Optional: categories to display in the footer / shop filters that may not
// appear in the top nav.
export const EXTRA_CATEGORIES = [];

