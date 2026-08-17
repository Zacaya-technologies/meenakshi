const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');
const seedDatabase = require('./seed');

const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const brandRoutes = require('./routes/brandRoutes');
const collectionRoutes = require('./routes/collectionRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');
const blogRoutes = require('./routes/blogRoutes');
const seoRoutes = require('./routes/seoRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static frontend serving
app.use(express.static(path.join(__dirname, '../public')));

// Mount API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/menu', menuRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/brands', brandRoutes);
app.use('/api/v1/collections', collectionRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/inquiries', inquiryRoutes);
app.use('/api/v1/blogs', blogRoutes);
app.use('/', seoRoutes);

// SPA Routing Fallback (for clean client-side dynamic URLs like /product/slug, /category/slug)
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ success: false, message: 'API Endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Auto Seed Check & Server Start
async function startServer() {
    try {
        // Quick check if users exist, else run seeder
        const userCheck = await db.queryOne(`SELECT COUNT(*) as count FROM users`).catch(() => null);
        if (!userCheck || parseInt(userCheck.count) === 0) {
            console.log('[Server] Database empty. Running initial database seeder...');
            await seedDatabase();
        }

        app.listen(PORT, () => {
            console.log(`=======================================================`);
            console.log(`🚀 MEENAKSHI BUILD WORLD MARKETPLACE SERVER RUNNING!`);
            console.log(`URL: http://localhost:${PORT}`);
            console.log(`Database Engine: ${db.getMode().toUpperCase()}`);
            console.log(`Admin Login: admin@meenakshibuildworld.com / Password123!`);
            console.log(`=======================================================`);
        });
    } catch (err) {
        console.error('[Server Error] Failed to start server:', err);
    }
}

startServer();
