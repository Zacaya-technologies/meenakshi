const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');

const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const categoryGroupRoutes = require('./routes/categoryGroupRoutes');
const categoryAttributeRoutes = require('./routes/categoryAttributeRoutes');
const brandRoutes = require('./routes/brandRoutes');
const collectionRoutes = require('./routes/collectionRoutes');
const productRoutes = require('./routes/productRoutes');
const productVariantRoutes = require('./routes/productVariantRoutes');
const orderRoutes = require('./routes/orderRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');
const blogRoutes = require('./routes/blogRoutes');
const seoRoutes = require('./routes/seoRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/menu', menuRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/category-groups', categoryGroupRoutes);
app.use('/api/v1/category-attributes', categoryAttributeRoutes);
app.use('/api/v1/brands', brandRoutes);
app.use('/api/v1/collections', collectionRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/product-variants', productVariantRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/inquiries', inquiryRoutes);
app.use('/api/v1/blogs', blogRoutes);
app.use('/api/v1/admin', analyticsRoutes);
app.use('/', seoRoutes);

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Not found. This server is API-only — see /api/v1/*.' });
});

module.exports = app;
