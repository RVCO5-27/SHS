// Usage: node scripts/create-admin.js <username> <password>
const bcrypt = require('bcryptjs');
const db = require('../backend/config/db');
require('dotenv').config();

const COMMON_PASSWORDS = [
  '123456','password','123456789','12345678','12345','111111','1234567','qwerty','abc123','password1','letmein'
];

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: node scripts/create-admin.js <username> <password>');
    process.exit(1);
  }
  const [username, password] = args;

  if (!password || password.length < 8) {
    console.error('Password too short — must be at least 8 characters');
    process.exit(2);
  }
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    console.error('Password is too common — choose a stronger password');
    process.exit(3);
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.execute('INSERT INTO admins (username, password) VALUES (?, ?)', [username, hash]);
    console.log('Admin created with id:', result.insertId);
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err.message);
    process.exit(4);
  }
}

main();
