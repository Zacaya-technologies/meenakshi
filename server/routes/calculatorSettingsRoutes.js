const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { CALCULATOR_DEFAULTS } = require('../../lib/calculatorDefaults');

// Scalar fields stored as plain columns; JSON fields are stringified TEXT.
const SCALAR_FIELDS = ['enabled', 'default_wastage', 'max_wastage', 'enable_price', 'enable_box', 'enable_whatsapp'];
const JSON_FIELDS = ['wastage_options', 'tile_size_presets', 'area_presets'];
const ALL_FIELDS = [...SCALAR_FIELDS, ...JSON_FIELDS];

async function ensureTable() {
    await db.execScript(`
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
    `);
}

function serializeForDb(field, value) {
    if (JSON_FIELDS.includes(field)) return JSON.stringify(value);
    if (['enabled', 'enable_price', 'enable_box', 'enable_whatsapp'].includes(field)) return value ? 1 : 0;
    return value;
}

function deserializeRow(row) {
    const out = { ...row };
    for (const f of JSON_FIELDS) {
        if (typeof out[f] === 'string') {
            try { out[f] = JSON.parse(out[f]); } catch { out[f] = CALCULATOR_DEFAULTS[f]; }
        }
    }
    out.enabled = !!out.enabled;
    out.enable_price = !!out.enable_price;
    out.enable_box = !!out.enable_box;
    out.enable_whatsapp = !!out.enable_whatsapp;
    return out;
}

async function getSettings() {
    let row = null;
    try {
        row = await db.queryOne(`SELECT * FROM calculator_settings WHERE id = 1`);
    } catch (e) {
        row = null;
    }
    if (!row) {
        const cols = ALL_FIELDS.join(', ');
        const placeholders = ALL_FIELDS.map(() => '?').join(', ');
        const values = ALL_FIELDS.map(f => serializeForDb(f, CALCULATOR_DEFAULTS[f]));
        await db.query(
            `INSERT OR IGNORE INTO calculator_settings (id, ${cols}) VALUES (1, ${placeholders})`,
            values
        ).catch(async () => {
            await db.query(`INSERT INTO calculator_settings (id, ${cols}) VALUES (1, ${placeholders})`, values);
        });
        row = await db.queryOne(`SELECT * FROM calculator_settings WHERE id = 1`);
    }
    return { ...CALCULATOR_DEFAULTS, ...deserializeRow(row) };
}

// GET /api/v1/calculator-settings — public (the calculator page needs this)
router.get('/', async (req, res) => {
    try {
        await ensureTable();
        const settings = await getSettings();
        res.json({ success: true, settings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/v1/calculator-settings — admin only
router.put('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        await ensureTable();
        const current = await getSettings();
        const updates = [];
        const params = [];
        for (const f of ALL_FIELDS) {
            if (req.body[f] !== undefined) {
                updates.push(`${f} = ?`);
                params.push(serializeForDb(f, req.body[f]));
            }
        }
        if (!updates.length) {
            return res.status(400).json({ success: false, message: 'No editable fields provided.' });
        }
        const exists = await db.queryOne(`SELECT id FROM calculator_settings WHERE id = 1`);
        if (!exists) {
            const cols = ALL_FIELDS.join(', ');
            const placeholders = ALL_FIELDS.map(() => '?').join(', ');
            await db.query(
                `INSERT INTO calculator_settings (id, ${cols}) VALUES (1, ${placeholders})`,
                ALL_FIELDS.map(f => (req.body[f] !== undefined ? serializeForDb(f, req.body[f]) : serializeForDb(f, current[f])))
            );
        } else {
            updates.push('updated_at = CURRENT_TIMESTAMP');
            await db.query(`UPDATE calculator_settings SET ${updates.join(', ')} WHERE id = 1`, params);
        }
        const settings = await getSettings();
        res.json({ success: true, message: 'Calculator settings updated.', settings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
