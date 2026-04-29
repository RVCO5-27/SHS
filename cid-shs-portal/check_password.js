require('dotenv').config({ path: __dirname + '/backend/.env' });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function checkPassword() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'cid_shs_db'
    });
    
    const [rows] = await connection.execute('SELECT id, username, password FROM admins WHERE username = ?', ['admin_main']);
    
    if (rows.length === 0) {
        console.log('No user found');
        return;
    }
    
    const admin = rows[0];
    console.log('User found:', admin.username);
    console.log('Hash in DB:', admin.password);
    
    // Try the provided password
    const testPassword = '@D3pedSDO';
    const ok = await bcrypt.compare(testPassword, admin.password);
    console.log('Password "@D3pedSDO" matches:', ok);
    
    await connection.end();
}

checkPassword().catch(console.error);
