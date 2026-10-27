const { Pool } = require('pg');
const fs = require('node:fs/promises');
const path = require('node:path');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? {} : undefined, max: 10 });
async function initializeDatabase() { await pool.query(await fs.readFile(path.join(__dirname, 'database', 'schema.sql'), 'utf8')); }
module.exports = { pool, initializeDatabase };

