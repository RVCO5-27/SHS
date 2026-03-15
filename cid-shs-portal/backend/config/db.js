const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'cid_shs_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
    .then(conn => {
        conn.release();
        console.log('Successfully connected to cid_shs_db (pool)');
    })
    .catch(err => {
        console.error('MySQL pool connection error (continuing):', err.message);
    });

// attach a close helper to allow tests or other callers to gracefully end the pool
pool.close = async function() {
    try {
        await pool.end();
        console.log('MySQL pool closed');
    } catch (err) {
        console.error('Error closing MySQL pool:', err && err.message);
    }
};

module.exports = pool;
