const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /sitemap.xml - Dynamic XML Sitemap generator
router.get('/sitemap.xml', async (req, res) => {
    try {
        const baseUrl = req.protocol + '://' + req.get('host');
        const categories = await db.query(`SELECT slug FROM categories`);
        const products = await db.query(`SELECT slug FROM products WHERE published = 1 OR published = true`);
        const brands = await db.query(`SELECT slug FROM brands`);
        const collections = await db.query(`SELECT slug FROM collections`);
        const blogs = await db.query(`SELECT slug FROM blogs`);

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        // Static Pages
        const staticPages = ['', '/shop', '/collections', '/brands', '/visualizer', '/calculator', '/architect-zone', '/bulk-orders', '/blogs'];
        for (let page of staticPages) {
            xml += `  <url><loc>${baseUrl}${page}</loc><changefreq>daily</changefreq><priority>0.9</priority></url>\n`;
        }

        // Dynamic Routes
        for (let c of categories) xml += `  <url><loc>${baseUrl}/category/${c.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
        for (let p of products) xml += `  <url><loc>${baseUrl}/product/${p.slug}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
        for (let b of brands) xml += `  <url><loc>${baseUrl}/brand/${b.slug}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
        for (let col of collections) xml += `  <url><loc>${baseUrl}/collection/${col.slug}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
        for (let bg of blogs) xml += `  <url><loc>${baseUrl}/blog/${bg.slug}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>\n`;

        xml += `</urlset>`;

        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (err) {
        res.status(500).send('Error generating sitemap');
    }
});

module.exports = router;
