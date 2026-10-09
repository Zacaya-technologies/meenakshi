-- Meenakshi Build World — database schema (SQLite)
--
-- Generated from the live tile_marketplace.sqlite so it matches what the
-- application actually uses. The tables are created/migrated by
-- server/seed.js and the server/migrate-*.js scripts; this file is a
-- reference copy. (The previous PostgreSQL schema here described an older
-- design and no longer matched the app.)

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
                group_id INTEGER REFERENCES category_groups(id) ON DELETE SET NULL,
                category_type TEXT,
                description TEXT,
                image TEXT,
                banner TEXT,
                icon TEXT,
                seo_title TEXT,
                seo_description TEXT,
                status TEXT DEFAULT 'active',
                display_order INTEGER DEFAULT 0,
                featured INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            , banner_url TEXT, parent_main_id INTEGER, composite_filters TEXT);

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

CREATE TABLE IF NOT EXISTS product_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
                UNIQUE(product_id, category_id)
            );

CREATE TABLE IF NOT EXISTS product_attributes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                attribute_id INTEGER REFERENCES category_attributes(id) ON DELETE CASCADE,
                attribute_value_id INTEGER REFERENCES attribute_values(id) ON DELETE SET NULL,
                custom_value TEXT
            );

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

CREATE TABLE IF NOT EXISTS business_settings (
            id INTEGER PRIMARY KEY,
            business_name TEXT,
            logo TEXT,
            tagline TEXT,
            description TEXT,
            corporate_address TEXT,
            store_address TEXT,
            primary_phone TEXT,
            secondary_phone TEXT,
            additional_phone TEXT,
            landline TEXT,
            email TEXT,
            whatsapp_number TEXT,
            google_maps_url TEXT,
            website_url TEXT,
            facebook_url TEXT,
            instagram_url TEXT,
            linkedin_url TEXT,
            youtube_url TEXT,
            business_hours TEXT,
            copyright_text TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        , twitter_url TEXT);

CREATE TABLE IF NOT EXISTS calculator_settings (
            id INTEGER PRIMARY KEY,
            enabled INTEGER DEFAULT 1,
            default_wastage REAL,
            max_wastage REAL,
            wastage_options TEXT,
            tile_size_presets TEXT,
            area_presets TEXT,
            enable_price INTEGER DEFAULT 1,
            enable_box INTEGER DEFAULT 1,
            enable_whatsapp INTEGER DEFAULT 1,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(category_type);

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_parent_slug ON categories(parent_id, slug);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

CREATE INDEX IF NOT EXISTS idx_categories_group ON categories(group_id);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

CREATE INDEX IF NOT EXISTS idx_pc_product ON product_categories(product_id);

CREATE INDEX IF NOT EXISTS idx_pc_category ON product_categories(category_id);

CREATE INDEX IF NOT EXISTS idx_pa_product ON product_attributes(product_id);

CREATE INDEX IF NOT EXISTS idx_pa_attribute ON product_attributes(attribute_id);

CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
