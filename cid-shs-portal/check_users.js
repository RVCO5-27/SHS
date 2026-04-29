require('dotenv').config({ path: __dirname + '/backend/.env' });
const mysql = require('mysql2/promise');

async function checkUsers() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'shs'
    });
    
    const [rows] = await connection.execute('SELECT id, username FROM admins LIMIT 5');
    console.log('Admins found:');
    rows.forEach(row => {
        console.log(`ID: ${row.id}, Username: ${row.username}, Password Changed: ${row.password_changed_at}`);
    });
    
    await connection.end();
}

checkUsers().catch(console.error);
