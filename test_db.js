const { Pool } = require('pg');
require('dotenv').config({ override: true });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('CONEXION EXITOSA:', res.rows[0]);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        games_played INTEGER DEFAULT 0,
        skin TEXT DEFAULT 'rabbit-base',
        stripe_color TEXT DEFAULT '#FF0000',
        scenario TEXT DEFAULT 'rabbits'
      )
    `);
    console.log('TABLAS CREADAS EN SUPABASE.');
    process.exit(0);
  } catch (err) {
    console.error('FALLO TOTAL EN LA CONEXIÓN:', err.message);
    process.exit(1);
  }
}

testConnection();
