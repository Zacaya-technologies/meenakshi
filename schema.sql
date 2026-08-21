-- PostgreSQL Schema for Meenakshi Build World Enterprise Marketplace

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'dealer', 'admin')),
    phone VARCHAR(50),
    company_name VARCHAR(255),
    gstin VARCHAR(50),
    credit_limit DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    parent_id INT REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT,
    banner_url TEXT,
    thumbnail_url TEXT,
    icon_url TEXT,
    display_order INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    in_mega_menu BOOLEAN DEFAULT TRUE,
    mega_menu_section VARCHAR(100) DEFAULT 'category',
    status VARCHAR(50) DEFAULT 'active',
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sub_categories (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    logo_url TEXT,
    banner_url TEXT,
    description TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS collections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    tagline VARCHAR(255),
    banner_url TEXT,
    description TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    sub_category_id INT REFERENCES sub_categories(id) ON DELETE SET NULL,
    brand_id INT REFERENCES brands(id) ON DELETE SET NULL,
    collection_id INT REFERENCES collections(id) ON DELETE SET NULL,
    series VARCHAR(100),
    price DECIMAL(10,2) NOT NULL,
    offer_price DECIMAL(10,2),
    dealer_price DECIMAL(10,2),
    gst_percentage DECIMAL(5,2) DEFAULT 18.00,
    stock INT DEFAULT 100,
    material VARCHAR(100) NOT NULL, -- Vitrified, Porcelain, Ceramic, GVT, PGVT, Full Body, Double Charge
    finish VARCHAR(100) NOT NULL,   -- Glossy, Matte, Rustic, Satin, Hi Gloss, Polished, Lappato, Anti Skid
    texture VARCHAR(100),
    pattern VARCHAR(100),           -- Marble, Stone, Wood, Concrete, Terrazzo, Floral, Geometric, Mosaic, Subway
    color VARCHAR(100),
    shape VARCHAR(100) DEFAULT 'Rectangular',
    tile_size VARCHAR(100) NOT NULL, -- 300x300, 600x600, 600x1200, 800x1600, 1200x1800
    thickness_mm DECIMAL(5,2) DEFAULT 9.0,
    coverage_sqft_per_box DECIMAL(8,2) DEFAULT 15.5,
    coverage_sqmt_per_box DECIMAL(8,2) DEFAULT 1.44,
    weight_kg_per_box DECIMAL(8,2) DEFAULT 28.0,
    pieces_per_box INT DEFAULT 4,
    room_application VARCHAR(255),  -- Living Room, Bedroom, Kitchen, Bathroom, Outdoor, Commercial
    description TEXT,
    specifications JSONB,
    installation_guide TEXT,
    warranty_years INT DEFAULT 10,
    pdf_catalog_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    is_trending BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    published BOOLEAN DEFAULT TRUE,
    views_count INT DEFAULT 0,
    rating_avg DECIMAL(3,2) DEFAULT 4.8,
    reviews_count INT DEFAULT 12,
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_videos (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    title VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS specifications (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    spec_key VARCHAR(100) NOT NULL,
    spec_value VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    product_id INT UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    quantity_boxes INT DEFAULT 100,
    reserved_boxes INT DEFAULT 0,
    reorder_level INT DEFAULT 20,
    warehouse_location VARCHAR(100) DEFAULT 'Warehouse A - Bay 4',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    shipping_address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    gstin VARCHAR(50),
    total_amount DECIMAL(12,2) NOT NULL,
    gst_amount DECIMAL(12,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    net_payable DECIMAL(12,2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, refunded
    payment_method VARCHAR(50) DEFAULT 'UPI',     -- UPI, Credit Card, Netbanking, COD, Dealer Credit
    order_status VARCHAR(50) DEFAULT 'Processing', -- Pending, Processing, Shipped, Delivered, Cancelled
    tracking_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    price_per_box DECIMAL(10,2) NOT NULL,
    quantity_boxes INT NOT NULL,
    total_sqft DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    gst_number VARCHAR(50),
    shipping_addresses JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    reviewer_name VARCHAR(255) NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_verified_buyer BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percent DECIMAL(5,2),
    discount_amount DECIMAL(10,2),
    min_order_value DECIMAL(10,2) DEFAULT 0.00,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS cms_pages (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT,
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menus (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    url VARCHAR(255) NOT NULL,
    parent_id INT DEFAULT 0,
    section VARCHAR(100) DEFAULT 'top',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS blogs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    author VARCHAR(255) DEFAULT 'Meenakshi Editorial Desk',
    category VARCHAR(100) DEFAULT 'Design & Trends',
    banner_url TEXT,
    excerpt TEXT,
    content TEXT,
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_time VARCHAR(50) DEFAULT '5 min read'
);

CREATE TABLE IF NOT EXISTS seo (
    id SERIAL PRIMARY KEY,
    page_type VARCHAR(50) NOT NULL, -- page, product, category, brand, collection
    ref_id INT DEFAULT 0,
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    og_image TEXT
);

CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT
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
    twitter_url TEXT,
    linkedin_url TEXT,
    youtube_url TEXT,
    business_hours TEXT,
    copyright_text TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR MAXIMUM ENTERPRISE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_collection ON products(collection_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
