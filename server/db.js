const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

let pgPool = null;
let sqliteDb = null;
let mode = 'sqlite'; // 'pg' or 'sqlite'

// Check if PostgreSQL environment variables are configured
if (process.env.PGHOST || process.env.DATABASE_URL) {
    try {
        pgPool = new Pool({
            connectionString: process.env.DATABASE_URL || `postgres://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'tile_marketplace'}`
        });
        mode = 'pg';
        console.log('[Database] Connected to PostgreSQL Database');
    } catch (e) {
        console.warn('[Database] PostgreSQL connection failed, falling back to SQLite:', e.message);
    }
}

if (mode === 'sqlite') {
    const dbPath = path.join(__dirname, '../tile_marketplace.sqlite');
    sqliteDb = new sqlite3.Database(dbPath);
    // Enforce the ON DELETE CASCADE / SET NULL clauses declared in the schema
    // (e.g. deleting a category cascades to its children and product_categories
    // links) — SQLite ignores these by default unless foreign_keys is turned on.
    sqliteDb.run('PRAGMA foreign_keys = ON');
    console.log(`[Database] Initialized SQLite Database at ${dbPath}`);
}

// Universal Query Helper
async function query(sql, params = []) {
    if (mode === 'pg' && pgPool) {
        // Convert ? placeholders to $1, $2 for Postgres if needed
        let paramIndex = 1;
        const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
        const res = await pgPool.query(pgSql, params);
        return res.rows;
    } else {
        // SQLite Query execution
        return new Promise((resolve, reject) => {
            const trimmed = sql.trim().toUpperCase();
            if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA') || trimmed.startsWith('WITH')) {
                sqliteDb.all(sql, params, (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows || []);
                });
            } else {
                sqliteDb.run(sql, params, function (err) {
                    if (err) return reject(err);
                    resolve({ insertId: this.lastID, changes: this.changes });
                });
            }
        });
    }
}

// Single Row Helper
async function queryOne(sql, params = []) {
    const rows = await query(sql, params);
    return rows[0] || null;
}

// Execute Script (for schema init)
async function execScript(sqlScript) {
    if (mode === 'pg' && pgPool) {
        await pgPool.query(sqlScript);
    } else if (sqliteDb) {
        return new Promise((resolve, reject) => {
            sqliteDb.exec(sqlScript, (err) => {
                if (err) return reject(err);
                resolve(true);
            });
        });
    }
}

module.exports = {
    query,
    queryOne,
    execScript,
    getMode: () => mode
};
