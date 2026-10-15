const fs = require('fs');
const path = require('path');

let pgPool = null;
let mysqlPool = null;
let sqliteDb = null;
let mode = 'sqlite'; // 'mysql', 'pg' or 'sqlite'

// MySQL / MariaDB (e.g. Hostinger): set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
// (and optionally DB_PORT), or MYSQL_URL / DATABASE_URL as mysql://user:pass@host:port/db.
// Load the data with database/meenakshi_mysql.sql (scripts/export_mysql.py).
const mysqlUrl = process.env.MYSQL_URL || (/^mysql:\/\//i.test(process.env.DATABASE_URL || '') ? process.env.DATABASE_URL : '');
if (mysqlUrl || process.env.DB_HOST || process.env.DB_NAME) {
    try {
        const mysql = require('mysql2/promise');
        mysqlPool = mysql.createPool({
            ...(mysqlUrl ? { uri: mysqlUrl } : {
                host: process.env.DB_HOST || 'localhost',
                port: Number(process.env.DB_PORT) || 3306,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME
            }),
            charset: 'utf8mb4',
            connectionLimit: Number(process.env.DB_POOL_SIZE) || 10,
            waitForConnections: true,
            multipleStatements: true,   // execScript runs multi-statement DDL
            dateStrings: true,          // DATETIME as 'YYYY-MM-DD HH:MM:SS', same as SQLite
            decimalNumbers: true        // SUM()/AVG() as numbers, not strings
        });
        // Match SQLite's lenient behaviour: no ONLY_FULL_GROUP_BY / strict mode.
        mysqlPool.pool.on('connection', conn => {
            conn.query("SET SESSION sql_mode = 'NO_ENGINE_SUBSTITUTION'");
        });
        mode = 'mysql';
        console.log('[Database] Using MySQL Database');
    } catch (e) {
        console.warn('[Database] MySQL setup failed, falling back to SQLite:', e.message);
    }
}

// Check if PostgreSQL environment variables are configured
if (mode === 'sqlite' && (process.env.PGHOST || process.env.DATABASE_URL)) {
    try {
        const { Pool } = require('pg');
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
    const sqlite3 = require('sqlite3').verbose();
    // Resolve the DB file robustly across runtimes: locally it lives next to
    // the server dir; in a serverless bundle (Vercel) the traced copy ships at
    // the function root. Try several candidate locations.
    const candidates = [
        path.join(process.cwd(), 'tile_marketplace.sqlite'),
        path.join(__dirname, '../tile_marketplace.sqlite'),
        path.join(__dirname, 'tile_marketplace.sqlite')
    ];
    const dbPath = candidates.find(p => fs.existsSync(p)) || candidates[0];
    sqliteDb = new sqlite3.Database(dbPath);
    // Enforce the ON DELETE CASCADE / SET NULL clauses declared in the schema
    // (e.g. deleting a category cascades to its children and product_categories
    // links) — SQLite ignores these by default unless foreign_keys is turned on.
    sqliteDb.run('PRAGMA foreign_keys = ON');
    console.log(`[Database] Initialized SQLite Database at ${dbPath}`);
}

// SQLite-only syntax used by the routes, rewritten for MySQL.
function toMysql(sql) {
    return sql.replace(/\bINSERT\s+OR\s+IGNORE\b/gi, 'INSERT IGNORE');
}

// Universal Query Helper
async function query(sql, params = []) {
    if (mode === 'mysql') {
        // query() (not execute()) so undefined params become NULL like SQLite.
        const [result] = await mysqlPool.query(toMysql(sql), params);
        if (Array.isArray(result)) return result;
        return { insertId: result.insertId, changes: result.affectedRows };
    } else if (mode === 'pg' && pgPool) {
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
    if (mode === 'mysql') {
        await mysqlPool.query(toMysql(sqlScript));
    } else if (mode === 'pg' && pgPool) {
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
