const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /sitemap.xml - Dynamic XML Sitemap generator
router.get('/sitemap.xml', async (req, res) => {
    try {
        const baseUrl = req.protocol + '://' + req.get('host');
        const mainCategories = await db.query(`SELECT slug FROM categories WHERE parent_id IS NULL AND status = 'active'`);
        const facetCategories = await db.query(`
            SELECT c.slug, p.slug as parent_slug FROM categories c
            JOIN categories p ON c.parent_id = p.id
            WHERE c.status = 'active' AND p.status = 'active'
        `);
        const products = await db.query(`SELECT slug FROM products WHERE published = 1 OR published = true`);
        const brands = await db.query(`SELECT slug FROM brands`);
        const collections = await db.query(`SELECT slug FROM collections`);
        const blogs = await db.query(`SELECT slug FROM blogs`);

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        const staticPages = ['', '/shop', '/collections', '/brands', '/blogs', '/compare'];
        for (const page of staticPages) {
            xml += `  <url><loc>${baseUrl}${page}</loc><changefreq>daily</changefreq><priority>0.9</priority></url>\n`;
        }

        for (const c of mainCategories) xml += `  <url><loc>${baseUrl}/${c.slug}</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>\n`;
        for (const c of facetCategories) xml += `  <url><loc>${baseUrl}/${c.parent_slug}/${c.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
        for (const p of products) xml += `  <url><loc>${baseUrl}/product/${p.slug}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
        for (const b of brands) xml += `  <url><loc>${baseUrl}/brand/${b.slug}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>\n`;
        for (const col of collections) xml += `  <url><loc>${baseUrl}/collection/${col.slug}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>\n`;
        for (const bg of blogs) xml += `  <url><loc>${baseUrl}/blog/${bg.slug}</loc><changefreq>weekly</changefreq><priority>0.5</priority></url>\n`;

        xml += `</urlset>`;

        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (err) {
        res.status(500).send('Error generating sitemap');
    }
});

// GET /robots.txt
router.get('/robots.txt', (req, res) => {
    const baseUrl = req.protocol + '://' + req.get('host');
    res.header('Content-Type', 'text/plain');
    res.send(`User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`);
});

module.exports = router;
