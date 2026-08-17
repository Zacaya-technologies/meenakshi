const bcrypt = require('bcryptjs');
const db = require('./db');

async function seedDatabase() {
    console.log('[Seeder] Starting Enterprise Database Seeding...');

    // 1. Initialize Tables
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

            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                parent_id INTEGER,
                description TEXT,
                banner_url TEXT,
                thumbnail_url TEXT,
                icon_url TEXT,
                display_order INTEGER DEFAULT 0,
                is_featured INTEGER DEFAULT 0,
                in_mega_menu INTEGER DEFAULT 1,
                mega_menu_section TEXT DEFAULT 'category',
                status TEXT DEFAULT 'active',
                seo_title TEXT,
                seo_description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
                category_id INTEGER,
                sub_category_id INTEGER,
                brand_id INTEGER,
                collection_id INTEGER,
                series TEXT,
                price REAL NOT NULL,
                offer_price REAL,
                dealer_price REAL,
                gst_percentage REAL DEFAULT 18.0,
                stock INTEGER DEFAULT 100,
                material TEXT NOT NULL,
                finish TEXT NOT NULL,
                texture TEXT,
                pattern TEXT,
                color TEXT,
                shape TEXT DEFAULT 'Rectangular',
                tile_size TEXT NOT NULL,
                thickness_mm REAL DEFAULT 9.0,
                coverage_sqft_per_box REAL DEFAULT 15.5,
                coverage_sqmt_per_box REAL DEFAULT 1.44,
                weight_kg_per_box REAL DEFAULT 28.0,
                pieces_per_box INTEGER DEFAULT 4,
                room_application TEXT,
                description TEXT,
                specifications TEXT,
                installation_guide TEXT,
                warranty_years INTEGER DEFAULT 10,
                pdf_catalog_url TEXT,
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
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS product_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER,
                image_url TEXT NOT NULL,
                alt_text TEXT,
                is_primary INTEGER DEFAULT 0,
                display_order INTEGER DEFAULT 0
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
                order_id INTEGER,
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
                product_id INTEGER,
                reviewer_name TEXT NOT NULL,
                rating INTEGER,
                comment TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS inquiries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL, -- 'sample', 'bulk_quote', 'whatsapp'
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                email TEXT,
                product_id INTEGER,
                product_name TEXT,
                estimated_sqft REAL,
                message TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
    }

    // 2. Users
    const passwordHash = await bcrypt.hash('Password123!', 10);
    await db.query(`DELETE FROM users`);
    await db.query(`
        INSERT INTO users (name, email, password_hash, role, phone, company_name, gstin, credit_limit)
        VALUES 
        ('Master Admin', 'admin@meenakshibuildworld.com', ?, 'admin', '+91 98765 43210', 'Meenakshi Build World Pvt Ltd', '27AAACL1234H1Z5', 500000.00),
        ('Premio Dealers Pvt Ltd', 'dealer@meenakshibuildworld.com', ?, 'dealer', '+91 98123 45678', 'Premio Tile Mart', '27AABCU9632M1ZP', 250000.00),
        ('Rahul Verma', 'customer@meenakshibuildworld.com', ?, 'customer', '+91 97111 22233', 'Verma Residences', '', 0.00)
    `, [passwordHash, passwordHash, passwordHash]);
    console.log('[Seeder] Users populated.');

    // 3. Brands
    await db.query(`DELETE FROM brands`);
    const brandData = [
        { name: 'Kajaria Eternity', slug: 'kajaria-eternity', logo: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=300&q=80', desc: 'India’s No. 1 Tile Manufacturer with world-class Glazed Vitrified Slabs.', is_featured: 1 },
        { name: 'Somany Grandeur', slug: 'somany-grandeur', logo: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80', desc: 'Patented VC Shield technology for lifetime scratch resistance.', is_featured: 1 },
        { name: 'Simpolo Vitrified', slug: 'simpolo-vitrified', logo: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=300&q=80', desc: 'Pioneers of Seamless iMarmor large format porcelain marble slabs.', is_featured: 1 },
        { name: 'Marazzi Italian Slabs', slug: 'marazzi-italian', logo: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=300&q=80', desc: 'Authentic imported Italian porcelain stoneware.', is_featured: 1 },
        { name: 'Nitco Marble & Tiles', slug: 'nitco-tiles', logo: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=300&q=80', desc: 'Premium luxury floor tiles with natural stone veins.', is_featured: 0 },
        { name: 'Orientbell Horizon', slug: 'orientbell-horizon', logo: 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=300&q=80', desc: 'Germ-free and cool-tile technology for eco-conscious architecture.', is_featured: 0 }
    ];

    for (let b of brandData) {
        await db.query(`INSERT INTO brands (name, slug, logo_url, banner_url, description, is_featured) VALUES (?, ?, ?, ?, ?, ?)`,
            [b.name, b.slug, b.logo, b.logo, b.desc, b.is_featured]);
    }
    console.log('[Seeder] Brands populated.');

    // 4. Collections
    await db.query(`DELETE FROM collections`);
    const collectionData = [
        { name: 'Italian Royal Marble Collection', slug: 'italian-royal-marble', tagline: 'Opulent Slabs from Carrara & Statuario Mines', banner: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80', desc: 'Breathtaking large-format marble vitrified slabs with polished mirror glaze.', is_featured: 1 },
        { name: 'Natural Wooden Planks', slug: 'natural-wooden-planks', tagline: 'Warm Scandinavian Wood Grain Aesthetics', banner: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80', desc: 'Matte texture anti-skid porcelain wood tiles with true-to-life timber veins.', is_featured: 1 },
        { name: 'Urban Concrete & Terrazzo', slug: 'urban-concrete-terrazzo', tagline: 'Contemporary Industrial Chic', banner: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80', desc: 'Minimalist grey concrete and terrazzo speckled floor tiles for modern villas.', is_featured: 1 },
        { name: 'High-Traffic Outdoor & Deck Slabs', slug: 'outdoor-deck-slabs', tagline: 'Weather-Resistant 20mm Thick Pavers', banner: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80', desc: 'R11 Anti-skid vitrified pavers designed for swimming pool decks & parking.', is_featured: 0 }
    ];

    for (let c of collectionData) {
        await db.query(`INSERT INTO collections (name, slug, tagline, banner_url, description, is_featured) VALUES (?, ?, ?, ?, ?, ?)`,
            [c.name, c.slug, c.tagline, c.banner, c.desc, c.is_featured]);
    }
    console.log('[Seeder] Collections populated.');

    // 5. Categories — top-level product-type taxonomy ONLY.
    // Room, size, design, material, finish and colour are NOT categories — they are
    // product attributes, and the mega menu below derives them live from the products
    // table. This is what makes "no hardcoded categories/filters" actually true:
    // adding a category here is the only step needed for it to appear in nav, mega
    // menu, homepage, filters, search and breadcrumbs.
    await db.query(`DELETE FROM categories`);
    const categoryData = [
        { name: 'Floor Tiles', slug: 'floor-tiles', order: 1, desc: 'Vitrified and porcelain floor tiles engineered for heavy foot traffic', banner: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80' },
        { name: 'Wall Tiles', slug: 'wall-tiles', order: 2, desc: 'Glazed ceramic wall tiles with vibrant patterns and 3D elevation textures', banner: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80' },
        { name: 'Bathroom', slug: 'bathroom', order: 3, desc: 'Waterproof wall and anti-skid floor tile combinations for bathrooms', banner: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80' },
        { name: 'Kitchen', slug: 'kitchen', order: 4, desc: 'Stain-resistant backsplash and anti-skid kitchen floor tiles', banner: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80' },
        { name: 'Outdoor', slug: 'outdoor', order: 5, desc: 'Weather-resistant, UV-stable outdoor and garden tiles', banner: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80' },
        { name: 'Parking', slug: 'parking', order: 6, desc: 'Heavy-duty 20mm thick R11 anti-skid pavers rated for vehicle loads', banner: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1000&q=80' },
        { name: 'Elevation', slug: 'elevation', order: 7, desc: 'Natural stone textured wall elevation tiles for exterior facades', banner: 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1000&q=80' },
        { name: 'Marble', slug: 'marble', order: 8, desc: 'Natural and engineered marble slabs for flooring and cladding', banner: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80' },
        { name: 'Granite', slug: 'granite', order: 9, desc: 'Polished natural granite slabs for countertops, floors and facades', banner: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1000&q=80' },
        { name: 'Sanitaryware', slug: 'sanitaryware', order: 10, desc: 'Wash basins, water closets and complete bathroom sanitaryware', banner: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80' },
        { name: 'Bath Fittings', slug: 'bath-fittings', order: 11, desc: 'Faucets, showers and premium chrome bath fittings', banner: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80' }
    ];

    const categoryIdBySlug = {};
    for (let cat of categoryData) {
        const r = await db.query(`
            INSERT INTO categories (name, slug, mega_menu_section, description, banner_url, thumbnail_url, display_order, is_featured, in_mega_menu, seo_title, seo_description)
            VALUES (?, ?, 'category', ?, ?, ?, ?, 1, 1, ?, ?)
        `, [cat.name, cat.slug, cat.desc, cat.banner, cat.banner, cat.order, `${cat.name} | Meenakshi Build World`, cat.desc]);
        const row = isSqlite ? { id: r.insertId } : await db.queryOne(`SELECT id FROM categories WHERE slug = ?`, [cat.slug]);
        categoryIdBySlug[cat.slug] = row.id;
    }
    console.log('[Seeder] Categories populated (fully dynamic taxonomy).');

    // 6. Products
    await db.query(`DELETE FROM products`);
    await db.query(`DELETE FROM product_images`);

    const productsList = [
        {
            name: 'Statuary Veneto Italian High-Gloss Vitrified Slab',
            sku: 'LUXE-STAT-60120',
            slug: 'statuary-veneto-italian-vitrified-slab',
            category_id: categoryIdBySlug['floor-tiles'],
            brand_id: 1,    // Kajaria
            collection_id: 1, // Italian Royal Marble
            price: 145.00,
            offer_price: 118.00,
            dealer_price: 92.00,
            stock: 450,
            material: 'PGVT (Polished Glazed Vitrified)',
            finish: 'Hi Gloss',
            pattern: 'Marble',
            color: 'White & Gold Vein',
            tile_size: '600x1200 mm (2x4 ft)',
            thickness_mm: 9.5,
            coverage_sqft_per_box: 15.50,
            coverage_sqmt_per_box: 1.44,
            pieces_per_box: 2,
            weight_kg_per_box: 29.5,
            room_application: 'Living Room, Master Bedroom, Commercial Foyer',
            is_featured: 1,
            is_trending: 1,
            rating_avg: 4.9,
            reviews_count: 38,
            description: 'Crafted with high-definition digital inkjet technology, the Statuary Veneto replicates authentic Italian Statuario marble with radiant golden-grey veins. Engineered with zero water absorption and high stain resistance.',
            images: [
                'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80'
            ]
        },
        {
            name: 'Nordic Smoked Oak Timber Porcelain Plank',
            sku: 'LUXE-WOOD-20120',
            slug: 'nordic-smoked-oak-porcelain-plank',
            category_id: categoryIdBySlug['floor-tiles'],
            brand_id: 3,    // Simpolo
            collection_id: 2, // Natural Wooden Planks
            price: 110.00,
            offer_price: 89.00,
            dealer_price: 72.00,
            stock: 620,
            material: 'Full Body Porcelain',
            finish: 'Matte Rustic',
            pattern: 'Wood',
            color: 'Smoked Honey Brown',
            tile_size: '200x1200 mm (8x48 inches)',
            thickness_mm: 10.0,
            coverage_sqft_per_box: 12.91,
            coverage_sqmt_per_box: 1.20,
            pieces_per_box: 5,
            weight_kg_per_box: 26.0,
            room_application: 'Bedroom, Dining Room, Cafe, Study',
            is_featured: 1,
            is_trending: 1,
            rating_avg: 4.8,
            reviews_count: 24,
            description: 'Imbue your spaces with genuine Scandinavian timber warmth without wood maintenance hassle. Features micro-grooved matte anti-scratch technology.',
            images: [
                'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80'
            ]
        },
        {
            name: 'Nero Marquina Black Gold Polished Slab',
            sku: 'LUXE-MARQ-80160',
            slug: 'nero-marquina-black-gold-vitrified-slab',
            category_id: categoryIdBySlug['wall-tiles'],
            brand_id: 4,    // Marazzi Italian
            collection_id: 1, // Italian Royal Marble
            price: 220.00,
            offer_price: 185.00,
            dealer_price: 145.00,
            stock: 300,
            material: 'PGVT Double Charge',
            finish: 'Hi Gloss',
            pattern: 'Marble',
            color: 'Deep Onyx Black & Gold',
            tile_size: '800x1600 mm (2.6x5.2 ft)',
            thickness_mm: 11.0,
            coverage_sqft_per_box: 13.78,
            coverage_sqmt_per_box: 1.28,
            pieces_per_box: 1,
            weight_kg_per_box: 31.0,
            room_application: 'Living Room Feature Wall, Bathroom Accent, Hotel Lobby',
            is_featured: 1,
            is_trending: 1,
            rating_avg: 5.0,
            reviews_count: 19,
            description: 'A striking statement tile inspired by Basque country Nero Marquina marble. Deep dramatic obsidian tone with intense crisp white & copper streaks.',
            images: [
                'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80'
            ]
        },
        {
            name: 'Belgian Concrete Slate Grey Matte Tile',
            sku: 'LUXE-CONC-6060',
            slug: 'belgian-concrete-slate-grey-matte',
            category_id: categoryIdBySlug['kitchen'],
            brand_id: 2,    // Somany
            collection_id: 3, // Urban Concrete
            price: 85.00,
            offer_price: 68.00,
            dealer_price: 54.00,
            stock: 800,
            material: 'Vitrified Ceramic',
            finish: 'Matte',
            pattern: 'Concrete',
            color: 'Industrial Slate Grey',
            tile_size: '600x600 mm (2x2 ft)',
            thickness_mm: 9.0,
            coverage_sqft_per_box: 15.50,
            coverage_sqmt_per_box: 1.44,
            pieces_per_box: 4,
            weight_kg_per_box: 28.0,
            room_application: 'Kitchen Floor, Office Space, Balcony, Retail Store',
            is_featured: 0,
            is_trending: 1,
            rating_avg: 4.7,
            reviews_count: 15,
            description: 'Sophisticated industrial modern aesthetic with non-reflective matte grip. Perfect for modern open-concept kitchens and minimalist apartments.',
            images: [
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80'
            ]
        },
        {
            name: 'Aquamarine Artisan Emerald Subway Wall Tile',
            sku: 'LUXE-SUBW-3060',
            slug: 'aquamarine-artisan-emerald-subway-tile',
            category_id: categoryIdBySlug['bathroom'],
            brand_id: 5,    // Nitco
            collection_id: 3,
            price: 95.00,
            offer_price: 79.00,
            dealer_price: 62.00,
            stock: 500,
            material: 'Glazed Ceramic Wall',
            finish: 'Satin Gloss',
            pattern: 'Pattern / Subway',
            color: 'Deep Emerald Green',
            tile_size: '300x600 mm (1x2 ft)',
            thickness_mm: 8.5,
            coverage_sqft_per_box: 9.68,
            coverage_sqmt_per_box: 0.90,
            pieces_per_box: 5,
            weight_kg_per_box: 14.5,
            room_application: 'Bathroom Wall, Kitchen Backsplash, Bar Counter',
            is_featured: 1,
            is_trending: 0,
            rating_avg: 4.9,
            reviews_count: 29,
            description: 'Handcrafted look ceramic subway tile with undulating surface reflections and deep translucent emerald glaze.',
            images: [
                'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=800&q=80'
            ]
        },
        {
            name: 'Thermodyn 20mm Outdoor Pool Deck Paver R11 Anti-Skid',
            sku: 'LUXE-PAVE-6060-20',
            slug: 'thermodyn-outdoor-pool-deck-paver-anti-skid',
            category_id: categoryIdBySlug['outdoor'],
            brand_id: 1,    // Kajaria
            collection_id: 4, // Outdoor Deck Slabs
            price: 190.00,
            offer_price: 165.00,
            dealer_price: 130.00,
            stock: 250,
            material: 'Full Body Vitrified 20mm',
            finish: 'Anti Skid (R11)',
            pattern: 'Stone',
            color: 'Granite Charcoal',
            tile_size: '600x600 mm (2x2 ft)',
            thickness_mm: 20.0,
            coverage_sqft_per_box: 7.75,
            coverage_sqmt_per_box: 0.72,
            pieces_per_box: 2,
            weight_kg_per_box: 34.0,
            room_application: 'Swimming Pool Deck, Driveway, Garden Patio, Terrace',
            is_featured: 0,
            is_trending: 0,
            rating_avg: 4.8,
            reviews_count: 11,
            description: 'Extra thick 20mm porcelain structural paver engineered to withstand heavy vehicle loads, extreme frost, and UV exposure without fading.',
            images: [
                'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80'
            ]
        },
        {
            name: 'Heavy Load Charcoal 20mm Parking Paver Slab',
            sku: 'MBW-PARK-6060-20',
            slug: 'heavy-load-charcoal-parking-paver-slab',
            category_id: categoryIdBySlug['parking'],
            brand_id: 2, collection_id: 4,
            price: 175.00, offer_price: 152.00, dealer_price: 121.00, stock: 400,
            material: 'Full Body Vitrified 20mm', finish: 'Anti Skid', pattern: 'Stone', color: 'Charcoal Grey',
            tile_size: '600x600 mm (2x2 ft)', thickness_mm: 20.0, coverage_sqft_per_box: 7.75, coverage_sqmt_per_box: 0.72,
            pieces_per_box: 2, weight_kg_per_box: 33.5,
            room_application: 'Parking, Driveway, Loading Bay, Commercial Yard',
            is_featured: 1, is_trending: 0, rating_avg: 4.7, reviews_count: 9,
            description: 'Vehicle-rated 20mm structural paver engineered for continuous heavy-load parking areas, driveways and loading bays with zero surface abrasion.',
            images: ['https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80']
        },
        {
            name: 'Sandstone Beige Anti-Skid Parking Grip Tile',
            sku: 'MBW-PARK-3030-20',
            slug: 'sandstone-beige-anti-skid-parking-grip-tile',
            category_id: categoryIdBySlug['parking'],
            brand_id: 6, collection_id: 4,
            price: 92.00, offer_price: 78.00, dealer_price: 61.00, stock: 700,
            material: 'Full Body Vitrified', finish: 'Anti Skid', pattern: 'Stone', color: 'Sandstone Beige',
            tile_size: '300x300 mm (1x1 ft)', thickness_mm: 18.0, coverage_sqft_per_box: 9.68, coverage_sqmt_per_box: 0.90,
            pieces_per_box: 10, weight_kg_per_box: 22.0,
            room_application: 'Parking, Society Driveway, Ramp, Basement',
            is_featured: 0, is_trending: 1, rating_avg: 4.6, reviews_count: 14,
            description: 'Deep-grip R11 rated small-format parking tile with textured stone finish, ideal for ramps and sloped driveways requiring extra traction.',
            images: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80']
        },
        {
            name: 'Facade Grey Stone Elevation Cladding Tile',
            sku: 'MBW-ELEV-4060',
            slug: 'facade-grey-stone-elevation-cladding-tile',
            category_id: categoryIdBySlug['elevation'],
            brand_id: 5, collection_id: 3,
            price: 138.00, offer_price: 115.00, dealer_price: 90.00, stock: 320,
            material: 'Full Body Vitrified', finish: 'Rustic', pattern: 'Stone', color: 'Elevation Grey',
            tile_size: '400x600 mm', thickness_mm: 10.0, coverage_sqft_per_box: 8.6, coverage_sqmt_per_box: 0.80,
            pieces_per_box: 4, weight_kg_per_box: 24.0,
            room_application: 'Building Facade, Boundary Wall, Exterior Elevation',
            is_featured: 1, is_trending: 0, rating_avg: 4.8, reviews_count: 7,
            description: 'Rugged, split-face look exterior cladding tile that withstands direct weathering while giving villa and bungalow facades a natural stone character.',
            images: ['https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=800&q=80']
        },
        {
            name: 'Terracotta Brick Bond Elevation Panel',
            sku: 'MBW-ELEV-2040',
            slug: 'terracotta-brick-bond-elevation-panel',
            category_id: categoryIdBySlug['elevation'],
            brand_id: 6, collection_id: 3,
            price: 98.00, offer_price: 82.00, dealer_price: 64.00, stock: 260,
            material: 'Ceramic', finish: 'Matte', pattern: 'Brick', color: 'Terracotta Red',
            tile_size: '200x400 mm', thickness_mm: 9.0, coverage_sqft_per_box: 6.0, coverage_sqmt_per_box: 0.56,
            pieces_per_box: 8, weight_kg_per_box: 18.0,
            room_application: 'Building Facade, Feature Wall, Cafe Exterior',
            is_featured: 0, is_trending: 0, rating_avg: 4.5, reviews_count: 5,
            description: 'Warm brick-bond patterned elevation tile that recreates exposed terracotta brickwork without the weight or maintenance of real brick.',
            images: ['https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80']
        },
        {
            name: 'Carrara White Natural Marble Slab',
            sku: 'MBW-MARB-60120',
            slug: 'carrara-white-natural-marble-slab',
            category_id: categoryIdBySlug['marble'],
            brand_id: 4, collection_id: 1,
            price: 310.00, offer_price: 265.00, dealer_price: 210.00, stock: 150,
            material: 'Natural Marble', finish: 'Polished', pattern: 'Marble', color: 'Carrara White',
            tile_size: '600x1200 mm', thickness_mm: 18.0, coverage_sqft_per_box: 7.75, coverage_sqmt_per_box: 0.72,
            pieces_per_box: 1, weight_kg_per_box: 42.0,
            room_application: 'Living Room, Lobby, Staircase, Puja Room',
            is_featured: 1, is_trending: 1, rating_avg: 4.9, reviews_count: 21,
            description: 'Quarried natural Carrara marble with soft grey veining, hand-polished to a mirror gloss. A timeless choice for formal living rooms and lobbies.',
            images: [
                'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
            ]
        },
        {
            name: 'Makrana White Marble Flooring Slab',
            sku: 'MBW-MARB-60090',
            slug: 'makrana-white-marble-flooring-slab',
            category_id: categoryIdBySlug['marble'],
            brand_id: 5, collection_id: 1,
            price: 245.00, offer_price: 210.00, dealer_price: 168.00, stock: 180,
            material: 'Natural Marble', finish: 'Polished', pattern: 'Marble', color: 'Pure White',
            tile_size: '600x900 mm', thickness_mm: 18.0, coverage_sqft_per_box: 5.8, coverage_sqmt_per_box: 0.54,
            pieces_per_box: 1, weight_kg_per_box: 39.0,
            room_application: 'Puja Room, Temple, Living Room, Staircase',
            is_featured: 0, is_trending: 0, rating_avg: 4.8, reviews_count: 12,
            description: 'Classic Rajasthan Makrana marble prized for temple flooring and staircases, finished to a bright, luminous white polish.',
            images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80']
        },
        {
            name: 'Tan Brown Polished Granite Slab',
            sku: 'MBW-GRAN-60120',
            slug: 'tan-brown-polished-granite-slab',
            category_id: categoryIdBySlug['granite'],
            brand_id: 2, collection_id: 3,
            price: 195.00, offer_price: 168.00, dealer_price: 132.00, stock: 220,
            material: 'Natural Granite', finish: 'Polished', pattern: 'Granite', color: 'Tan Brown',
            tile_size: '600x1200 mm', thickness_mm: 18.0, coverage_sqft_per_box: 7.75, coverage_sqmt_per_box: 0.72,
            pieces_per_box: 1, weight_kg_per_box: 44.0,
            room_application: 'Kitchen Countertop, Flooring, Staircase',
            is_featured: 1, is_trending: 0, rating_avg: 4.7, reviews_count: 17,
            description: 'Dense, scratch-resistant natural granite with warm brown tones and dark speckling. Popular for kitchen countertops and high-traffic flooring.',
            images: ['https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80']
        },
        {
            name: 'Black Galaxy Granite Countertop Slab',
            sku: 'MBW-GRAN-60090',
            slug: 'black-galaxy-granite-countertop-slab',
            category_id: categoryIdBySlug['granite'],
            brand_id: 4, collection_id: 3,
            price: 260.00, offer_price: 225.00, dealer_price: 178.00, stock: 140,
            material: 'Natural Granite', finish: 'Polished', pattern: 'Granite', color: 'Black with Gold Fleck',
            tile_size: '600x900 mm', thickness_mm: 20.0, coverage_sqft_per_box: 5.8, coverage_sqmt_per_box: 0.54,
            pieces_per_box: 1, weight_kg_per_box: 47.0,
            room_application: 'Kitchen Countertop, Bar Counter, Vanity Top',
            is_featured: 1, is_trending: 1, rating_avg: 4.9, reviews_count: 23,
            description: 'Signature deep-black granite flecked with golden mineral crystals that shimmer under light. A statement choice for kitchen and bar countertops.',
            images: ['https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80']
        },
        {
            name: 'Aria Wall-Mounted Ceramic Wash Basin',
            sku: 'MBW-SANI-WB01',
            slug: 'aria-wall-mounted-ceramic-wash-basin',
            category_id: categoryIdBySlug['sanitaryware'],
            brand_id: 1, collection_id: null,
            price: 68.00, offer_price: 56.00, dealer_price: 44.00, stock: 340,
            material: 'Vitreous China Ceramic', finish: 'Glossy', pattern: 'Plain', color: 'Pure White',
            tile_size: 'Standard 550x420mm', thickness_mm: null, coverage_sqft_per_box: null, coverage_sqmt_per_box: null,
            pieces_per_box: 1, weight_kg_per_box: 11.0,
            room_application: 'Bathroom, Powder Room, Commercial Washroom',
            is_featured: 1, is_trending: 1, rating_avg: 4.7, reviews_count: 31,
            description: 'Compact wall-mounted vitreous china basin with a smooth glazed finish and integrated overflow, designed for modern and compact bathrooms.',
            images: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80']
        },
        {
            name: 'Nova Rimless Wall-Hung Water Closet',
            sku: 'MBW-SANI-WC01',
            slug: 'nova-rimless-wall-hung-water-closet',
            category_id: categoryIdBySlug['sanitaryware'],
            brand_id: 1, collection_id: null,
            price: 145.00, offer_price: 122.00, dealer_price: 96.00, stock: 210,
            material: 'Vitreous China Ceramic', finish: 'Glossy', pattern: 'Plain', color: 'Pure White',
            tile_size: 'Standard 360x520mm', thickness_mm: null, coverage_sqft_per_box: null, coverage_sqmt_per_box: null,
            pieces_per_box: 1, weight_kg_per_box: 24.0,
            room_application: 'Bathroom, Hotel Room, Commercial Washroom',
            is_featured: 1, is_trending: 0, rating_avg: 4.8, reviews_count: 18,
            description: 'Rimless flush technology water closet that reduces limescale buildup and simplifies cleaning, paired with a soft-close seat cover.',
            images: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80']
        },
        {
            name: 'Cascade Rain Shower Panel with Diverter',
            sku: 'MBW-BATH-SH01',
            slug: 'cascade-rain-shower-panel-with-diverter',
            category_id: categoryIdBySlug['bath-fittings'],
            brand_id: 3, collection_id: null,
            price: 92.00, offer_price: 76.00, dealer_price: 60.00, stock: 280,
            material: 'Chrome Plated Brass', finish: 'Polished', pattern: 'Plain', color: 'Chrome Silver',
            tile_size: '250mm Round Head', thickness_mm: null, coverage_sqft_per_box: null, coverage_sqmt_per_box: null,
            pieces_per_box: 1, weight_kg_per_box: 3.2,
            room_application: 'Bathroom, Master Suite, Hotel Bathroom',
            is_featured: 1, is_trending: 1, rating_avg: 4.6, reviews_count: 22,
            description: 'Solid brass overhead rain shower with a 3-way diverter for hand shower and body jets, finished in a tarnish-resistant mirror chrome.',
            images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80']
        },
        {
            name: 'Elgin Single-Lever Basin Mixer Faucet',
            sku: 'MBW-BATH-FC01',
            slug: 'elgin-single-lever-basin-mixer-faucet',
            category_id: categoryIdBySlug['bath-fittings'],
            brand_id: 2, collection_id: null,
            price: 48.00, offer_price: 39.00, dealer_price: 31.00, stock: 460,
            material: 'Chrome Plated Brass', finish: 'Polished', pattern: 'Plain', color: 'Chrome Silver',
            tile_size: 'Standard Deck-Mount', thickness_mm: null, coverage_sqft_per_box: null, coverage_sqmt_per_box: null,
            pieces_per_box: 1, weight_kg_per_box: 1.4,
            room_application: 'Bathroom, Kitchen, Powder Room',
            is_featured: 0, is_trending: 1, rating_avg: 4.5, reviews_count: 27,
            description: 'Ceramic-disc single-lever mixer faucet with a quarter-turn cartridge for smooth, drip-free temperature control.',
            images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80']
        },
        {
            name: 'Ivory Grip Anti-Skid Bathroom Floor Tile',
            sku: 'MBW-BATH-3030',
            slug: 'ivory-grip-anti-skid-bathroom-floor-tile',
            category_id: categoryIdBySlug['bathroom'],
            brand_id: 6, collection_id: null,
            price: 58.00, offer_price: 47.00, dealer_price: 37.00, stock: 640,
            material: 'Ceramic', finish: 'Anti Skid', pattern: 'Plain', color: 'Ivory',
            tile_size: '300x300 mm', thickness_mm: 8.0, coverage_sqft_per_box: 9.68, coverage_sqmt_per_box: 0.90,
            pieces_per_box: 10, weight_kg_per_box: 15.0,
            room_application: 'Bathroom, Utility Area, Wet Room',
            is_featured: 0, is_trending: 0, rating_avg: 4.6, reviews_count: 13,
            description: 'R10-rated anti-skid ceramic floor tile purpose-built for wet bathroom floors, balancing slip safety with an easy-clean glazed surface.',
            images: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80']
        },
        {
            name: 'Mosaic Blend Kitchen Backsplash Tile',
            sku: 'MBW-KITC-3030',
            slug: 'mosaic-blend-kitchen-backsplash-tile',
            category_id: categoryIdBySlug['kitchen'],
            brand_id: 5, collection_id: 3,
            price: 72.00, offer_price: 59.00, dealer_price: 46.00, stock: 380,
            material: 'Glazed Ceramic', finish: 'Glossy', pattern: 'Mosaic', color: 'Multi Blend Blue',
            tile_size: '300x300 mm', thickness_mm: 8.0, coverage_sqft_per_box: 9.68, coverage_sqmt_per_box: 0.90,
            pieces_per_box: 10, weight_kg_per_box: 16.0,
            room_application: 'Kitchen Backsplash, Bar Counter, Utility Wall',
            is_featured: 1, is_trending: 0, rating_avg: 4.7, reviews_count: 10,
            description: 'Hand-arranged mosaic-effect backsplash tile that adds a pop of colour behind kitchen counters, finished with an easy-wipe glaze.',
            images: ['https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80']
        },
        {
            name: 'Bianco Statuario Glossy Wall Tile',
            sku: 'MBW-WALL-3060',
            slug: 'bianco-statuario-glossy-wall-tile',
            category_id: categoryIdBySlug['wall-tiles'],
            brand_id: 1, collection_id: 1,
            price: 88.00, offer_price: 74.00, dealer_price: 58.00, stock: 520,
            material: 'Glazed Ceramic', finish: 'Glossy', pattern: 'Marble', color: 'White & Grey Vein',
            tile_size: '300x600 mm', thickness_mm: 8.5, coverage_sqft_per_box: 9.68, coverage_sqmt_per_box: 0.90,
            pieces_per_box: 5, weight_kg_per_box: 15.5,
            room_application: 'Living Room Wall, Bathroom Wall, Kitchen Wall',
            is_featured: 0, is_trending: 1, rating_avg: 4.7, reviews_count: 16,
            description: 'Marble-veined glossy wall tile that brings a Statuario-inspired backdrop to feature walls without the cost of natural stone.',
            images: ['https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80']
        },
        {
            name: 'Golden Sand Outdoor Textured Deck Tile',
            sku: 'MBW-OUT-4040',
            slug: 'golden-sand-outdoor-textured-deck-tile',
            category_id: categoryIdBySlug['outdoor'],
            brand_id: 6, collection_id: 4,
            price: 78.00, offer_price: 64.00, dealer_price: 50.00, stock: 300,
            material: 'Full Body Vitrified', finish: 'Anti Skid', pattern: 'Stone', color: 'Golden Sand',
            tile_size: '400x400 mm', thickness_mm: 12.0, coverage_sqft_per_box: 8.6, coverage_sqmt_per_box: 0.80,
            pieces_per_box: 6, weight_kg_per_box: 20.0,
            room_application: 'Garden, Terrace, Balcony, Pool Deck',
            is_featured: 0, is_trending: 0, rating_avg: 4.6, reviews_count: 8,
            description: 'UV-stable textured deck tile in a warm sand tone, formulated to resist fading and stay cool underfoot on sun-exposed terraces.',
            images: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80']
        }
    ];

    for (let p of productsList) {
        const specs = JSON.stringify({
            "Water Absorption": "< 0.05%",
            "Modulus of Rupture": "> 45 N/mm²",
            "Scratch Hardness": "7 Mohs",
            "Chemical Resistance": "Resistant to acids & alkalis",
            "Frost Resistance": "100% Frost Proof",
            "Thermal Shock": "Passes ISO 10545-9"
        });

        const res = await db.query(`
            INSERT INTO products 
            (name, sku, slug, category_id, brand_id, collection_id, price, offer_price, dealer_price, stock, material, finish, pattern, color, tile_size, thickness_mm, coverage_sqft_per_box, coverage_sqmt_per_box, pieces_per_box, weight_kg_per_box, room_application, is_featured, is_trending, rating_avg, reviews_count, description, specifications, published)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [
            p.name, p.sku, p.slug, p.category_id, p.brand_id, p.collection_id,
            p.price, p.offer_price, p.dealer_price, p.stock, p.material, p.finish,
            p.pattern, p.color, p.tile_size, p.thickness_mm, p.coverage_sqft_per_box,
            p.coverage_sqmt_per_box, p.pieces_per_box, p.weight_kg_per_box,
            p.room_application, p.is_featured, p.is_trending, p.rating_avg, p.reviews_count,
            p.description, specs
        ]);

        const productId = isSqlite ? res.insertId : (await db.queryOne(`SELECT id FROM products WHERE slug = ?`, [p.slug])).id;

        // Primary & Secondary Images
        for (let i = 0; i < p.images.length; i++) {
            await db.query(`
                INSERT INTO product_images (product_id, image_url, alt_text, is_primary, display_order)
                VALUES (?, ?, ?, ?, ?)
            `, [productId, p.images[i], `${p.name} view ${i+1}`, i === 0 ? 1 : 0, i]);
        }

        // Default Reviews
        await db.query(`
            INSERT INTO reviews (product_id, reviewer_name, rating, comment)
            VALUES (?, 'Ananya Sharma (Architect)', 5, 'Exceptional gloss reflection and true Statuario veins. Installed across 4,000 sq ft luxury penthouse in South Mumbai.')
        `, [productId]);
    }
    console.log('[Seeder] Products & Images populated.');

    // 7. Blogs
    await db.query(`DELETE FROM blogs`);
    const blogList = [
        {
            title: 'Top 7 Tile Trends for Luxury Residences in 2026',
            slug: 'top-7-tile-trends-luxury-residences-2026',
            category: 'Design Guide',
            banner: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80',
            excerpt: 'From bookmatched Statuario Italian porcelain slabs to organic terracotta tactile matte finishes, explore what world-class interior architects are selecting.',
            content: 'Tile design is shifting toward seamless, monolithic surfaces. Large format vitrified slabs (1200x2400mm) eliminate grout lines, creating a unified marble expanse...'
        },
        {
            title: 'How to Calculate Exact Tile Box Requirements & Avoid Wastage',
            slug: 'calculate-exact-tile-box-requirements',
            category: 'Installation Guide',
            banner: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
            excerpt: 'A comprehensive step-by-step formula for architects and homeowners to measure room square footage, door cutouts, and 10% cutting wastage allowances.',
            content: 'When planning a floor tiling project, measuring net floor area is only the first step. Depending on diagonal layout orientation, cutting wastage ranges between 8% to 15%...'
        }
    ];

    for (let b of blogList) {
        await db.query(`
            INSERT INTO blogs (title, slug, category, banner_url, excerpt, content)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [b.title, b.slug, b.category, b.banner, b.excerpt, b.content]);
    }
    console.log('[Seeder] Blogs populated.');

    // 8. Orders
    await db.query(`DELETE FROM orders`);
    await db.query(`DELETE FROM order_items`);

    const orderRes = await db.query(`
        INSERT INTO orders (order_number, user_id, customer_name, customer_email, customer_phone, shipping_address, city, state, pincode, total_amount, gst_amount, net_payable, payment_status, payment_method, order_status, tracking_number)
        VALUES ('ORD-2026-98421', 3, 'Rahul Verma', 'customer@meenakshibuildworld.com', '+91 97111 22233', 'Villa 42, Palm Meadows, Whitefield', 'Bengaluru', 'Karnataka', '560066', 35400.00, 6372.00, 41772.00, 'paid', 'UPI', 'Processing', 'TRK-IN-908123')
    `);

    const orderId = isSqlite ? orderRes.insertId : 1;
    await db.query(`
        INSERT INTO order_items (order_id, product_id, product_name, sku, price_per_box, quantity_boxes, total_sqft, subtotal)
        VALUES (?, 1, 'Statuary Veneto Italian High-Gloss Vitrified Slab', 'LUXE-STAT-60120', 1829.00, 20, 310.00, 36580.00)
    `, [orderId]);

    console.log('[Seeder] Test Orders populated.');
    console.log('[Seeder] Database Seeding Completed Successfully!');
}

if (require.main === module) {
    seedDatabase().then(() => process.exit(0)).catch(err => {
        console.error('[Seeder Error]', err);
        process.exit(1);
    });
}

module.exports = seedDatabase;
