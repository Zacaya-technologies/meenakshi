const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /sitemap.xml - Dynamic XML Sitemap generator
router.get('/sitemap.xml', async (req, res) => {
    try {
        const baseUrl = req.protocol + '://' + req.get('host');
        const mainCategories = await db.query(`SELECT slug FROM categories WHERE parent_id IS NULL AND status = 'active'`);
        // Only facet pages that actually list products (composite pages are an
        // AND of other tags, so they are never tagged directly — keep them).
        const facetCategories = await db.query(`
            SELECT c.slug, p.slug as parent_slug FROM categories c
            JOIN categories p ON c.parent_id = p.id
            WHERE c.status = 'active' AND p.status = 'active'
              AND (c.composite_filters IS NOT NULL
                   OR EXISTS (SELECT 1 FROM product_categories pc WHERE pc.category_id = c.id))
        `);
        const products = await db.query(`SELECT slug FROM products WHERE published = 1 OR published = true`);

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        // Only routes that exist (there are no /blogs, /brand/* or
        // /collection/* pages — those entries were 404s).
        const staticPages = ['', '/shop', '/all-tiles', '/collections', '/brands', '/calculator', '/about', '/contact'];
        for (const page of staticPages) {
            xml += `  <url><loc>${baseUrl}${page}</loc><changefreq>daily</changefreq><priority>0.9</priority></url>\n`;
        }

        for (const c of mainCategories) xml += `  <url><loc>${baseUrl}/tiles/${c.slug}</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>\n`;
        for (const c of facetCategories) xml += `  <url><loc>${baseUrl}/tiles/${c.parent_slug}/${c.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
        for (const p of products) xml += `  <url><loc>${baseUrl}/product/${p.slug}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;

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
