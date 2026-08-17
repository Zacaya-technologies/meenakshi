require('dotenv').config();

const app = require('./app');
const db = require('./db');
const seedDatabase = require('./seed');

const PORT = process.env.PORT || 3000;

// Auto Seed Check & Server Start
async function startServer() {
    try {
        // Quick check if users exist, else run seeder
        const userCheck = await db.queryOne(`SELECT COUNT(*) as count FROM users`).catch(() => null);
        if (!userCheck || parseInt(userCheck.count) === 0) {
            console.log('[Server] Database empty. Running initial database seeder...');
            await seedDatabase();
        }

        app.listen(PORT, () => {
            console.log(`=======================================================`);
            console.log(`🚀 MEENAKSHI BUILD WORLD MARKETPLACE SERVER RUNNING!`);
            console.log(`URL: http://localhost:${PORT}`);
            console.log(`Database Engine: ${db.getMode().toUpperCase()}`);
            console.log(`Admin Login: admin@meenakshibuildworld.com / Password123!`);
            console.log(`=======================================================`);
        });
    } catch (err) {
        console.error('[Server Error] Failed to start server:', err);
    }
}

startServer();
