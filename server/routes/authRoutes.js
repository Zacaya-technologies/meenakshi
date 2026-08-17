const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const user = await db.queryOne(`SELECT * FROM users WHERE email = ?`, [email.toLowerCase().trim()]);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const tokenPayload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

        return res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                company_name: user.company_name,
                gstin: user.gstin,
                credit_limit: user.credit_limit
            }
        });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, role, company_name, gstin } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
        }

        const existing = await db.queryOne(`SELECT id FROM users WHERE email = ?`, [email.toLowerCase().trim()]);
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email already registered.' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        // Public self-registration can only ever create customer accounts — dealer/admin
        // accounts are provisioned separately (seeded, or created by an admin) so a
        // caller can't hand themselves elevated access by passing role in the body.
        const userRole = 'customer';

        const resDb = await db.query(`
            INSERT INTO users (name, email, password_hash, role, phone, company_name, gstin)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [name, email.toLowerCase().trim(), password_hash, userRole, phone || '', company_name || '', gstin || '']);

        const isSqlite = db.getMode() === 'sqlite';
        const userId = isSqlite ? resDb.insertId : (await db.queryOne(`SELECT id FROM users WHERE email = ?`, [email])).id;

        const tokenPayload = { id: userId, name, email, role: userRole };
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            token,
            user: { id: userId, name, email, role: userRole, company_name, gstin }
        });
    } catch (err) {
        console.error('Register Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// GET /api/v1/auth/me
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await db.queryOne(`SELECT id, name, email, role, phone, company_name, gstin, credit_limit, created_at FROM users WHERE id = ?`, [req.user.id]);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
