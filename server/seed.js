const bcrypt = require('bcryptjs');
const db = require('./db');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/&/g, ' and ')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Size values are written as "600x1200 mm" in the taxonomy but the requested
// URL scheme is /floor-tiles/600x1200 (no unit suffix in the slug).
function slugifySize(value) {
    return slugify(value.replace(/\s*mm\b/gi, '').trim());
}

const TILE_IMAGES = [
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1615529162924-f8605388461d?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1571508601891-ca5e7a713859?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1000&q=80'
];
function pickImage(i) { return TILE_IMAGES[i % TILE_IMAGES.length]; }

// ---------------------------------------------------------------------------
// Taxonomy — transcribed from the Meenakshi Build World category spec. Values
// are grouped under facet dimensions (category_groups) for each main category
// (Floor Tiles, Wall Tiles, Kitchen Tiles, Bathroom Tiles). Floor/Wall use an
// "area" group (bare room names, e.g. "Bathroom"); Kitchen/Bathroom use an
// "application" group instead (already-composed names, e.g. "Shower Area
// Tiles") — both are just category_groups rows, so adding a 5th main category
// with yet another grouping shape requires zero further code changes.
// ---------------------------------------------------------------------------

const GROUPS = [
    { key: 'area', name: 'By Area', icon: 'mapPin' },
    { key: 'application', name: 'By Application', icon: 'mapPin' },
    { key: 'size', name: 'By Size', icon: 'ruler' },
    { key: 'design', name: 'By Design', icon: 'palette' },
    { key: 'type', name: 'By Type', icon: 'stack' },
    { key: 'finish', name: 'By Finish', icon: 'brush' },
    { key: 'color', name: 'By Color', icon: 'contrast' }
];

// Strips a trailing "<Main> Tiles" / "Tiles" suffix off an already-composed
// taxonomy value (e.g. "Marble Kitchen Tiles" -> "Marble") so the bare word
// renders in filter chips / menu columns — the composed form is kept for SEO.
function bareValue(value, shortName) {
    return value
        .replace(new RegExp(`\\s+${shortName}\\s+Tiles$`, 'i'), '')
        .replace(/\s+Tiles$/i, '')
        .trim();
}

const FLOOR_COLOR = [
    'White', 'Black', 'Brown', 'Beige', 'Ivory', 'Cream', 'Yellow', 'Blue', 'Green', 'Grey',
    'Pink', 'Red', 'Aqua', 'Orange', 'Sky Blue', 'Gold', 'Purple', 'Terracotta',
    'Black & White', 'Blue & White', 'Grey & White', 'Black & Gold', 'White & Gold'
];

const TAXONOMY = {
    'floor-tiles': {
        name: 'Floor Tiles',
        icon: 'layout',
        image: TILE_IMAGES[0],
        category_type: 'tile',
        featured: true,
        description: 'Durable, elegant floor tiles engineered for every room and outdoor space — vitrified, ceramic, porcelain and natural-look finishes.',
        valueMode: { area: 'suffix', size: 'bare', design: 'bare', type: 'bare', finish: 'bare', color: 'bare' },
        groups: {
            area: [
                'Bathroom', 'Kitchen', 'Living Room', 'Outdoor', 'Parking', 'Bedroom', 'Terrace', 'Balcony',
                'Hallway', 'Porch', 'Drawing Room', 'Pooja Room', 'Dining Room', 'Garden', 'Pathway',
                'Commercial', 'Swimming Pool', 'Hospital', 'School', 'Restaurant', 'Bar',
                'Patio', 'Garage', 'Office', 'Hotel', 'Industrial'
            ],
            size: [
                '1x1', '2x2', '2x4', '4x4', '4x8',
                '100x200 mm', '100x300 mm', '150x900 mm', '200x200 mm', '200x1200 mm',
                '300x300 mm', '300x450 mm', '300x600 mm', '300x900 mm', '300x1200 mm',
                '400x400 mm', '400x1200 mm', '500x500 mm', '600x600 mm', '600x1200 mm',
                '800x1600 mm', '800x2400 mm', '800x3000 mm', '1200x1800 mm', '150x150 mm'
            ],
            design: [
                '3D', 'Wooden', 'Marble', 'Texture', 'Mosaic', 'Granite', 'Stone', 'Pattern', 'Geometric',
                'Cement', 'Floral', 'Travertine', 'Slate', 'Statuario', 'Plain', 'Onyx', 'End Match',
                'Book Match', 'Carrara', 'Abstract', 'Monochrome', 'Stylized', 'Brick', 'Hexagon',
                'Limestone', 'Wooden Plank', 'Athangudi', 'Moroccan', 'Subway', 'Kitkat', 'Chevron',
                'Octagon', 'Border', 'Fluted', 'Terrazzo', 'Tropical', 'Carpet Design', 'Poster', 'Herringbone',
                'Kota Design', 'Blue Pottery Design', 'Terracotta', 'Concrete'
            ],
            type: [
                'Vitrified', 'Ceramic', 'Porcelain', 'Designer', 'Digital', 'Double Charge Vitrified',
                'Glazed', 'Cool', 'Glass Highlighter', 'Full Body Vitrified', 'Printed', 'Nano'
            ],
            finish: [
                'Anti Skid', 'Glossy', 'Polished', 'Matt', 'Carving', 'Metallic', 'Rustic', 'Lappato',
                'Satin', 'Hi-Gloss', 'High Gloss'
            ],
            color: FLOOR_COLOR
        }
    },
    'wall-tiles': {
        name: 'Wall Tiles',
        icon: 'brush',
        image: TILE_IMAGES[1],
        category_type: 'tile',
        featured: true,
        description: 'Feature-ready wall tiles for bathrooms, kitchens, elevations and commercial interiors — glossy, matte and highlighter finishes.',
        valueMode: { area: 'suffix', size: 'bare', design: 'bare', type: 'bare', finish: 'bare', color: 'bare' },
        groups: {
            area: [
                'Bathroom', 'Kitchen', 'Living Room', 'Bedroom', 'Balcony', 'Pooja Room', 'Outdoor',
                'Elevation', 'TV Unit', 'Dining Room', 'Commercial', 'Restaurant', 'Hotel', 'Office',
                'Terrace', 'Exterior', 'Interior', 'Feature Wall Tiles', 'Accent Wall Tiles',
                'Staircase', 'Hospital', 'School', 'Reception', 'Lobby'
            ],
            size: [
                '75x300 mm', '100x100 mm', '100x200 mm', '100x300 mm', '150x150 mm', '200x200 mm',
                '300x300 mm', '300x450 mm', '300x600 mm', '600x600 mm', '600x1200 mm', '1200x1800 mm',
                '75x200 mm', '150x250 mm', '200x300 mm', '200x600 mm', '300x900 mm', '300x1200 mm', '400x400 mm'
            ],
            design: [
                '3D', 'Brick', 'Marble', 'Mosaic', 'Stone', 'Texture', 'Wooden', 'Subway', 'Moroccan',
                'Digital', 'Geometric', 'Poster', 'Floral', 'Abstract', 'Hexagon', 'Kitkat', 'Chevron',
                'Terrazzo', 'Tropical', 'Metallic', 'Highlighter',
                'Pattern', 'Plain', 'Octagon', 'Herringbone', 'Travertine', 'Slate', 'Concrete',
                'Cement', 'Fluted', 'Onyx', 'Book Match', 'Carrara', 'Statuario',
                'Stone Effect', 'Marble Effect', 'Wood Effect'
            ],
            type: [
                'Ceramic', 'Vitrified', 'Porcelain', 'Designer', 'Digital', 'Glazed', 'Printed',
                'Glass Highlighter', 'Full Body Vitrified', 'Double Charge Vitrified', 'Nano'
            ],
            finish: ['Glossy', 'Matt', 'Metallic', 'Satin Matt', 'Rustic', 'High Gloss', 'Carving', 'Lappato', 'Polished', 'Sugar Finish'],
            color: FLOOR_COLOR
        }
    },
    'kitchen-tiles': {
        name: 'Kitchen Tiles',
        icon: 'restaurant',
        image: TILE_IMAGES[2],
        shortName: 'Kitchen',
        category_type: 'tile',
        featured: true,
        description: 'Backsplash-ready kitchen tiles — stove, sink and countertop zones covered in stain-resistant ceramic, vitrified and highlighter finishes.',
        valueMode: { application: 'literal', area: 'literal', size: 'bare', design: 'composed', type: 'composed', finish: 'composed', color: 'composed' },
        groups: {
            application: [
                'Kitchen Backsplash Tiles', 'Stove Area Tiles',
                'Sink Area Tiles', 'Countertop Wall Tiles', 'Chimney Area Tiles', 'Breakfast Counter Tiles',
                'Pantry Area Tiles', 'Kitchen Feature Wall Tiles', 'Kitchen Accent Wall Tiles',
                'Kitchen Cabinet Backsplash Tiles', 'Kitchen Wash Area Tiles'
            ],
            area: ['Kitchen Floor Tiles', 'Kitchen Wall Tiles'],
            size: [
                '1x1', '2x2', '2x4',
                '75x200 mm', '75x300 mm', '100x100 mm', '100x200 mm', '100x300 mm', '150x150 mm',
                '150x250 mm', '200x200 mm', '300x300 mm', '300x450 mm', '300x600 mm', '600x600 mm', '600x1200 mm'
            ],
            design: [
                'Marble Kitchen Tiles', 'Wooden Kitchen Tiles', 'Stone Kitchen Tiles', '3D Kitchen Tiles',
                'Texture Kitchen Tiles', 'Mosaic Kitchen Tiles', 'Subway Kitchen Tiles', 'Moroccan Kitchen Tiles',
                'Geometric Kitchen Tiles', 'Flower Kitchen Tiles', 'Pattern Kitchen Tiles', 'Abstract Kitchen Tiles',
                'Plain Kitchen Tiles', 'Brick Kitchen Tiles', 'Hexagonal Kitchen Tiles', 'Kitkat Kitchen Tiles',
                'Chevron Kitchen Tiles', 'Herringbone Kitchen Tiles', 'Terrazzo Kitchen Tiles', 'Travertine Kitchen Tiles',
                'Slate Kitchen Tiles', 'Concrete Kitchen Tiles', 'Cement Kitchen Tiles', 'Fluted Kitchen Tiles',
                'Highlighter Kitchen Tiles', 'Digital Kitchen Tiles', 'Poster Kitchen Tiles', 'Monochrome Kitchen Tiles',
                'Two-Tone Kitchen Tiles', 'Wood Plank Kitchen Tiles', 'Stone Effect Kitchen Tiles', 'Marble Effect Kitchen Tiles',
                'Granite Kitchen Tiles', 'Cup n Saucer Kitchen Tiles', 'Border Kitchen Tiles', 'Carpet Kitchen Tiles'
            ],
            type: [
                'Ceramic Kitchen Tiles', 'Vitrified Kitchen Tiles', 'Porcelain Kitchen Tiles', 'Glass Highlighter Tiles',
                'Marble Stone Kitchen Tiles', 'Designer Kitchen Tiles', 'Digital Kitchen Tiles', 'Glazed Kitchen Tiles',
                'Printed Kitchen Tiles', 'Full Body Vitrified Kitchen Tiles', 'Double Charge Vitrified Kitchen Tiles',
                'Nano Vitrified Kitchen Tiles'
            ],
            finish: [
                'Glossy Kitchen Tiles', 'Matt Kitchen Tiles', 'High Gloss Kitchen Tiles', 'Metallic Kitchen Tiles',
                'Satin Kitchen Tiles', 'Carving Kitchen Tiles', 'Sugar Finish Kitchen Tiles', 'Rustic Kitchen Tiles',
                'Polished Kitchen Tiles', 'Lappato Kitchen Tiles', 'Anti Skid Kitchen Tiles'
            ],
            color: FLOOR_COLOR.map(c => `${c} Kitchen Tiles`)
        }
    },
    'kitchen-countertops': {
        name: 'Kitchen Countertops',
        icon: 'grid',
        image: TILE_IMAGES[3],
        shortName: 'Countertop',
        category_type: 'utility',
        featured: true,
        description: 'Premium kitchen countertops — quartz, granite, breakfast and engineered stone surfaces for modern kitchens.',
        valueMode: { type: 'literal', color: 'bare', finish: 'bare', size: 'bare' },
        groups: {
            type: ['Kitchen Countertops', 'Quartz Countertops', 'Breakfast Countertops', 'Granite Countertops'],
            color: FLOOR_COLOR,
            finish: ['Glossy', 'Matt', 'Polished', 'High Gloss', 'Honed', 'Rustic', 'Anti Skid', 'Satin'],
            size: [
                '600x600 mm', '600x1200 mm', '800x1600 mm', '800x2400 mm', '1200x2400 mm',
                '1200x3000 mm', '1600x3200 mm', '2000x2400 mm'
            ]
        }
    },
    'bathroom-tiles': {
        name: 'Bathroom Tiles',
        icon: 'drop',
        image: TILE_IMAGES[3],
        shortName: 'Bathroom',
        category_type: 'tile',
        featured: true,
        description: 'Wet-area engineered bathroom tiles — anti-skid flooring, shower walls and vanity backsplashes in moisture-resistant ceramic and vitrified finishes.',
        valueMode: { application: 'literal', size: 'bare', design: 'composed', type: 'composed', finish: 'composed', color: 'composed' },
        groups: {
            application: [
                'Bathroom Floor Tiles', 'Bathroom Wall Tiles', 'Shower Area Tiles', 'Shower Floor Tiles',
                'Wash Basin Area Tiles', 'Vanity Area Tiles', 'Bathroom Backsplash Tiles', 'Bathtub Area Tiles',
                'Toilet Area Tiles', 'Wet Area Tiles', 'Dry Area Bathroom Tiles', 'Feature Wall Bathroom Tiles',
                'Full Wall Bathroom Tiles', 'Partial Wall Bathroom Tiles', 'Accent Wall Bathroom Tiles'
            ],
            size: [
                '150x150 mm', '200x200 mm', '300x300 mm', '300x450 mm', '300x600 mm', '300x900 mm',
                '300x1200 mm', '400x400 mm', '400x1200 mm', '500x500 mm', '600x600 mm', '600x1200 mm',
                '800x1600 mm', '800x3000 mm', '1200x1800 mm'
            ],
            design: [
                'Marble Bathroom Tiles', 'Wooden Bathroom Tiles', 'Stone Bathroom Tiles', '3D Bathroom Tiles',
                'Texture Bathroom Tiles', 'Mosaic Bathroom Tiles', 'Moroccan Bathroom Tiles', 'Subway Bathroom Tiles',
                'Geometric Bathroom Tiles', 'Floral Bathroom Tiles', 'Pattern Bathroom Tiles', 'Abstract Bathroom Tiles',
                'Plain Bathroom Tiles', 'Brick Bathroom Tiles', 'Hexagon Bathroom Tiles', 'Octagon Bathroom Tiles',
                'Kitkat Bathroom Tiles', 'Chevron Bathroom Tiles', 'Herringbone Bathroom Tiles', 'Terrazzo Bathroom Tiles',
                'Travertine Bathroom Tiles', 'Slate Bathroom Tiles', 'Concrete Bathroom Tiles', 'Cement Bathroom Tiles',
                'Fluted Bathroom Tiles', 'Highlighter Bathroom Tiles', 'Digital Bathroom Tiles', 'Poster Bathroom Tiles',
                'Tropical Bathroom Tiles', 'Onyx Bathroom Tiles', 'Bookmatch Bathroom Tiles', 'Carving Design Bathroom Tiles',
                'Honeycomb Bathroom Tiles'
            ],
            type: [
                'Ceramic Bathroom Tiles', 'Vitrified Bathroom Tiles', 'Porcelain Bathroom Tiles', 'Designer Bathroom Tiles',
                'Digital Bathroom Tiles', 'Glazed Bathroom Tiles', 'Printed Bathroom Tiles', 'Glass Highlighter Tiles',
                'Full Body Vitrified Bathroom Tiles', 'Double Charge Vitrified Bathroom Tiles', 'Nano Vitrified Bathroom Tiles',
                'Marble Stone Bathroom Tiles'
            ],
            finish: [
                'Matt Bathroom Tiles', 'Glossy Bathroom Tiles', 'High Gloss Bathroom Tiles', 'Carving Bathroom Tiles',
                'Rustic Bathroom Tiles', 'Satin Bathroom Tiles', 'Lappato Bathroom Tiles', 'Sugar Finish Bathroom Tiles',
                'Metallic Bathroom Tiles', 'Polished Bathroom Tiles', 'Anti-Skid Bathroom Tiles'
            ],
            color: FLOOR_COLOR.map(c => `${c} Bathroom Tiles`)
        }
    },
    'living-room-tiles': {
        name: 'Living Room Tiles',
        icon: 'layout',
        image: TILE_IMAGES[4],
        shortName: 'Living Room',
        category_type: 'tile',
        featured: true,
        description: 'Statement floor and accent-wall tiles for living rooms — large-format marble, wood-look and designer finishes.',
        valueMode: { area: 'suffix', application: 'literal', size: 'bare', design: 'composed', type: 'composed', finish: 'composed', color: 'composed' },
        groups: {
            area: ['Living Room Floor Tiles', 'Living Room Wall Tiles'],
            application: ['TV Unit Tiles', 'Feature Wall Tiles', 'Accent Wall Tiles'],
            size: [
                '300x300 mm', '300x600 mm', '600x600 mm', '600x1200 mm', '800x1600 mm', '1200x1800 mm',
                '2x2', '2x4', '800x800 mm', '800x2400 mm', '800x3000 mm'
            ],
            design: [
                'Marble Living Room Tiles', 'Wooden Living Room Tiles', 'Stone Living Room Tiles', '3D Living Room Tiles',
                'Designer Living Room Tiles', 'Mosaic Living Room Tiles', 'Large Format Living Room Tiles',
                'Carpet Living Room Tiles', 'Granite Living Room Tiles', 'Texture Living Room Tiles', 'Brick Living Room Tiles',
                'Moroccan Living Room Tiles', 'Athangudi Living Room Tiles', 'Fluted Living Room Tiles',
                'Terrazzo Living Room Tiles', 'Book Match Living Room Tiles', 'End Match Living Room Tiles',
                'Statuario Living Room Tiles', 'White Brick Living Room Tiles', '3D Pooja Room Living Room Tiles',
                '3D Bedroom Living Room Tiles', 'Wooden Bedroom Living Room Tiles'
            ],
            type: [
                'Ceramic Living Room Tiles', 'Vitrified Living Room Tiles', 'Porcelain Living Room Tiles',
                'Digital Living Room Tiles', 'Full Body Vitrified Living Room Tiles',
                'Glass Highlighter Living Room Tiles', 'Printed Living Room Tiles', 'Designer Living Room Tiles',
                'Glazed Vitrified Living Room Tiles', 'Double Charge Vitrified Living Room Tiles'
            ],
            finish: ['Glossy Living Room Tiles', 'Matt Living Room Tiles', 'Polished Living Room Tiles', 'Rustic Living Room Tiles', 'Satin Living Room Tiles', 'Anti Skid Living Room Tiles'],
            color: [...FLOOR_COLOR.map(c => `${c} Living Room Tiles`), 'White Bedroom Living Room Tiles', 'Blue Bedroom Living Room Tiles']
        }
    },
    'bedroom-tiles': {
        name: 'Bedroom Tiles',
        icon: 'layout',
        image: TILE_IMAGES[4],
        shortName: 'Bedroom',
        parentMain: 'living-room-tiles',
        category_type: 'tile',
        featured: true,
        description: 'Premium bedroom tiles — wood-look, marble and 3D designer finishes for a restful, luxurious bedroom floor.',
        valueMode: { area: 'suffix', size: 'bare', design: 'literal', type: 'literal', finish: 'literal', color: 'literal' },
        groups: {
            area: ['Bedroom Floor Tiles', 'Bedroom Wall Tiles'],
            size: ['2x2', '2x4', '800x800 mm', '800x1600 mm', '1200x1800 mm', '800x2400 mm', '800x3000 mm'],
            design: [
                '3D', 'Wooden', 'Marble', 'Carpet', 'Granite', 'Mosaic', 'Texture', 'Stone',
                'Brick', 'Moroccan', 'Athangudi', 'Fluted', 'Terrazzo', 'Book Match', 'End Match', 'Statuario',
                'White Brick', '3D Bedroom', 'Wooden Bedroom'
            ],
            type: [
                'Ceramic', 'Vitrified', 'Glass Highlighter', 'Printed', 'Designer', 'Digital', 'Porcelain',
                'Glazed Vitrified', 'Double Charge Vitrified', 'Full Body Vitrified'
            ],
            finish: ['Anti Skid', 'Glossy', 'Matt', 'Rustic', 'Polished'],
            color: [
                'White', 'Black', 'Grey', 'Brown', 'Beige', 'Ivory', 'Cream', 'Yellow', 'Blue', 'Green',
                'Pink', 'Orange', 'Purple', 'Black & White', 'Grey & White', 'White Bedroom', 'Blue Bedroom'
            ]
        }
    },
    'hallway-tiles': {
        name: 'Hallway Tiles',
        icon: 'layout',
        image: TILE_IMAGES[4],
        shortName: 'Hallway',
        parentMain: 'living-room-tiles',
        category_type: 'tile',
        featured: true,
        description: 'Hallway tiles designed to make a first impression — durable, easy-clean finishes for corridors and entryways.',
        valueMode: { area: 'suffix', size: 'bare', design: 'literal', type: 'literal', finish: 'literal', color: 'literal' },
        groups: {
            area: ['Hallway Floor Tiles', 'Hallway Wall Tiles'],
            size: ['2x2', '2x4', '800x800 mm', '800x1600 mm', '1200x1800 mm', '800x2400 mm', '800x3000 mm'],
            design: [
                '3D', 'Wooden', 'Marble', 'Carpet', 'Granite', 'Mosaic', 'Texture', 'Stone',
                'Brick', 'Moroccan', 'Athangudi', 'Fluted', 'Terrazzo', 'Book Match', 'End Match', 'Statuario',
                'White Brick'
            ],
            type: [
                'Ceramic', 'Vitrified', 'Glass Highlighter', 'Printed', 'Designer', 'Digital', 'Porcelain',
                'Glazed Vitrified', 'Double Charge Vitrified', 'Full Body Vitrified'
            ],
            finish: ['Anti Skid', 'Glossy', 'Matt', 'Rustic', 'Polished'],
            color: [
                'White', 'Black', 'Grey', 'Brown', 'Beige', 'Ivory', 'Cream', 'Yellow', 'Blue', 'Green',
                'Pink', 'Orange', 'Purple', 'Black & White', 'Grey & White'
            ]
        }
    },
    'pooja-room-tiles': {
        name: 'Pooja Room Tiles',
        icon: 'layout',
        image: TILE_IMAGES[4],
        shortName: 'Pooja Room',
        parentMain: 'living-room-tiles',
        category_type: 'tile',
        featured: true,
        description: 'Sacred, serene tiles for pooja rooms — marble, 3D and golden-toned finishes that elevate the prayer space.',
        valueMode: { area: 'suffix', size: 'bare', design: 'literal', type: 'literal', finish: 'literal', color: 'literal' },
        groups: {
            area: ['Pooja Room Floor Tiles', 'Pooja Room Wall Tiles'],
            size: ['2x2', '2x4', '800x800 mm', '800x1600 mm', '1200x1800 mm', '800x2400 mm', '800x3000 mm'],
            design: [
                '3D', 'Wooden', 'Marble', 'Carpet', 'Granite', 'Mosaic', 'Texture', 'Stone',
                'Brick', 'Moroccan', 'Athangudi', 'Fluted', 'Terrazzo', 'Book Match', 'End Match', 'Statuario',
                'White Brick', '3D Pooja Room'
            ],
            type: [
                'Ceramic', 'Vitrified', 'Glass Highlighter', 'Printed', 'Designer', 'Digital', 'Porcelain',
                'Glazed Vitrified', 'Double Charge Vitrified', 'Full Body Vitrified'
            ],
            finish: ['Anti Skid', 'Glossy', 'Matt', 'Rustic', 'Polished'],
            color: [
                'White', 'Black', 'Grey', 'Brown', 'Beige', 'Ivory', 'Cream', 'Yellow', 'Blue', 'Green',
                'Pink', 'Orange', 'Purple', 'Black & White', 'Grey & White'
            ]
        }
    },
    'drawing-room-tiles': {
        name: 'Drawing Room Tiles',
        icon: 'layout',
        image: TILE_IMAGES[4],
        shortName: 'Drawing Room',
        parentMain: 'living-room-tiles',
        category_type: 'tile',
        featured: true,
        description: 'Grand drawing-room tiles — book-match statuario, marble and large-format slabs for a formal, elegant space.',
        valueMode: { area: 'suffix', size: 'bare', design: 'literal', type: 'literal', finish: 'literal', color: 'literal' },
        groups: {
            area: ['Drawing Room Floor Tiles'],
            size: ['2x2', '2x4', '800x800 mm', '800x1600 mm', '1200x1800 mm', '800x2400 mm', '800x3000 mm'],
            design: [
                '3D', 'Wooden', 'Marble', 'Carpet', 'Granite', 'Mosaic', 'Texture', 'Stone',
                'Brick', 'Moroccan', 'Athangudi', 'Fluted', 'Terrazzo', 'Book Match', 'End Match', 'Statuario',
                'White Brick'
            ],
            type: [
                'Ceramic', 'Vitrified', 'Glass Highlighter', 'Printed', 'Designer', 'Digital', 'Porcelain',
                'Glazed Vitrified', 'Double Charge Vitrified', 'Full Body Vitrified'
            ],
            finish: ['Anti Skid', 'Glossy', 'Matt', 'Rustic', 'Polished'],
            color: [
                'White', 'Black', 'Grey', 'Brown', 'Beige', 'Ivory', 'Cream', 'Yellow', 'Blue', 'Green',
                'Pink', 'Orange', 'Purple', 'Black & White', 'Grey & White'
            ]
        }
    },
    'dining-room-tiles': {
        name: 'Dining Room Tiles',
        icon: 'layout',
        image: TILE_IMAGES[4],
        shortName: 'Dining Room',
        parentMain: 'living-room-tiles',
        category_type: 'tile',
        featured: true,
        description: 'Dining room tiles that withstand spills and look stunning — porcelain, marble and easy-clean finishes.',
        valueMode: { area: 'suffix', size: 'bare', design: 'literal', type: 'literal', finish: 'literal', color: 'literal' },
        groups: {
            area: ['Dining Room Floor Tiles', 'Dining Room Wall Tiles'],
            size: ['2x2', '2x4', '800x800 mm', '800x1600 mm', '1200x1800 mm', '800x2400 mm', '800x3000 mm'],
            design: [
                '3D', 'Wooden', 'Marble', 'Carpet', 'Granite', 'Mosaic', 'Texture', 'Stone',
                'Brick', 'Moroccan', 'Athangudi', 'Fluted', 'Terrazzo', 'Book Match', 'End Match', 'Statuario',
                'White Brick'
            ],
            type: [
                'Ceramic', 'Vitrified', 'Glass Highlighter', 'Printed', 'Designer', 'Digital', 'Porcelain',
                'Glazed Vitrified', 'Double Charge Vitrified', 'Full Body Vitrified'
            ],
            finish: ['Anti Skid', 'Glossy', 'Matt', 'Rustic', 'Polished'],
            color: [
                'White', 'Black', 'Grey', 'Brown', 'Beige', 'Ivory', 'Cream', 'Yellow', 'Blue', 'Green',
                'Pink', 'Orange', 'Purple', 'Black & White', 'Grey & White'
            ]
        }
    },
    'outdoor-tiles': {
        name: 'Outdoor Tiles',
        icon: 'plant',
        image: TILE_IMAGES[5],
        shortName: 'Outdoor',
        category_type: 'tile',
        featured: true,
        description: 'Weather-ready outdoor tiles for gardens, terraces, balconies and pathways — anti-skid and rustic finishes built for the elements.',
        valueMode: { application: 'literal', size: 'bare', design: 'composed', type: 'composed', finish: 'composed', color: 'composed' },
        groups: {
            application: [
                'Garden Tiles', 'Terrace Tiles', 'Balcony Tiles', 'Pathway Tiles', 'Porch Tiles', 'Patio Tiles',
                'Outdoor Wall Tiles', 'Outdoor Floor Tiles'
            ],
            size: ['300x300 mm', '400x400 mm', '600x600 mm', '600x1200 mm', '800x1600 mm'],
            design: ['Stone Finish Outdoor Tiles', 'Concrete Finish Outdoor Tiles', 'Wooden Outdoor Tiles', 'Granite Outdoor Tiles'],
            type: ['Vitrified Outdoor Tiles', 'Ceramic Outdoor Tiles', 'Full Body Vitrified Outdoor Tiles', 'Double Charge Outdoor Tiles'],
            finish: ['Anti-Skid Outdoor Tiles', 'Rustic Outdoor Tiles', 'Matt Outdoor Tiles', 'Textured Outdoor Tiles'],
            color: FLOOR_COLOR.map(c => `${c} Outdoor Tiles`)
        }
    },
    'parking-tiles': {
        name: 'Parking Tiles',
        icon: 'parking',
        image: TILE_IMAGES[6],
        shortName: 'Parking',
        category_type: 'tile',
        featured: true,
        description: 'Heavy-duty, high load-bearing parking and driveway tiles engineered for constant vehicle traffic.',
        valueMode: { application: 'literal', size: 'bare', design: 'composed', type: 'composed', finish: 'composed', color: 'composed' },
        groups: {
            application: ['Parking Floor Tiles', 'Driveway Tiles', 'Garage Tiles'],
            size: ['300x300 mm', '400x400 mm', '600x600 mm', '600x1200 mm'],
            design: ['Stone Parking Tiles', 'Concrete Parking Tiles', 'Granite Parking Tiles'],
            type: ['Heavy Duty Tiles', 'High Load Bearing Tiles', 'Paver Tiles', 'Full Body Vitrified Parking Tiles'],
            finish: ['Anti-Skid Parking Tiles', 'Rustic Parking Tiles', 'Matt Parking Tiles'],
            color: FLOOR_COLOR.map(c => `${c} Parking Tiles`)
        }
    },
    'ceramic-tiles': {
        name: 'Ceramic Tiles',
        icon: 'stack',
        image: TILE_IMAGES[7],
        shortName: 'Ceramic',
        category_type: 'tile',
        featured: true,
        description: 'Affordable, versatile ceramic tiles for floors, walls, kitchens and bathrooms in glossy, matt and digital-print finishes.',
        valueMode: { application: 'literal', size: 'bare', design: 'composed', type: 'composed', finish: 'composed', color: 'composed' },
        groups: {
            application: ['Ceramic Floor Tiles', 'Ceramic Wall Tiles', 'Ceramic Bathroom Tiles', 'Ceramic Kitchen Tiles'],
            size: ['200x200 mm', '300x300 mm', '300x600 mm', '600x600 mm'],
            design: ['Marble Ceramic Tiles', 'Wooden Ceramic Tiles', 'Stone Ceramic Tiles', 'Mosaic Ceramic Tiles'],
            type: ['Designer Ceramic Tiles', 'Digital Ceramic Tiles', 'Printed Ceramic Tiles', 'Glazed Ceramic Tiles'],
            finish: ['Glossy Ceramic Tiles', 'Matt Ceramic Tiles'],
            color: FLOOR_COLOR.map(c => `${c} Ceramic Tiles`)
        }
    },
    'vitrified-tiles': {
        name: 'Vitrified Tiles',
        icon: 'gem',
        image: TILE_IMAGES[0],
        shortName: 'Vitrified',
        category_type: 'tile',
        featured: true,
        description: 'High-strength, low-porosity vitrified tiles — GVT, PGVT, double charge and full body — for premium floors and walls.',
        valueMode: { application: 'literal', size: 'bare', design: 'composed', type: 'composed', finish: 'composed', color: 'composed' },
        groups: {
            application: ['Vitrified Floor Tiles', 'Vitrified Wall Tiles'],
            size: ['600x600 mm', '600x1200 mm', '800x1600 mm', '800x2400 mm', '1200x1800 mm'],
            design: ['Large Format Vitrified Tiles', 'Marble Vitrified Tiles', 'Stone Vitrified Tiles'],
            type: ['GVT Tiles', 'PGVT Tiles', 'Double Charge Vitrified Tiles', 'Full Body Vitrified Tiles', 'Nano Vitrified Tiles', 'Digital Vitrified Tiles'],
            finish: ['Polished Vitrified Tiles', 'Matt Vitrified Tiles'],
            color: FLOOR_COLOR.map(c => `${c} Vitrified Tiles`)
        }
    },
    'other-tile-areas': {
        name: 'Other Tile Areas',
        icon: 'building',
        image: TILE_IMAGES[1],
        shortName: 'Other Areas',
        category_type: 'tile',
        featured: false,
        description: 'Specialty tiling for staircases, commercial spaces, hospitality, healthcare and institutional projects.',
        valueMode: { application: 'literal', size: 'bare', design: 'composed', type: 'composed', finish: 'composed', color: 'composed' },
        groups: {
            application: [
                'Staircase Tiles', 'Pooja Room Tiles', 'Commercial Tiles', 'Office Tiles', 'Hotel Tiles',
                'Restaurant Tiles', 'Hospital Tiles', 'School Tiles', 'Swimming Pool Tiles', 'Gym Tiles',
                'Industrial Tiles', 'Reception Area Tiles', 'Lobby Tiles', 'Corridor Tiles'
            ],
            size: ['300x300 mm', '600x600 mm', '600x1200 mm'],
            design: ['Marble Tiles', 'Wooden Tiles', 'Stone Tiles', 'Plain Tiles', 'Designer Tiles'],
            type: ['Ceramic Tiles', 'Vitrified Tiles', 'Porcelain Tiles', 'Full Body Vitrified Tiles'],
            finish: ['Glossy Tiles', 'Matt Tiles', 'Anti-Skid Tiles', 'Polished Tiles'],
            color: FLOOR_COLOR.map(c => `${c} Tiles`)
        }
    },
    'stone-brick-cladding': {
        name: 'Stone & Brick Cladding',
        icon: 'landscape',
        image: TILE_IMAGES[2],
        shortName: 'Cladding',
        category_type: 'cladding',
        featured: true,
        description: 'Natural and artificial stone, brick and slate cladding panels for interior feature walls and exterior facades.',
        valueMode: { application: 'literal', size: 'bare', type: 'literal', color: 'bare' },
        groups: {
            application: ['Exterior Stone Cladding', 'Interior Stone Cladding'],
            type: [
                'Natural Stone Cladding', 'Artificial Stone Cladding', 'Brick Cladding', 'Stone Wall Panels',
                'Brick Wall Panels', 'Slate Cladding', 'Sandstone Cladding', 'Marble Cladding', 'Granite Cladding',
                'Rustic Stone Cladding', 'Decorative Wall Cladding'
            ],
            color: FLOOR_COLOR,
            size: ['600x150 mm', '600x300 mm', '400x400 mm', 'Random Size', 'Custom Size']
        }
    },
    'tile-accessories': {
        name: 'Tile Accessories',
        icon: 'fittings',
        image: TILE_IMAGES[3],
        shortName: 'Accessories',
        category_type: 'accessory',
        featured: true,
        description: 'Adhesives, grout, spacers, levelling systems and tools for professional tile installation and maintenance — not a tile category.',
        valueMode: { type: 'literal' },
        groups: {
            type: [
                'Tile Adhesive', 'Tile Grout', 'Epoxy Grout', 'Tile Spacers', 'Tile Levelling Clips',
                'Tile Levelling Wedges', 'Tile Cutting Tools', 'Tile Cutters', 'Tile Installation Tools',
                'Tile Cleaning Products', 'Tile Sealers', 'Tile Profiles', 'Corner Profiles', 'Edge Profiles',
                'Transition Profiles', 'Floor Protection Products'
            ]
        }
    },
    'home-utility-products': {
        name: 'Home Utility Products',
        icon: 'construction',
        image: TILE_IMAGES[4],
        shortName: 'Home Utility',
        category_type: 'utility',
        featured: false,
        description: 'Bathroom and kitchen utility fixtures, cleaning and storage products, and other home-improvement essentials.',
        valueMode: { type: 'literal' },
        groups: {
            type: [
                'Bathroom Utility Products', 'Kitchen Utility Products', 'Cleaning Products', 'Storage Products',
                'Home Improvement Products', 'Installation Accessories', 'Maintenance Products', 'Home Hardware',
                'Utility Fixtures', 'Other Home Utility Products'
            ]
        }
    }
};

// Technical spec attributes, scoped per main category (separate from the
// browsable Area/Size/Design/Type/Finish/Color taxonomy above).
const ATTRIBUTE_DEFS = [
    { name: 'Water Absorption', input_type: 'text', unit: '%' },
    { name: 'Abrasion Resistance (PEI Rating)', input_type: 'select', unit: null, values: ['PEI 3', 'PEI 4', 'PEI 5'] },
    { name: 'Slip Resistance (R Rating)', input_type: 'select', unit: null, values: ['R9', 'R10', 'R11', 'R12'] },
    { name: 'Breaking Strength', input_type: 'text', unit: 'N/mm²' },
    { name: 'Warranty', input_type: 'select', unit: null, values: ['5 Years', '10 Years', '15 Years'] },
    { name: 'Chemical & Frost Resistance', input_type: 'text', unit: null }
];

// ---------------------------------------------------------------------------
// Demo product catalog — a representative spread across both main categories
// and every facet group, tagged via product_categories (many-to-many). Admins
// can add unlimited further products/categories through the admin panel
// without touching this file or any frontend code.
// ---------------------------------------------------------------------------

const PRODUCTS = [
    // ---- Floor Tiles ----
    { main: 'floor-tiles', name: 'Statuario Gold Vein Polished Slab', price: 189, offer_price: 159, brand: 'kajaria-eternity', collection: 'italian-royal-marble', area: 'Living Room', size: '600x1200 mm', design: 'Statuario', type: 'Full Body Vitrified', finish: 'Polished', color: 'White & Gold', featured: true },
    { main: 'floor-tiles', name: 'Smoked Honey Wooden Plank Tile', price: 96, offer_price: 82, brand: 'somany-grandeur', collection: 'natural-wooden-planks', area: 'Bedroom', size: '200x1200 mm', design: 'Wooden Plank', type: 'Full Body Vitrified', finish: 'Matt', color: 'Brown', featured: true },
    { main: 'floor-tiles', name: 'Carrara Classic Marble Floor Tile', price: 145, offer_price: null, brand: 'nitco-tiles', collection: 'italian-royal-marble', area: 'Drawing Room', size: '800x1600 mm', design: 'Carrara', type: 'Porcelain', finish: 'Polished', color: 'White', featured: true },
    { main: 'floor-tiles', name: 'Industrial Slate Grey Cement Tile', price: 78, offer_price: 65, brand: 'simpolo-vitrified', collection: 'urban-concrete-terrazzo', area: 'Kitchen', size: '600x600 mm', design: 'Cement', type: 'Vitrified', finish: 'Matt', color: 'Grey', featured: false },
    { main: 'floor-tiles', name: 'Charcoal Anti-Skid Parking Tile 20mm', price: 62, offer_price: null, brand: 'orientbell-horizon', collection: null, area: 'Parking', size: '600x600 mm', design: 'Stone', type: 'Full Body Vitrified', finish: 'Anti Skid', color: 'Black', featured: false },
    { main: 'floor-tiles', name: 'Sandstone Beige Driveway Tile', price: 54, offer_price: 48, brand: 'orientbell-horizon', collection: null, area: 'Outdoor', size: '300x300 mm', design: 'Stone', type: 'Full Body Vitrified', finish: 'Anti Skid', color: 'Beige', featured: false },
    { main: 'floor-tiles', name: 'Pool Deck Granite-Look Slab', price: 88, offer_price: null, brand: 'marazzi-italian', collection: 'outdoor-deck-slabs', area: 'Swimming Pool', size: '800x1600 mm', design: 'Granite', type: 'Full Body Vitrified', finish: 'Anti Skid', color: 'Grey', featured: false },
    { main: 'floor-tiles', name: 'Golden Sand Terrace Paver', price: 58, offer_price: 52, brand: 'orientbell-horizon', collection: 'outdoor-deck-slabs', area: 'Terrace', size: '400x400 mm', design: 'Stone', type: 'Full Body Vitrified', finish: 'Rustic', color: 'Gold', featured: false },
    { main: 'floor-tiles', name: 'Pure White Puja Room Marble Tile', price: 132, offer_price: null, brand: 'nitco-tiles', collection: 'italian-royal-marble', area: 'Pooja Room', size: '600x900 mm', design: 'Marble', type: 'Porcelain', finish: 'Polished', color: 'White', featured: false },
    { main: 'floor-tiles', name: 'Tan Brown Kitchen Countertop-Match Tile', price: 71, offer_price: 64, brand: 'somany-grandeur', collection: null, area: 'Kitchen', size: '600x1200 mm', design: 'Granite', type: 'Vitrified', finish: 'Glossy', color: 'Brown', featured: false },
    { main: 'floor-tiles', name: 'Emerald Green Mosaic Bar Floor Tile', price: 84, offer_price: null, brand: 'kajaria-eternity', collection: null, area: 'Bar', size: '300x300 mm', design: 'Mosaic', type: 'Ceramic', finish: 'Glossy', color: 'Green', featured: false },
    { main: 'floor-tiles', name: 'Ivory Anti-Skid Hospital Corridor Tile', price: 49, offer_price: 44, brand: 'simpolo-vitrified', collection: null, area: 'Hospital', size: '600x600 mm', design: 'Plain', type: 'Vitrified', finish: 'Anti Skid', color: 'Ivory', featured: false },
    { main: 'floor-tiles', name: 'Terracotta Clay Jali Garden Path Tile', price: 67, offer_price: null, brand: 'orientbell-horizon', collection: null, area: 'Garden', size: '300x300 mm', design: 'Terracotta', type: 'Ceramic', finish: 'Rustic', color: 'Terracotta', featured: false },
    { main: 'floor-tiles', name: 'Athangudi Heritage Print Floor Tile', price: 74, offer_price: 68, brand: 'nitco-tiles', collection: null, area: 'Drawing Room', size: '300x300 mm', design: 'Athangudi', type: 'Digital', finish: 'Matt', color: 'Blue & White', featured: false },
    { main: 'floor-tiles', name: 'Herringbone Oak-Look Hallway Tile', price: 91, offer_price: null, brand: 'somany-grandeur', collection: 'natural-wooden-planks', area: 'Hallway', size: '200x1200 mm', design: 'Herringbone', type: 'Full Body Vitrified', finish: 'Matt', color: 'Brown', featured: false },
    { main: 'floor-tiles', name: 'Onyx Black & Gold Restaurant Floor Slab', price: 168, offer_price: 149, brand: 'marazzi-italian', collection: 'italian-royal-marble', area: 'Restaurant', size: '800x1600 mm', design: 'Onyx', type: 'Full Body Vitrified', finish: 'Hi-Gloss', color: 'Black & Gold', featured: true },
    { main: 'floor-tiles', name: 'Nano Polished School Corridor Tile', price: 43, offer_price: null, brand: 'simpolo-vitrified', collection: null, area: 'School', size: '600x600 mm', design: 'Plain', type: 'Nano', finish: 'Polished', color: 'Grey & White', featured: false },
    { main: 'floor-tiles', name: 'Chevron Pattern Living Room Tile', price: 99, offer_price: 89, brand: 'kajaria-eternity', collection: null, area: 'Living Room', size: '300x600 mm', design: 'Chevron', type: 'Porcelain', finish: 'Satin', color: 'Beige', featured: false },
    { main: 'floor-tiles', name: 'Terrazzo Speckle Commercial Foyer Tile', price: 76, offer_price: null, brand: 'simpolo-vitrified', collection: 'urban-concrete-terrazzo', area: 'Commercial', size: '600x600 mm', design: 'Terrazzo', type: 'Vitrified', finish: 'Matt', color: 'Grey', featured: false },
    { main: 'floor-tiles', name: 'Kota Stone-Look Balcony Tile', price: 52, offer_price: 46, brand: 'orientbell-horizon', collection: null, area: 'Balcony', size: '400x400 mm', design: 'Kota Design', type: 'Ceramic', finish: 'Anti Skid', color: 'Green', featured: false },

    // ---- Wall Tiles ----
    { main: 'wall-tiles', name: 'Deep Emerald Subway Kitchen Backsplash', price: 68, offer_price: 59, brand: 'kajaria-eternity', collection: null, area: 'Kitchen', size: '300x600 mm', design: 'Subway', type: 'Glazed', finish: 'Glossy', color: 'Green', featured: true },
    { main: 'wall-tiles', name: 'White & Grey Marble Bathroom Wall Tile', price: 72, offer_price: null, brand: 'nitco-tiles', collection: 'italian-royal-marble', area: 'Bathroom', size: '300x600 mm', design: 'Marble', type: 'Ceramic', finish: 'Glossy', color: 'Grey & White', featured: true },
    { main: 'wall-tiles', name: 'Moroccan Pattern Feature Wall Tile', price: 89, offer_price: 79, brand: 'somany-grandeur', collection: null, area: 'Living Room', size: '200x200 mm', design: 'Moroccan', type: 'Digital', finish: 'Matt', color: 'Blue', featured: true },
    { main: 'wall-tiles', name: 'Deep Onyx Black & Gold Elevation Tile', price: 158, offer_price: null, brand: 'marazzi-italian', collection: 'italian-royal-marble', area: 'Elevation', size: '600x1200 mm', design: 'Marble', type: 'Full Body Vitrified', finish: 'Metallic', color: 'Black & Gold', featured: false },
    { main: 'wall-tiles', name: 'Terracotta Red Brick-Look Elevation Tile', price: 61, offer_price: 54, brand: 'orientbell-horizon', collection: null, area: 'Elevation', size: '100x200 mm', design: 'Brick', type: 'Ceramic', finish: 'Matt', color: 'Terracotta', featured: false },
    { main: 'wall-tiles', name: 'Sky Blue Floral Pooja Room Wall Tile', price: 57, offer_price: null, brand: 'simpolo-vitrified', collection: null, area: 'Pooja Room', size: '300x450 mm', design: 'Floral', type: 'Ceramic', finish: 'Glossy', color: 'Sky Blue', featured: false },
    { main: 'wall-tiles', name: 'Multi-Blend Mosaic Bedroom Accent Tile', price: 74, offer_price: 66, brand: 'kajaria-eternity', collection: null, area: 'Bedroom', size: '100x100 mm', design: 'Mosaic', type: 'Glass Highlighter', finish: 'Glossy', color: 'Purple', featured: false },
    { main: 'wall-tiles', name: 'Charcoal Stone-Texture TV Unit Wall Tile', price: 81, offer_price: null, brand: 'marazzi-italian', collection: 'urban-concrete-terrazzo', area: 'TV Unit', size: '600x1200 mm', design: 'Stone', type: 'Full Body Vitrified', finish: 'Rustic', color: 'Black', featured: false },
    { main: 'wall-tiles', name: 'Golden Highlighter Hotel Lobby Wall Tile', price: 112, offer_price: 98, brand: 'marazzi-italian', collection: null, area: 'Hotel', size: '300x600 mm', design: 'Highlighter', type: 'Glass Highlighter', finish: 'Metallic', color: 'Gold', featured: true },
    { main: 'wall-tiles', name: 'Ivory Wooden Texture Office Wall Tile', price: 66, offer_price: null, brand: 'somany-grandeur', collection: 'natural-wooden-planks', area: 'Office', size: '200x200 mm', design: 'Wooden', type: 'Digital', finish: 'Matt', color: 'Ivory', featured: false },
    { main: 'wall-tiles', name: 'Terrazzo Blend Restaurant Wall Panel', price: 79, offer_price: 71, brand: 'simpolo-vitrified', collection: 'urban-concrete-terrazzo', area: 'Restaurant', size: '300x300 mm', design: 'Terrazzo', type: 'Vitrified', finish: 'Satin Matt', color: 'Grey', featured: false },
    { main: 'wall-tiles', name: 'Abstract Geometric Commercial Wall Tile', price: 69, offer_price: null, brand: 'kajaria-eternity', collection: null, area: 'Commercial', size: '300x300 mm', design: 'Geometric', type: 'Designer', finish: 'Glossy', color: 'Aqua', featured: false },
    { main: 'wall-tiles', name: 'Balcony Outdoor Stone-Look Wall Cladding', price: 58, offer_price: 51, brand: 'orientbell-horizon', collection: null, area: 'Balcony', size: '150x150 mm', design: 'Stone', type: 'Full Body Vitrified', finish: 'Rustic', color: 'Beige', featured: false },
    { main: 'wall-tiles', name: 'Dining Room 3D Poster Accent Tile', price: 92, offer_price: null, brand: 'nitco-tiles', collection: null, area: 'Dining Room', size: '600x600 mm', design: '3D', type: 'Printed', finish: 'Glossy', color: 'White', featured: false },

    // ---- Kitchen Tiles ----
    { main: 'kitchen-tiles', name: 'Sugar-White Kitchen Backsplash Tile', price: 74, offer_price: 64, brand: 'kajaria-eternity', collection: null, application: 'Kitchen Backsplash Tiles', size: '300x600 mm', design: 'Marble', type: 'Ceramic', finish: 'Glossy', color: 'White', featured: true },
    { main: 'kitchen-tiles', name: 'Charcoal Subway Stove Area Tile', price: 68, offer_price: null, brand: 'simpolo-vitrified', collection: null, application: 'Stove Area Tiles', size: '100x300 mm', design: 'Subway', type: 'Ceramic', finish: 'Matt', color: 'Black', featured: true },
    { main: 'kitchen-tiles', name: 'Golden Highlighter Chimney Wall Tile', price: 96, offer_price: 84, brand: 'marazzi-italian', collection: null, application: 'Chimney Area Tiles', size: '300x600 mm', design: 'Highlighter', type: 'Glass Highlighter', finish: 'Metallic', color: 'Gold', featured: false },
    { main: 'kitchen-tiles', name: 'Sky Blue Mosaic Sink Area Tile', price: 71, offer_price: null, brand: 'kajaria-eternity', collection: null, application: 'Sink Area Tiles', size: '100x100 mm', design: 'Mosaic', type: 'Glazed', finish: 'Glossy', color: 'Sky Blue', featured: false },
    { main: 'kitchen-tiles', name: 'Wood Plank Pantry Floor Tile', price: 89, offer_price: 78, brand: 'somany-grandeur', collection: 'natural-wooden-planks', application: 'Pantry Area Tiles', size: '150x150 mm', design: 'Wood Plank', type: 'Vitrified', finish: 'Matt', color: 'Brown', featured: false },
    { main: 'kitchen-tiles', name: 'Two-Tone Grey Kitchen Floor Slab', price: 66, offer_price: null, brand: 'simpolo-vitrified', collection: null, application: 'Kitchen Floor Tiles', size: '600x600 mm', design: 'Two-Tone', type: 'Vitrified', finish: 'Matt', color: 'Grey', featured: false },
    { main: 'kitchen-tiles', name: 'Terrazzo Blend Countertop Wall Tile', price: 79, offer_price: 69, brand: 'simpolo-vitrified', collection: 'urban-concrete-terrazzo', application: 'Countertop Wall Tiles', size: '300x300 mm', design: 'Terrazzo', type: 'Porcelain', finish: 'Satin', color: 'Beige', featured: false },
    { main: 'kitchen-tiles', name: 'Geometric Ivory Breakfast Counter Tile', price: 73, offer_price: null, brand: 'nitco-tiles', collection: null, application: 'Breakfast Counter Tiles', size: '200x200 mm', design: 'Geometric', type: 'Designer', finish: 'Glossy', color: 'Ivory', featured: false },
    { main: 'kitchen-tiles', name: 'Digital Print Kitchen Feature Wall Tile', price: 84, offer_price: 74, brand: 'marazzi-italian', collection: null, application: 'Kitchen Feature Wall Tiles', size: '300x600 mm', design: 'Digital', type: 'Digital', finish: 'High Gloss', color: 'Aqua', featured: false },
    { main: 'kitchen-tiles', name: 'Herringbone Oak Wash Area Tile', price: 92, offer_price: null, brand: 'somany-grandeur', collection: 'natural-wooden-planks', application: 'Kitchen Wash Area Tiles', size: '75x300 mm', design: 'Herringbone', type: 'Full Body Vitrified', finish: 'Rustic', color: 'Brown', featured: false },
    { main: 'kitchen-tiles', name: 'Cement Grey Kitchen Wall Tile', price: 62, offer_price: 54, brand: 'kajaria-eternity', collection: 'urban-concrete-terrazzo', application: 'Kitchen Wall Tiles', size: '300x450 mm', design: 'Concrete', type: 'Ceramic', finish: 'Matt', color: 'Grey & White', featured: false },
    { main: 'kitchen-tiles', name: 'Marble Effect Cabinet Backsplash Tile', price: 97, offer_price: null, brand: 'nitco-tiles', collection: 'italian-royal-marble', application: 'Kitchen Cabinet Backsplash Tiles', size: '600x1200 mm', design: 'Marble Effect', type: 'Full Body Vitrified', finish: 'Polished', color: 'White & Gold', featured: true },

    // ---- Kitchen Countertops ----
    { main: 'kitchen-countertops', name: 'Pure White Quartz Kitchen Countertop', price: 320, offer_price: 289, brand: 'nitco-tiles', collection: null, type: 'Quartz Countertops', size: '1200x2400 mm', finish: 'Polished', color: 'White', featured: true },
    { main: 'kitchen-countertops', name: 'Black Galaxy Granite Countertop', price: 265, offer_price: null, brand: 'kajaria-eternity', collection: null, type: 'Granite Countertops', size: '800x1600 mm', finish: 'High Gloss', color: 'Black', featured: true },
    { main: 'kitchen-countertops', name: 'Ivory Breakfast Countertop Island', price: 195, offer_price: 176, brand: 'somany-grandeur', collection: null, type: 'Breakfast Countertops', size: '600x1200 mm', finish: 'Matt', color: 'Ivory', featured: false },
    { main: 'kitchen-countertops', name: 'Engineered Stone Kitchen Countertop', price: 240, offer_price: null, brand: 'simpolo-vitrified', collection: null, type: 'Kitchen Countertops', size: '800x2400 mm', finish: 'Honed', color: 'Grey', featured: false },

    // ---- Bathroom Tiles ----
    { main: 'bathroom-tiles', name: 'Anti-Skid Charcoal Shower Floor Tile', price: 58, offer_price: 51, brand: 'simpolo-vitrified', collection: null, application: 'Shower Floor Tiles', size: '300x300 mm', design: 'Plain', type: 'Ceramic', finish: 'Anti-Skid', color: 'Black', featured: true },
    { main: 'bathroom-tiles', name: 'Statuario Marble Bathroom Wall Tile', price: 112, offer_price: 96, brand: 'nitco-tiles', collection: 'italian-royal-marble', application: 'Bathroom Wall Tiles', size: '600x1200 mm', design: 'Marble', type: 'Porcelain', finish: 'Glossy', color: 'White', featured: true },
    { main: 'bathroom-tiles', name: 'Hexagon Mosaic Vanity Area Tile', price: 76, offer_price: null, brand: 'kajaria-eternity', collection: null, application: 'Vanity Area Tiles', size: '150x150 mm', design: 'Hexagon', type: 'Glazed', finish: 'Glossy', color: 'Blue', featured: false },
    { main: 'bathroom-tiles', name: 'Terracotta Wash Basin Splashback Tile', price: 64, offer_price: 57, brand: 'orientbell-horizon', collection: null, application: 'Wash Basin Area Tiles', size: '300x450 mm', design: 'Pattern', type: 'Ceramic', finish: 'Matt', color: 'Terracotta', featured: false },
    { main: 'bathroom-tiles', name: 'Onyx Black & Gold Bathtub Wall Tile', price: 148, offer_price: null, brand: 'marazzi-italian', collection: 'italian-royal-marble', application: 'Bathtub Area Tiles', size: '600x1200 mm', design: 'Onyx', type: 'Full Body Vitrified', finish: 'High Gloss', color: 'Black & Gold', featured: true },
    { main: 'bathroom-tiles', name: 'Sandstone Anti-Skid Wet Area Tile', price: 55, offer_price: 48, brand: 'simpolo-vitrified', collection: null, application: 'Wet Area Tiles', size: '400x400 mm', design: 'Stone', type: 'Vitrified', finish: 'Anti-Skid', color: 'Beige', featured: false },
    { main: 'bathroom-tiles', name: 'Bookmatch Grey Feature Wall Tile', price: 121, offer_price: null, brand: 'marazzi-italian', collection: null, application: 'Feature Wall Bathroom Tiles', size: '800x1600 mm', design: 'Bookmatch', type: 'Porcelain', finish: 'Polished', color: 'Grey', featured: false },
    { main: 'bathroom-tiles', name: 'Honeycomb Ivory Toilet Area Tile', price: 69, offer_price: 61, brand: 'kajaria-eternity', collection: null, application: 'Toilet Area Tiles', size: '300x300 mm', design: 'Honeycomb', type: 'Ceramic', finish: 'Matt', color: 'Ivory', featured: false },
    { main: 'bathroom-tiles', name: 'Slate Grey Dry Area Bathroom Tile', price: 63, offer_price: null, brand: 'nitco-tiles', collection: null, application: 'Dry Area Bathroom Tiles', size: '600x600 mm', design: 'Slate', type: 'Vitrified', finish: 'Matt', color: 'Grey', featured: false },
    { main: 'bathroom-tiles', name: 'Tropical Green Accent Wall Tile', price: 82, offer_price: 72, brand: 'kajaria-eternity', collection: null, application: 'Accent Wall Bathroom Tiles', size: '300x600 mm', design: 'Tropical', type: 'Digital', finish: 'Glossy', color: 'Green', featured: false },
    { main: 'bathroom-tiles', name: 'Carving Pattern Full Wall Marble Tile', price: 134, offer_price: null, brand: 'nitco-tiles', collection: 'italian-royal-marble', application: 'Full Wall Bathroom Tiles', size: '1200x1800 mm', design: 'Carving Design', type: 'Marble Stone', finish: 'Polished', color: 'White', featured: false },
    { main: 'bathroom-tiles', name: 'Terrazzo Blush Bathroom Backsplash Tile', price: 71, offer_price: 63, brand: 'simpolo-vitrified', collection: 'urban-concrete-terrazzo', application: 'Bathroom Backsplash Tiles', size: '300x300 mm', design: 'Terrazzo', type: 'Vitrified', finish: 'Satin', color: 'Pink', featured: false },

    // ---- Living Room Tiles ----
    { main: 'living-room-tiles', name: 'Carrara Marble Large Format Living Room Slab', price: 178, offer_price: 159, brand: 'nitco-tiles', collection: 'italian-royal-marble', area: 'Living Room Floor Tiles', size: '800x1600 mm', design: 'Large Format', type: 'Full Body Vitrified', finish: 'Polished', color: 'White', featured: true },
    { main: 'living-room-tiles', name: 'Walnut Wood-Look TV Unit Tile', price: 92, offer_price: 81, brand: 'somany-grandeur', collection: 'natural-wooden-planks', application: 'TV Unit Tiles', size: '600x1200 mm', design: 'Wooden', type: 'Vitrified', finish: 'Matt', color: 'Brown', featured: true },
    { main: 'living-room-tiles', name: 'Charcoal Stone Feature Wall Slab', price: 164, offer_price: null, brand: 'marazzi-italian', collection: 'urban-concrete-terrazzo', application: 'Feature Wall Tiles', size: '1200x1800 mm', design: 'Stone', type: 'Full Body Vitrified', finish: 'Rustic', color: 'Black', featured: false },
    { main: 'living-room-tiles', name: 'Mosaic Terrazzo Accent Wall Tile', price: 69, offer_price: 61, brand: 'kajaria-eternity', collection: null, application: 'Accent Wall Tiles', size: '300x300 mm', design: 'Mosaic', type: 'Ceramic', finish: 'Glossy', color: 'Aqua', featured: false },
    { main: 'living-room-tiles', name: '3D Grey Designer Living Room Floor Tile', price: 87, offer_price: null, brand: 'simpolo-vitrified', collection: null, area: 'Living Room Floor Tiles', size: '600x600 mm', design: '3D', type: 'Porcelain', finish: 'Glossy', color: 'Grey', featured: false },

    { main: 'bedroom-tiles', name: 'Walnut Wooden Bedroom Floor Tile', price: 96, offer_price: 84, brand: 'somany-grandeur', collection: 'natural-wooden-planks', area: 'Bedroom Floor Tiles', size: '800x1600 mm', design: 'Wooden Bedroom', type: 'Vitrified', finish: 'Matt', color: 'Brown', featured: true },
    { main: 'bedroom-tiles', name: '3D Pearl White Bedroom Wall Tile', price: 74, offer_price: 66, brand: 'nitco-tiles', collection: null, area: 'Bedroom Wall Tiles', size: '800x800 mm', design: '3D Bedroom', type: 'Ceramic', finish: 'Glossy', color: 'White Bedroom', featured: true },
    { main: 'pooja-room-tiles', name: 'Golden 3D Pooja Room Wall Tile', price: 88, offer_price: 78, brand: 'kajaria-eternity', collection: null, area: 'Pooja Room Wall Tiles', size: '600x1200 mm', design: '3D Pooja Room', type: 'Porcelain', finish: 'Glossy', color: 'Gold', featured: true },
    { main: 'dining-room-tiles', name: 'Statuario Book Match Dining Room Slab', price: 182, offer_price: 162, brand: 'marazzi-italian', collection: 'italian-royal-marble', area: 'Dining Room Floor Tiles', size: '1200x1800 mm', design: 'Book Match', type: 'Full Body Vitrified', finish: 'Polished', color: 'White', featured: true },
    { main: 'hallway-tiles', name: 'Anti Skid Grey Hallway Floor Tile', price: 58, offer_price: null, brand: 'orient-bathrooms', collection: null, area: 'Hallway Floor Tiles', size: '2x2', design: 'Texture', type: 'Ceramic', finish: 'Anti Skid', color: 'Grey', featured: false },
    { main: 'drawing-room-tiles', name: 'Royal Marble Drawing Room Floor Tile', price: 168, offer_price: 149, brand: 'nitco-tiles', collection: 'italian-royal-marble', area: 'Drawing Room Floor Tiles', size: '800x2400 mm', design: 'Marble', type: 'Double Charge Vitrified', finish: 'Polished', color: 'Beige', featured: true },

    // ---- Outdoor Tiles ----
    { main: 'outdoor-tiles', name: 'Granite-Look Anti-Skid Garden Tile', price: 56, offer_price: 49, brand: 'orientbell-horizon', collection: null, application: 'Garden Tiles', size: '400x400 mm', design: 'Granite', type: 'Full Body Vitrified', finish: 'Anti-Skid', color: 'Grey', featured: true },
    { main: 'outdoor-tiles', name: 'Sandstone Terrace Paver Tile', price: 61, offer_price: null, brand: 'orientbell-horizon', collection: 'outdoor-deck-slabs', application: 'Terrace Tiles', size: '600x600 mm', design: 'Stone Finish', type: 'Vitrified', finish: 'Rustic', color: 'Beige', featured: true },
    { main: 'outdoor-tiles', name: 'Concrete Grey Balcony Floor Tile', price: 47, offer_price: 41, brand: 'simpolo-vitrified', collection: null, application: 'Balcony Tiles', size: '300x300 mm', design: 'Concrete Finish', type: 'Ceramic', finish: 'Matt', color: 'Grey', featured: false },
    { main: 'outdoor-tiles', name: 'Textured Wood-Look Pathway Tile', price: 58, offer_price: null, brand: 'somany-grandeur', collection: null, application: 'Pathway Tiles', size: '400x400 mm', design: 'Wooden', type: 'Full Body Vitrified', finish: 'Textured', color: 'Brown', featured: false },
    { main: 'outdoor-tiles', name: 'Charcoal Anti-Skid Patio Slab', price: 94, offer_price: 82, brand: 'marazzi-italian', collection: 'outdoor-deck-slabs', application: 'Patio Tiles', size: '800x1600 mm', design: 'Stone Finish', type: 'Double Charge', finish: 'Anti-Skid', color: 'Black', featured: false },

    // ---- Parking Tiles ----
    { main: 'parking-tiles', name: 'Heavy Duty Charcoal Parking Floor Tile', price: 52, offer_price: 46, brand: 'orientbell-horizon', collection: null, application: 'Parking Floor Tiles', size: '600x600 mm', design: 'Stone', type: 'Heavy Duty', finish: 'Anti-Skid', color: 'Black', featured: true },
    { main: 'parking-tiles', name: 'High Load Bearing Driveway Paver', price: 44, offer_price: null, brand: 'simpolo-vitrified', collection: null, application: 'Driveway Tiles', size: '300x300 mm', design: 'Concrete', type: 'High Load Bearing', finish: 'Rustic', color: 'Grey', featured: true },
    { main: 'parking-tiles', name: 'Granite-Look Garage Floor Tile', price: 49, offer_price: 43, brand: 'orientbell-horizon', collection: null, application: 'Garage Tiles', size: '400x400 mm', design: 'Granite', type: 'Paver', finish: 'Matt', color: 'Beige', featured: false },
    { main: 'parking-tiles', name: 'Full Body Vitrified Parking Slab 20mm', price: 67, offer_price: 59, brand: 'marazzi-italian', collection: null, application: 'Parking Floor Tiles', size: '600x1200 mm', design: 'Stone', type: 'Full Body Vitrified', finish: 'Anti-Skid', color: 'Grey & White', featured: false },

    // ---- Ceramic Tiles ----
    { main: 'ceramic-tiles', name: 'Glossy White Ceramic Floor Tile', price: 38, offer_price: 33, brand: 'kajaria-eternity', collection: null, application: 'Ceramic Floor Tiles', size: '300x300 mm', design: 'Marble', type: 'Designer', finish: 'Glossy', color: 'White', featured: true },
    { main: 'ceramic-tiles', name: 'Digital Print Ceramic Kitchen Tile', price: 44, offer_price: null, brand: 'somany-grandeur', collection: null, application: 'Ceramic Kitchen Tiles', size: '300x600 mm', design: 'Mosaic', type: 'Digital', finish: 'Glossy', color: 'Sky Blue', featured: true },
    { main: 'ceramic-tiles', name: 'Matt Wood-Look Ceramic Wall Tile', price: 41, offer_price: 36, brand: 'orientbell-horizon', collection: null, application: 'Ceramic Wall Tiles', size: '200x200 mm', design: 'Wooden', type: 'Printed', finish: 'Matt', color: 'Beige', featured: false },
    { main: 'ceramic-tiles', name: 'Glazed Stone-Look Ceramic Bathroom Tile', price: 39, offer_price: null, brand: 'simpolo-vitrified', collection: null, application: 'Ceramic Bathroom Tiles', size: '300x300 mm', design: 'Stone', type: 'Glazed', finish: 'Glossy', color: 'Grey', featured: false },

    // ---- Vitrified Tiles ----
    { main: 'vitrified-tiles', name: 'GVT Statuario Polished Slab', price: 142, offer_price: 126, brand: 'nitco-tiles', collection: 'italian-royal-marble', application: 'Vitrified Floor Tiles', size: '800x1600 mm', design: 'Marble', type: 'GVT', finish: 'Polished', color: 'White', featured: true },
    { main: 'vitrified-tiles', name: 'PGVT Grey Large Format Floor Slab', price: 189, offer_price: null, brand: 'marazzi-italian', collection: null, application: 'Vitrified Floor Tiles', size: '1200x1800 mm', design: 'Large Format', type: 'PGVT', finish: 'Polished', color: 'Grey', featured: true },
    { main: 'vitrified-tiles', name: 'Double Charge Vitrified Stone Floor Tile', price: 68, offer_price: 59, brand: 'simpolo-vitrified', collection: null, application: 'Vitrified Floor Tiles', size: '600x600 mm', design: 'Stone', type: 'Double Charge Vitrified', finish: 'Matt', color: 'Beige', featured: false },
    { main: 'vitrified-tiles', name: 'Nano Vitrified Ivory Wall Tile', price: 97, offer_price: null, brand: 'kajaria-eternity', collection: null, application: 'Vitrified Wall Tiles', size: '600x1200 mm', design: 'Marble', type: 'Nano Vitrified', finish: 'Polished', color: 'Ivory', featured: false },
    { main: 'vitrified-tiles', name: 'Digital Vitrified Charcoal Floor Slab', price: 214, offer_price: 189, brand: 'marazzi-italian', collection: 'urban-concrete-terrazzo', application: 'Vitrified Floor Tiles', size: '800x2400 mm', design: 'Large Format', type: 'Digital Vitrified', finish: 'Matt', color: 'Black', featured: true },

    // ---- Other Tile Areas ----
    { main: 'other-tile-areas', name: 'Anti-Skid Grey Staircase Tile', price: 58, offer_price: 51, brand: 'simpolo-vitrified', collection: null, application: 'Staircase Tiles', size: '300x300 mm', design: 'Stone', type: 'Vitrified', finish: 'Anti-Skid', color: 'Grey', featured: true },
    { main: 'other-tile-areas', name: 'Pure White Marble Pooja Room Tile', price: 118, offer_price: null, brand: 'nitco-tiles', collection: 'italian-royal-marble', application: 'Pooja Room Tiles', size: '600x600 mm', design: 'Marble', type: 'Porcelain', finish: 'Polished', color: 'White', featured: true },
    { main: 'other-tile-areas', name: 'Commercial Grade Lobby Floor Tile', price: 96, offer_price: 84, brand: 'marazzi-italian', collection: null, application: 'Lobby Tiles', size: '600x1200 mm', design: 'Designer', type: 'Full Body Vitrified', finish: 'Glossy', color: 'Grey & White', featured: false },
    { main: 'other-tile-areas', name: 'Anti-Skid Hospital Corridor Tile', price: 47, offer_price: null, brand: 'orientbell-horizon', collection: null, application: 'Hospital Tiles', size: '600x600 mm', design: 'Plain', type: 'Vitrified', finish: 'Anti-Skid', color: 'Ivory', featured: false },
    { main: 'other-tile-areas', name: 'Pool Deck Anti-Skid Tile', price: 52, offer_price: 45, brand: 'kajaria-eternity', collection: null, application: 'Swimming Pool Tiles', size: '300x300 mm', design: 'Stone', type: 'Ceramic', finish: 'Anti-Skid', color: 'Sky Blue', featured: false },

    // ---- Stone & Brick Cladding ----
    { main: 'stone-brick-cladding', name: 'Natural Slate Exterior Cladding Panel', price: 132, offer_price: 115, brand: 'orientbell-horizon', collection: null, application: 'Exterior Stone Cladding', type: 'Slate Cladding', color: 'Grey', size: '600x300 mm', featured: true },
    { main: 'stone-brick-cladding', name: 'Rustic Sandstone Wall Cladding', price: 118, offer_price: null, brand: 'orientbell-horizon', collection: null, application: 'Exterior Stone Cladding', type: 'Sandstone Cladding', color: 'Beige', size: 'Random Size', featured: true },
    { main: 'stone-brick-cladding', name: 'Artificial Brick Wall Panel', price: 76, offer_price: 67, brand: 'simpolo-vitrified', collection: null, application: 'Interior Stone Cladding', type: 'Brick Wall Panels', color: 'Terracotta', size: '600x150 mm', featured: false },
    { main: 'stone-brick-cladding', name: 'Decorative Marble Cladding Slab', price: 164, offer_price: null, brand: 'nitco-tiles', collection: 'italian-royal-marble', application: 'Interior Stone Cladding', type: 'Marble Cladding', color: 'White', size: '400x400 mm', featured: false },

    // ---- Tile Accessories (not a tile category — installation & maintenance products) ----
    { main: 'tile-accessories', name: 'Meenakshi ProBond White Tile Adhesive 20kg', price: 14, offer_price: 12, brand: null, collection: null, type: 'Tile Adhesive', featured: true },
    { main: 'tile-accessories', name: 'Epoxy Grout — Charcoal Grey 5kg', price: 22, offer_price: null, brand: null, collection: null, type: 'Epoxy Grout', featured: true },
    { main: 'tile-accessories', name: 'Tile Levelling Clips (200 pcs)', price: 9, offer_price: 7, brand: null, collection: null, type: 'Tile Levelling Clips', featured: false },
    { main: 'tile-accessories', name: 'Professional Tile Cutter 24-inch', price: 48, offer_price: 42, brand: null, collection: null, type: 'Tile Cutters', featured: false },
    { main: 'tile-accessories', name: 'Stainless Steel Corner Profile 2.5m', price: 11, offer_price: null, brand: null, collection: null, type: 'Corner Profiles', featured: false },

    // ---- Home Utility Products (not a tile category) ----
    { main: 'home-utility-products', name: 'Premium Bathroom Fitting Set', price: 56, offer_price: 49, brand: null, collection: null, type: 'Bathroom Utility Products', featured: true },
    { main: 'home-utility-products', name: 'Kitchen Sink Accessory Kit', price: 38, offer_price: null, brand: null, collection: null, type: 'Kitchen Utility Products', featured: true },
    { main: 'home-utility-products', name: 'Heavy-Duty Tile Cleaning Solution 1L', price: 8, offer_price: 6, brand: null, collection: null, type: 'Cleaning Products', featured: false },
    { main: 'home-utility-products', name: 'Modular Bathroom Storage Rack', price: 29, offer_price: 24, brand: null, collection: null, type: 'Storage Products', featured: false }
];

// ---------------------------------------------------------------------------

async function seedDatabase() {
    console.log('[Seeder] Starting Meenakshi Build World Taxonomy Seeding...');

    const isSqlite = db.getMode() === 'sqlite';

    if (isSqlite) {
        await db.execScript(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'customer',
                phone TEXT,
                company_name TEXT,
                gstin TEXT,
                credit_limit REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS category_groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_key TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                icon TEXT,
                display_order INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                slug TEXT NOT NULL,
                parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
                parent_main_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
                group_id INTEGER REFERENCES category_groups(id) ON DELETE SET NULL,
                category_type TEXT,
                description TEXT,
                image TEXT,
                banner_url TEXT,
                icon TEXT,
                seo_title TEXT,
                seo_description TEXT,
                status TEXT DEFAULT 'active',
                display_order INTEGER DEFAULT 0,
                featured INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(category_type);
            CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_parent_slug ON categories(parent_id, slug);
            CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
            CREATE INDEX IF NOT EXISTS idx_categories_group ON categories(group_id);

            CREATE TABLE IF NOT EXISTS category_attributes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                slug TEXT NOT NULL,
                input_type TEXT DEFAULT 'text',
                unit TEXT,
                display_order INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS attribute_values (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                attribute_id INTEGER REFERENCES category_attributes(id) ON DELETE CASCADE,
                value TEXT NOT NULL,
                display_order INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS brands (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                logo_url TEXT,
                banner_url TEXT,
                description TEXT,
                is_featured INTEGER DEFAULT 0,
                seo_title TEXT,
                seo_description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS collections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                tagline TEXT,
                banner_url TEXT,
                description TEXT,
                is_featured INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                sku TEXT UNIQUE NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                brand_id INTEGER,
                collection_id INTEGER,
                series TEXT,
                price REAL NOT NULL,
                offer_price REAL,
                dealer_price REAL,
                gst_percentage REAL DEFAULT 18.0,
                stock INTEGER DEFAULT 100,
                thickness_mm REAL DEFAULT 9.0,
                coverage_sqft_per_box REAL DEFAULT 15.5,
                coverage_sqmt_per_box REAL DEFAULT 1.44,
                weight_kg_per_box REAL DEFAULT 28.0,
                pieces_per_box INTEGER DEFAULT 4,
                warranty_years INTEGER DEFAULT 10,
                description TEXT,
                is_featured INTEGER DEFAULT 0,
                is_trending INTEGER DEFAULT 0,
                is_archived INTEGER DEFAULT 0,
                published INTEGER DEFAULT 1,
                views_count INTEGER DEFAULT 0,
                rating_avg REAL DEFAULT 4.8,
                reviews_count INTEGER DEFAULT 12,
                seo_title TEXT,
                seo_description TEXT,
                seo_keywords TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
            CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

            CREATE TABLE IF NOT EXISTS product_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
                UNIQUE(product_id, category_id)
            );
            CREATE INDEX IF NOT EXISTS idx_pc_product ON product_categories(product_id);
            CREATE INDEX IF NOT EXISTS idx_pc_category ON product_categories(category_id);

            CREATE TABLE IF NOT EXISTS product_attributes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                attribute_id INTEGER REFERENCES category_attributes(id) ON DELETE CASCADE,
                attribute_value_id INTEGER REFERENCES attribute_values(id) ON DELETE SET NULL,
                custom_value TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_pa_product ON product_attributes(product_id);
            CREATE INDEX IF NOT EXISTS idx_pa_attribute ON product_attributes(attribute_id);

            CREATE TABLE IF NOT EXISTS product_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                image_url TEXT NOT NULL,
                alt_text TEXT,
                is_primary INTEGER DEFAULT 0,
                display_order INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS product_variants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                sku TEXT UNIQUE NOT NULL,
                size_category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
                price REAL NOT NULL,
                offer_price REAL,
                dealer_price REAL,
                stock INTEGER DEFAULT 100,
                thickness_mm REAL DEFAULT 9.0,
                coverage_sqft_per_box REAL DEFAULT 15.5,
                weight_kg_per_box REAL DEFAULT 28.0,
                pieces_per_box INTEGER DEFAULT 4,
                is_default INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active'
            );
            CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);

            CREATE TABLE IF NOT EXISTS inventory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                variant_id INTEGER UNIQUE REFERENCES product_variants(id) ON DELETE CASCADE,
                quantity_boxes INTEGER DEFAULT 100,
                reserved_boxes INTEGER DEFAULT 0,
                reorder_level INTEGER DEFAULT 20,
                warehouse_location TEXT DEFAULT 'Warehouse A - Bay 4',
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_number TEXT UNIQUE NOT NULL,
                user_id INTEGER,
                customer_name TEXT NOT NULL,
                customer_email TEXT NOT NULL,
                customer_phone TEXT NOT NULL,
                shipping_address TEXT NOT NULL,
                city TEXT,
                state TEXT,
                pincode TEXT,
                gstin TEXT,
                total_amount REAL NOT NULL,
                gst_amount REAL DEFAULT 0,
                discount_amount REAL DEFAULT 0,
                net_payable REAL NOT NULL,
                payment_status TEXT DEFAULT 'pending',
                payment_method TEXT DEFAULT 'UPI',
                order_status TEXT DEFAULT 'Processing',
                tracking_number TEXT,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
                product_id INTEGER,
                product_name TEXT NOT NULL,
                sku TEXT NOT NULL,
                price_per_box REAL NOT NULL,
                quantity_boxes INTEGER NOT NULL,
                total_sqft REAL NOT NULL,
                subtotal REAL NOT NULL
            );

            CREATE TABLE IF NOT EXISTS blogs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                author TEXT DEFAULT 'Meenakshi Editorial Desk',
                category TEXT DEFAULT 'Design & Trends',
                banner_url TEXT,
                excerpt TEXT,
                content TEXT,
                published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                read_time TEXT DEFAULT '5 min read'
            );

            CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                user_id INTEGER,
                reviewer_name TEXT NOT NULL,
                rating INTEGER,
                comment TEXT,
                is_verified_buyer INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS inquiries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                name TEXT,
                phone TEXT,
                email TEXT,
                user_id INTEGER,
                product_id INTEGER,
                product_name TEXT,
                estimated_sqft REAL,
                address TEXT,
                data TEXT,
                message TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
    }

    // -----------------------------------------------------------------
    // Wipe (children first) — disposable dev/demo data, safe to reset.
    // -----------------------------------------------------------------
    for (const t of [
        'product_attributes', 'product_categories', 'inventory', 'product_variants',
        'product_images', 'reviews', 'order_items', 'orders', 'products',
        'attribute_values', 'category_attributes', 'categories', 'category_groups',
        'blogs', 'inquiries', 'collections', 'brands', 'users'
    ]) {
        await db.query(`DELETE FROM ${t}`);
    }

    // -----------------------------------------------------------------
    // 1. Users
    // -----------------------------------------------------------------
    const passwordHash = await bcrypt.hash('Password123!', 10);
    await db.query(`
        INSERT INTO users (name, email, password_hash, role, phone, company_name, gstin, credit_limit)
        VALUES
        ('Master Admin', 'admin@meenakshibuildworld.com', ?, 'admin', '+91 98765 43210', 'Meenakshi Build World Pvt Ltd', '27AAACL1234H1Z5', 500000.00),
        ('Premio Dealers Pvt Ltd', 'dealer@meenakshibuildworld.com', ?, 'dealer', '+91 98123 45678', 'Premio Tile Mart', '27AABCU9632M1ZP', 250000.00),
        ('Rahul Verma', 'customer@meenakshibuildworld.com', ?, 'customer', '+91 97111 22233', 'Verma Residences', '', 0.00)
    `, [passwordHash, passwordHash, passwordHash]);
    console.log('[Seeder] Users populated.');

    // -----------------------------------------------------------------
    // 2. Category Groups
    // -----------------------------------------------------------------
    const groupIdByKey = {};
    for (let i = 0; i < GROUPS.length; i++) {
        const g = GROUPS[i];
        const res = await db.query(
            `INSERT INTO category_groups (group_key, name, slug, icon, display_order) VALUES (?, ?, ?, ?, ?)`,
            [g.key, g.name, g.key, g.icon, i + 1]
        );
        groupIdByKey[g.key] = isSqlite ? res.insertId : (await db.queryOne(`SELECT id FROM category_groups WHERE group_key = ?`, [g.key])).id;
    }
    console.log('[Seeder] Category groups populated.');

    // -----------------------------------------------------------------
    // 3. Main categories + full facet taxonomy
    // -----------------------------------------------------------------
    // catIndex[mainSlug][groupKey][value] = category id  (used to tag products below)
    const catIndex = {};
    const mainCategoryId = {};

    let mainOrder = 1;
    for (const mainSlug of Object.keys(TAXONOMY)) {
        const main = TAXONOMY[mainSlug];
        const parentMainId = main.parentMain ? (mainCategoryId[main.parentMain] || null) : null;
        const mainRes = await db.query(`
            INSERT INTO categories (name, slug, parent_id, parent_main_id, group_id, category_type, description, image, banner_url, icon, seo_title, seo_description, status, display_order, featured)
            VALUES (?, ?, NULL, ?, NULL, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
        `, [
            main.name, mainSlug, parentMainId, main.category_type || 'tile', main.description, main.image, main.image, main.icon,
            `${main.name} | Meenakshi Build World`,
            `Shop ${main.name.toLowerCase()} online at Meenakshi Build World — premium quality, transparent pricing, pan-India delivery.`,
            mainOrder++, main.featured ? 1 : 0
        ]);
        const mainId = isSqlite ? mainRes.insertId : (await db.queryOne(`SELECT id FROM categories WHERE parent_id IS NULL AND slug = ?`, [mainSlug])).id;
        mainCategoryId[mainSlug] = mainId;
        catIndex[mainSlug] = {};

        const usedSlugs = new Set();

        for (const groupKey of Object.keys(main.groups)) {
            catIndex[mainSlug][groupKey] = {};
            const values = main.groups[groupKey];
            const mode = main.valueMode[groupKey]; // 'suffix' | 'bare' | 'literal' | 'composed'
            let order = 1;
            for (const value of values) {
                // displayName is what renders in filter chips / menu columns;
                // composedName is the full phrase used for SEO copy.
                let displayName, composedName;
                if (mode === 'suffix') {
                    // Values that already carry a full "… Tiles" name (e.g.
                    // "Feature Wall Tiles") are used literally — otherwise the
                    // composed name would read "Feature Wall Wall Tiles".
                    const literal = / Tiles$/i.test(value);
                    displayName = literal ? value : `${value} ${main.name}`;
                    composedName = displayName;
                }
                else if (mode === 'literal') { displayName = value; composedName = value; }
                else if (mode === 'composed') { displayName = bareValue(value, main.shortName); composedName = value; }
                else { displayName = value; composedName = `${value} ${main.name}`; } // 'bare'

                let slug = groupKey === 'size' ? slugifySize(value) : slugify(displayName);
                if (usedSlugs.has(slug)) slug = `${slug}-${groupKey}`;
                if (usedSlugs.has(slug)) slug = `${slug}-2`;
                usedSlugs.add(slug);

                const seoTitle = `${composedName} | Meenakshi Build World`;
                const seoDesc = `Shop ${composedName.toLowerCase()} online. Compare designs, sizes and prices at Meenakshi Build World.`;
                const description = `${composedName} — premium quality, competitively priced, ready for fast delivery.`;

                const res = await db.query(`
                    INSERT INTO categories (name, slug, parent_id, group_id, category_type, description, image, icon, seo_title, seo_description, status, display_order)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
                `, [
                    displayName, slug, mainId, groupIdByKey[groupKey], main.category_type || 'tile', description, pickImage(order), GROUPS.find(g => g.key === groupKey).icon,
                    seoTitle, seoDesc, order
                ]);
                const catId = isSqlite ? res.insertId : (await db.queryOne(`SELECT id FROM categories WHERE parent_id = ? AND slug = ?`, [mainId, slug])).id;
                // Products are authored against the bare source value in every
                // mode except 'suffix', where the source value itself (e.g.
                // "Bathroom") is the natural lookup key rather than the
                // composed display name ("Bathroom Floor Tiles").
                catIndex[mainSlug][groupKey][mode === 'suffix' ? value : displayName] = catId;
                order++;
            }
        }
    }
    console.log(`[Seeder] Full taxonomy populated across ${Object.keys(TAXONOMY).length} main categories.`);

    // -----------------------------------------------------------------
    // 4. Category attributes (technical spec sheet) — only meaningful for
    //    tile/cladding categories, not accessories or utility hardware.
    // -----------------------------------------------------------------
    const attributeIndex = {}; // attributeIndex[mainSlug][attrName] = { id, values: { value: id } }
    for (const mainSlug of Object.keys(TAXONOMY)) {
        attributeIndex[mainSlug] = {};
        const mainType = TAXONOMY[mainSlug].category_type || 'tile';
        if (mainType !== 'tile' && mainType !== 'cladding') continue;
        let order = 1;
        for (const def of ATTRIBUTE_DEFS) {
            const slug = slugify(def.name);
            const res = await db.query(`
                INSERT INTO category_attributes (category_id, name, slug, input_type, unit, display_order)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [mainCategoryId[mainSlug], def.name, slug, def.input_type, def.unit, order++]);
            const attrId = isSqlite ? res.insertId : (await db.queryOne(`SELECT id FROM category_attributes WHERE category_id = ? AND slug = ?`, [mainCategoryId[mainSlug], slug])).id;
            attributeIndex[mainSlug][def.name] = { id: attrId, values: {} };

            if (def.values) {
                let vOrder = 1;
                for (const v of def.values) {
                    const vRes = await db.query(`INSERT INTO attribute_values (attribute_id, value, display_order) VALUES (?, ?, ?)`, [attrId, v, vOrder++]);
                    const valId = isSqlite ? vRes.insertId : (await db.queryOne(`SELECT id FROM attribute_values WHERE attribute_id = ? AND value = ?`, [attrId, v])).id;
                    attributeIndex[mainSlug][def.name].values[v] = valId;
                }
            }
        }
    }
    console.log('[Seeder] Category spec attributes populated.');

    // Countertops carry their own spec fields (Material / Thickness) that the
    // generic tile/cladding ATTRIBUTE_DEFS do not cover.
    const COUNTERTOP_ATTR_DEFS = [
        { name: 'Material', values: ['Quartz', 'Granite', 'Marble', 'Engineered Stone', 'Solid Surface', 'Wood'] },
        { name: 'Thickness', values: ['15 mm', '20 mm', '25 mm', '30 mm', '40 mm'] }
    ];
    for (const mainSlug of ['kitchen-countertops']) {
        if (!TAXONOMY[mainSlug]) continue;
        const mainId = mainCategoryId[mainSlug];
        if (!mainId) continue;
        attributeIndex[mainSlug] = {};
        let order = 1;
        for (const def of COUNTERTOP_ATTR_DEFS) {
            const slug = slugify(def.name);
            const res = await db.query(`
                INSERT INTO category_attributes (category_id, name, slug, input_type, unit, display_order)
                VALUES (?, ?, ?, 'select', NULL, ?)
            `, [mainId, def.name, slug, order++]);
            const attrId = isSqlite ? res.insertId : (await db.queryOne(`SELECT id FROM category_attributes WHERE category_id = ? AND slug = ?`, [mainId, slug])).id;
            attributeIndex[mainSlug][def.name] = { id: attrId, values: {} };
            let vOrder = 1;
            for (const v of def.values) {
                await db.query(`INSERT INTO attribute_values (attribute_id, value, display_order) VALUES (?, ?, ?)`, [attrId, v, vOrder++]);
            }
        }
    }
    console.log('[Seeder] Countertop spec attributes populated.');

    // -----------------------------------------------------------------
    // 5. Brands
    // -----------------------------------------------------------------
    const BRANDS = [
        { name: 'Kajaria Eternity', slug: 'kajaria-eternity', featured: true },
        { name: 'Somany Grandeur', slug: 'somany-grandeur', featured: true },
        { name: 'Simpolo Vitrified', slug: 'simpolo-vitrified', featured: true },
        { name: 'Marazzi Italian Slabs', slug: 'marazzi-italian', featured: true },
        { name: 'Nitco Marble & Tiles', slug: 'nitco-tiles', featured: false },
        { name: 'Orientbell Horizon', slug: 'orientbell-horizon', featured: false }
    ];
    const brandIdBySlug = {};
    for (const b of BRANDS) {
        const res = await db.query(`
            INSERT INTO brands (name, slug, logo_url, banner_url, description, is_featured, seo_title, seo_description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [b.name, b.slug, pickImage(1), pickImage(2), `${b.name} — premium tile manufacturing partner of Meenakshi Build World.`, b.featured ? 1 : 0, `${b.name} | Meenakshi Build World`, `Shop ${b.name} tiles at Meenakshi Build World.`]);
        brandIdBySlug[b.slug] = isSqlite ? res.insertId : (await db.queryOne(`SELECT id FROM brands WHERE slug = ?`, [b.slug])).id;
    }

    // -----------------------------------------------------------------
    // 6. Collections
    // -----------------------------------------------------------------
    const COLLECTIONS = [
        { name: 'Italian Royal Marble Collection', slug: 'italian-royal-marble', featured: true },
        { name: 'Natural Wooden Planks', slug: 'natural-wooden-planks', featured: true },
        { name: 'Urban Concrete & Terrazzo', slug: 'urban-concrete-terrazzo', featured: true },
        { name: 'High-Traffic Outdoor & Deck Slabs', slug: 'outdoor-deck-slabs', featured: false }
    ];
    const collectionIdBySlug = {};
    for (const c of COLLECTIONS) {
        const res = await db.query(`
            INSERT INTO collections (name, slug, tagline, banner_url, description, is_featured)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [c.name, c.slug, 'Curated by Meenakshi Build World', pickImage(3), `${c.name} — a curated Meenakshi Build World collection.`, c.featured ? 1 : 0]);
        collectionIdBySlug[c.slug] = isSqlite ? res.insertId : (await db.queryOne(`SELECT id FROM collections WHERE slug = ?`, [c.slug])).id;
    }
    console.log('[Seeder] Brands & collections populated.');

    // -----------------------------------------------------------------
    // 7. Products (+ categories, images, variants, inventory, attributes, reviews)
    // -----------------------------------------------------------------
    const SKU_PREFIX = {
        'floor-tiles': 'FLR', 'wall-tiles': 'WAL', 'kitchen-tiles': 'KIT', 'bathroom-tiles': 'BTH',
        'living-room-tiles': 'LVR', 'outdoor-tiles': 'OUT', 'parking-tiles': 'PRK', 'ceramic-tiles': 'CER',
        'vitrified-tiles': 'VIT', 'other-tile-areas': 'OTA', 'stone-brick-cladding': 'CLD',
        'tile-accessories': 'ACC', 'home-utility-products': 'UTL', 'kitchen-countertops': 'CTP',
        'bedroom-tiles': 'BDR', 'hallway-tiles': 'HLW', 'pooja-room-tiles': 'POJ',
        'drawing-room-tiles': 'DRW', 'dining-room-tiles': 'DIN'
    };
    let skuCounter = 1000;
    let firstProductId = null;
    for (let i = 0; i < PRODUCTS.length; i++) {
        const p = PRODUCTS[i];
        const mainType = TAXONOMY[p.main].category_type || 'tile';
        // Floor/Wall products tag a "area" value; Kitchen/Bathroom/Living Room/
        // Outdoor/Parking/Ceramic/Vitrified/Other Areas/Cladding tag an
        // "application" value instead — whichever the product object carries.
        // Accessories/Utility products carry neither (just a "type").
        const primaryGroupKey = p.application !== undefined ? 'application' : (p.area !== undefined ? 'area' : null);
        const primaryGroupValue = primaryGroupKey ? p[primaryGroupKey] : null;

        const sku = `MBW-${SKU_PREFIX[p.main] || 'GEN'}-${skuCounter++}`;
        const slug = `${slugify(p.name)}-${sku.toLowerCase()}`;

        const descBits = [p.design && `${p.design} design`, p.finish && `${p.finish} finish`, p.size && `${p.size} size`].filter(Boolean).join(', ');
        const description = primaryGroupValue
            ? `${p.name} — ${descBits}. Ideal for ${primaryGroupValue.toLowerCase()} applications.`
            : `${p.name} — professional-grade ${p.type ? p.type.toLowerCase() : 'tiling'} product from Meenakshi Build World.`;
        const seoDesc = descBits
            ? `Buy ${p.name} online — ${descBits}. Premium quality at Meenakshi Build World.`
            : `Buy ${p.name} online at Meenakshi Build World. Premium quality, fast delivery.`;

        const pRes = await db.query(`
            INSERT INTO products (
                name, sku, slug, brand_id, collection_id, price, offer_price, dealer_price, stock,
                thickness_mm, coverage_sqft_per_box, weight_kg_per_box, pieces_per_box, description,
                is_featured, published, seo_title, seo_description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        `, [
            p.name, sku, slug, brandIdBySlug[p.brand] || null, p.collection ? collectionIdBySlug[p.collection] : null,
            p.price, p.offer_price || null, +(p.price * 0.85).toFixed(2), 120,
            9.0, 15.5, 28.0, 4, description,
            p.featured ? 1 : 0,
            `${p.name} | Meenakshi Build World`,
            seoDesc
        ]);
        const productId = isSqlite ? pRes.insertId : (await db.queryOne(`SELECT id FROM products WHERE slug = ?`, [slug])).id;
        if (firstProductId === null) firstProductId = productId;

        // Tag into the taxonomy: main category + one value per facet group the
        // product actually specifies (varies by category — e.g. accessories
        // only ever specify "type").
        const tagIds = [mainCategoryId[p.main]];
        for (const groupKey of Object.keys(catIndex[p.main])) {
            const val = p[groupKey];
            if (val !== undefined && catIndex[p.main][groupKey][val]) tagIds.push(catIndex[p.main][groupKey][val]);
        }
        for (const catId of tagIds.filter(Boolean)) {
            await db.query(`INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)`, [productId, catId]);
        }

        // Images
        await db.query(`INSERT INTO product_images (product_id, image_url, alt_text, is_primary, display_order) VALUES (?, ?, ?, 1, 0)`, [productId, pickImage(i), p.name]);
        await db.query(`INSERT INTO product_images (product_id, image_url, alt_text, is_primary, display_order) VALUES (?, ?, ?, 0, 1)`, [productId, pickImage(i + 3), `${p.name} — lifestyle`]);

        // Default variant + inventory
        const sizeCategoryId = (p.size && catIndex[p.main].size) ? (catIndex[p.main].size[p.size] || null) : null;
        const variantSku = `${sku}-V1`;
        const vRes = await db.query(`
            INSERT INTO product_variants (product_id, sku, size_category_id, price, offer_price, dealer_price, stock, thickness_mm, coverage_sqft_per_box, weight_kg_per_box, pieces_per_box, is_default, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')
        `, [productId, variantSku, sizeCategoryId, p.price, p.offer_price || null, +(p.price * 0.85).toFixed(2), 120, 9.0, 15.5, 28.0, 4]);
        const variantId = isSqlite ? vRes.insertId : (await db.queryOne(`SELECT id FROM product_variants WHERE sku = ?`, [variantSku])).id;
        await db.query(`INSERT INTO inventory (variant_id, quantity_boxes, reserved_boxes, reorder_level, warehouse_location) VALUES (?, ?, ?, ?, ?)`, [variantId, 120, 8, 20, 'Warehouse A - Bay 4']);

        // Spec attributes (Water Absorption / Slip Resistance / Warranty) —
        // only seeded for tile/cladding categories (see step 4 above).
        const attrs = attributeIndex[p.main];
        if (attrs && attrs['Water Absorption']) {
            const isOutdoorish = primaryGroupValue ? /outdoor|parking|pool|balcony|terrace|garden|pathway|elevation|shower|wet area|exterior/i.test(primaryGroupValue) : false;
            await db.query(`INSERT INTO product_attributes (product_id, attribute_id, custom_value) VALUES (?, ?, ?)`, [productId, attrs['Water Absorption'].id, isOutdoorish ? '< 0.08%' : '< 0.5%']);
            await db.query(`INSERT INTO product_attributes (product_id, attribute_id, attribute_value_id) VALUES (?, ?, ?)`, [productId, attrs['Slip Resistance (R Rating)'].id, attrs['Slip Resistance (R Rating)'].values[isOutdoorish ? 'R11' : 'R9']]);
            await db.query(`INSERT INTO product_attributes (product_id, attribute_id, attribute_value_id) VALUES (?, ?, ?)`, [productId, attrs['Warranty'].id, attrs['Warranty'].values['10 Years']]);
        }

        // Review
        await db.query(`
            INSERT INTO reviews (product_id, reviewer_name, rating, comment, is_verified_buyer)
            VALUES (?, 'Ananya Sharma (Architect)', 5, 'Excellent finish and consistent batch quality — used this on a client project and the result was outstanding.', 1)
        `, [productId]);
    }
    console.log(`[Seeder] ${PRODUCTS.length} products populated across ${Object.keys(TAXONOMY).length} main categories.`);

    // -----------------------------------------------------------------
    // 8. Blogs
    // -----------------------------------------------------------------
    await db.query(`
        INSERT INTO blogs (title, slug, category, banner_url, excerpt, content, read_time)
        VALUES
        ('Top 7 Tile Trends for Luxury Residences in 2026', 'top-7-tile-trends-luxury-residences-2026', 'Design Guide', ?, 'From statuario marble slabs to terrazzo accents, here are the tile trends defining premium Indian homes this year.', 'Full article content coming soon.', '6 min read'),
        ('How to Calculate Exact Tile Box Requirements & Avoid Wastage', 'calculate-exact-tile-box-requirements', 'Installation Guide', ?, 'A practical guide to measuring your space and ordering the right number of boxes — including wastage allowance.', 'Full article content coming soon.', '5 min read')
    `, [pickImage(4), pickImage(5)]);
    console.log('[Seeder] Blogs populated.');

    // -----------------------------------------------------------------
    // 9. Sample order (references the first seeded product)
    // -----------------------------------------------------------------
    const oRes = await db.query(`
        INSERT INTO orders (order_number, user_id, customer_name, customer_email, customer_phone, shipping_address, city, state, pincode, gstin, total_amount, gst_amount, net_payable, payment_status, payment_method, order_status, tracking_number)
        VALUES ('ORD-2026-98421', 3, 'Rahul Verma', 'customer@meenakshibuildworld.com', '+91 97111 22233', '14 Lakeview Residency, Anna Nagar', 'Chennai', 'Tamil Nadu', '600040', '', 28320, 4320, 28320, 'paid', 'UPI', 'Processing', 'MBWSHIP-882134')
    `);
    const orderId = isSqlite ? oRes.insertId : (await db.queryOne(`SELECT id FROM orders WHERE order_number = ?`, ['ORD-2026-98421'])).id;
    const firstProduct = await db.queryOne(`SELECT * FROM products WHERE id = ?`, [firstProductId]);
    await db.query(`
        INSERT INTO order_items (order_id, product_id, product_name, sku, price_per_box, quantity_boxes, total_sqft, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [orderId, firstProduct.id, firstProduct.name, firstProduct.sku, firstProduct.price, 12, 186, firstProduct.price * 12]);
    console.log('[Seeder] Sample order populated.');

    console.log('[Seeder] Database Seeding Completed Successfully!');
}

if (require.main === module) {
    seedDatabase()
        .then(() => process.exit(0))
        .catch(err => { console.error('[Seeder] Failed:', err); process.exit(1); });
}

module.exports = seedDatabase;
