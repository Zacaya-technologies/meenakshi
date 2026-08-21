const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { BUSINESS_DEFAULTS } = require('../../lib/businessDefaults');

// Editable business fields — anything an admin may update without touching code.
const FIELDS = [
    'business_name', 'logo', 'tagline', 'description',
    'corporate_address', 'store_address',
    'primary_phone', 'secondary_phone', 'additional_phone', 'landline',
    'email', 'whatsapp_number', 'google_maps_url', 'website_url',
    'facebook_url', 'instagram_url', 'twitter_url', 'linkedin_url', 'youtube_url',
    'business_hours', 'copyright_text'
];

async function ensureTable() {
    // TEXT/INTEGER are valid in both SQLite and PostgreSQL, so a single DDL
    // works across the two database modes this app supports.
    await db.execScript(`
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
    `);
    // Table may already exist from before twitter_url was added — patch it in.
    try {
        await db.execScript(`ALTER TABLE business_settings ADD COLUMN twitter_url TEXT;`);
    } catch (e) {
        // Column already exists — ignore.
    }
}

async function getSettings() {
    let row = null;
    try {
        row = await db.queryOne(`SELECT * FROM business_settings WHERE id = 1`);
    } catch (e) {
        row = null;
    }
    if (!row) {
        // First access seeds the single settings row with verified defaults.
        const cols = FIELDS.join(', ');
        const placeholders = FIELDS.map(() => '?').join(', ');
        await db.query(
            `INSERT OR IGNORE INTO business_settings (id, ${cols}) VALUES (1, ${placeholders})`,
            FIELDS.map(f => BUSINESS_DEFAULTS[f] || '')
        ).catch(async () => {
            // PostgreSQL has no INSERT OR IGNORE — plain insert, ignore dup errors.
            await db.query(
                `INSERT INTO business_settings (id, ${cols}) VALUES (1, ${placeholders})`,
                FIELDS.map(f => BUSINESS_DEFAULTS[f] || '')
            );
        });
        row = await db.queryOne(`SELECT * FROM business_settings WHERE id = 1`);
    }
    return { ...BUSINESS_DEFAULTS, ...row };
}

// GET /api/v1/business — public
router.get('/', async (req, res) => {
    try {
        await ensureTable();
        const settings = await getSettings();
        res.json({ success: true, business: settings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/v1/business — admin only
router.put('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        await ensureTable();
        const current = await getSettings();
        const updates = [];
        const params = [];
        for (const f of FIELDS) {
            if (req.body[f] !== undefined) {
                updates.push(`${f} = ?`);
                params.push(String(req.body[f] ?? ''));
            }
        }
        if (!updates.length) {
            return res.status(400).json({ success: false, message: 'No editable fields provided.' });
        }
        const exists = await db.queryOne(`SELECT id FROM business_settings WHERE id = 1`);
        if (!exists) {
            const cols = FIELDS.join(', ');
            const placeholders = FIELDS.map(() => '?').join(', ');
            await db.query(
                `INSERT INTO business_settings (id, ${cols}) VALUES (1, ${placeholders})`,
                FIELDS.map(f => String(req.body[f] ?? current[f] ?? ''))
            );
        } else {
            updates.push('updated_at = CURRENT_TIMESTAMP');
            await db.query(`UPDATE business_settings SET ${updates.join(', ')} WHERE id = 1`, params);
        }
        const settings = await getSettings();
        res.json({ success: true, message: 'Business information updated.', business: settings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
