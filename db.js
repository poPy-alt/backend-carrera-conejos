const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const db = {
  // Wrapper para emular db.run(query, params, cb)
  run: function (query, params, callback) {
    let index = 1;
    let pgQuery = query.replace(/\?/g, () => `$${index++}`);
    
    // Si es un INSERT, intentar capturar el ID para SQLite compatibility
    if (pgQuery.trim().toUpperCase().startsWith('INSERT')) {
      pgQuery += ' RETURNING id';
    }
    
    pool.query(pgQuery, params, (err, res) => {
      if (callback) {
        const context = { 
          changes: res ? res.rowCount : 0,
          lastID: (res && res.rows && res.rows.length > 0) ? res.rows[0].id : null
        };
        callback.call(context, err);
      }
    });
  },
  
  // Wrapper para emular db.get(query, params, cb)
  get: function (query, params, callback) {
    let index = 1;
    const pgQuery = query.replace(/\?/g, () => `$${index++}`);
    
    pool.query(pgQuery, params, (err, res) => {
      if (callback) {
        callback(err, res && res.rows.length > 0 ? res.rows[0] : null);
      }
    });
  },
  
  // Wrapper para emular db.all(query, params, cb)
  all: function (query, params, callback) {
    let index = 1;
    const pgQuery = query.replace(/\?/g, () => `$${index++}`);
    
    pool.query(pgQuery, params, (err, res) => {
      if (callback) {
        callback(err, res ? res.rows : []);
      }
    });
  }
};


// Inicializar tabla si no existe
const initDb = async () => {
  try {
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
    console.log('PostgreSQL (Supabase) tables verified/created.');
  } catch (err) {
    console.error('Error initializing Supabase database:', err.message);
  }
};

initDb();

module.exports = db;

