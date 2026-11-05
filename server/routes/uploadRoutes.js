const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Admin image uploads are stored in the database rather than on disk: the app
// is redeployed from GitHub (Hostinger) or runs on a read-only filesystem
// (Vercel), and in both cases files written to disk at runtime are lost, while
// the database persists. Next.js also only serves public/ files that existed at
// build time. Images are served back through GET /api/v1/uploads/<key>.<ext>.

const MIME_EXT = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif'
};
const MAX_BYTES = 6 * 1024 * 1024;

let tableReady = null;
function ensureTable() {
    if (!tableReady) {
        const mode = db.getMode();
        const idCol = mode === 'mysql' ? 'INT NOT NULL AUTO_INCREMENT PRIMARY KEY'
            : mode === 'pg' ? 'SERIAL PRIMARY KEY'
            : 'INTEGER PRIMARY KEY AUTOINCREMENT';
        const keyCol = mode === 'mysql' ? 'VARCHAR(64) NOT NULL UNIQUE' : 'TEXT NOT NULL UNIQUE';
        const dataCol = mode === 'mysql' ? 'LONGTEXT NOT NULL' : 'TEXT NOT NULL';
        const tsCol = mode === 'pg' ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP';
        tableReady = db.execScript(`
            CREATE TABLE IF NOT EXISTS media_uploads (
                id ${idCol},
                file_key ${keyCol},
                filename TEXT,
                mime_type TEXT NOT NULL,
                size_bytes INTEGER,
                data_base64 ${dataCol},
                created_at ${tsCol}
            );
        `).catch(err => { tableReady = null; throw err; });
    }
    return tableReady;
}

// POST /api/v1/uploads  { data: "data:image/webp;base64,...", filename } -> { url }
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { data, filename } = req.body || {};
        const match = typeof data === 'string' && data.match(/^data:([\w/+.-]+);base64,([A-Za-z0-9+/=\s]+)$/);
        if (!match) return res.status(400).json({ success: false, message: 'Send the image as a base64 data URL.' });

        const mime = match[1].toLowerCase();
        const ext = MIME_EXT[mime];
        if (!ext) return res.status(400).json({ success: false, message: 'Only JPG, PNG, WebP, GIF or AVIF images are allowed.' });

        const base64 = match[2].replace(/\s/g, '');
        const size = Buffer.byteLength(base64, 'base64');
        if (!size) return res.status(400).json({ success: false, message: 'The image is empty.' });
        if (size > MAX_BYTES) return res.status(413).json({ success: false, message: 'Image is larger than 6 MB.' });

        await ensureTable();
        const key = crypto.randomBytes(12).toString('hex');
        await db.query(
            `INSERT INTO media_uploads (file_key, filename, mime_type, size_bytes, data_base64) VALUES (?, ?, ?, ?, ?)`,
            [key, String(filename || '').slice(0, 200), mime, size, base64]
        );
        res.json({ success: true, url: `/api/v1/uploads/${key}.${ext}`, size });
    } catch (err) {
        console.error('Upload Error:', err);
        res.status(500).json({ success: false, message: 'Could not save the image.' });
    }
});

// GET /api/v1/uploads/<key>.<ext> - public image bytes
router.get('/:file', async (req, res) => {
    try {
        const key = String(req.params.file).replace(/\.[a-z0-9]+$/i, '');
        if (!/^[a-f0-9]{8,64}$/.test(key)) return res.status(404).end();
        await ensureTable();
        const row = await db.queryOne(`SELECT mime_type, data_base64 FROM media_uploads WHERE file_key = ?`, [key]);
        if (!row) return res.status(404).end();
        res.set('Content-Type', row.mime_type);
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.set('X-Content-Type-Options', 'nosniff');
        res.send(Buffer.from(row.data_base64, 'base64'));
    } catch (err) {
        console.error('Upload Read Error:', err);
        res.status(500).end();
    }
});

module.exports = router;
