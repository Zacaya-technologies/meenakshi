const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Admin-managed accounts: dealers (and extra admins) can't self-register, so
// the admin console creates them and hands out the login credentials.
const ROLES = ['dealer', 'admin', 'customer'];
const PUBLIC_FIELDS = 'id, name, email, role, phone, company_name, gstin, credit_limit, created_at';

router.use(authenticateToken, requireRole('admin'));

// GET /api/v1/users?role=dealer
router.get('/', async (req, res) => {
    try {
        const { role } = req.query;
        const users = ROLES.includes(role)
            ? await db.query(`SELECT ${PUBLIC_FIELDS} FROM users WHERE role = ? ORDER BY id DESC`, [role])
            : await db.query(`SELECT ${PUBLIC_FIELDS} FROM users ORDER BY id DESC`);
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/v1/users
router.post('/', async (req, res) => {
    try {
        const { name, email, password, role = 'dealer', phone, company_name, gstin, credit_limit } = req.body || {};
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
        }
        if (String(password).length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
        }
        if (!ROLES.includes(role)) return res.status(400).json({ success: false, message: 'Invalid role.' });

        const cleanEmail = String(email).toLowerCase().trim();
        const existing = await db.queryOne(`SELECT id FROM users WHERE email = ?`, [cleanEmail]);
        if (existing) return res.status(400).json({ success: false, message: 'An account with this email already exists.' });

        const password_hash = await bcrypt.hash(String(password), 10);
        await db.query(`
            INSERT INTO users (name, email, password_hash, role, phone, company_name, gstin, credit_limit)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [name, cleanEmail, password_hash, role, phone || '', company_name || '', gstin || '', parseFloat(credit_limit) || 0]);
        const user = await db.queryOne(`SELECT ${PUBLIC_FIELDS} FROM users WHERE email = ?`, [cleanEmail]);
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/v1/users/:id  (password optional — set it to reset the login)
router.put('/:id', async (req, res) => {
    try {
        const existing = await db.queryOne(`SELECT id, role FROM users WHERE id = ?`, [req.params.id]);
        if (!existing) return res.status(404).json({ success: false, message: 'User not found.' });

        const { name, email, password, role, phone, company_name, gstin, credit_limit } = req.body || {};
        if (role !== undefined && !ROLES.includes(role)) return res.status(400).json({ success: false, message: 'Invalid role.' });
        if (String(existing.id) === String(req.user.id) && role && role !== 'admin') {
            return res.status(400).json({ success: false, message: 'You cannot remove your own admin access.' });
        }
        if (password && String(password).length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
        }
        let cleanEmail = null;
        if (email) {
            cleanEmail = String(email).toLowerCase().trim();
            const clash = await db.queryOne(`SELECT id FROM users WHERE email = ? AND id <> ?`, [cleanEmail, req.params.id]);
            if (clash) return res.status(400).json({ success: false, message: 'Another account already uses this email.' });
        }

        await db.query(`
            UPDATE users SET
                name = COALESCE(?, name), email = COALESCE(?, email), role = COALESCE(?, role),
                phone = COALESCE(?, phone), company_name = COALESCE(?, company_name), gstin = COALESCE(?, gstin),
                credit_limit = COALESCE(?, credit_limit)
            WHERE id = ?
        `, [
            name || null, cleanEmail, role || null, phone ?? null, company_name ?? null, gstin ?? null,
            credit_limit === undefined || credit_limit === '' ? null : parseFloat(credit_limit) || 0,
            req.params.id
        ]);

        if (password) {
            const password_hash = await bcrypt.hash(String(password), 10);
            await db.query(`UPDATE users SET password_hash = ? WHERE id = ?`, [password_hash, req.params.id]);
        }

        const user = await db.queryOne(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`, [req.params.id]);
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/v1/users/:id
router.delete('/:id', async (req, res) => {
    try {
        if (String(req.params.id) === String(req.user.id)) {
            return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
        }
        await db.query(`DELETE FROM users WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
