// Usage: node scripts/create-admin.js <username> <password> [deped_email@deped.gov.ph]
const bcrypt = require('bcryptjs');
const db = require('../backend/config/db');
const { validatePasswordStrength } = require('../backend/utils/passwordPolicy');
require('dotenv').config();

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: node scripts/create-admin.js <username> <password> [email@deped.gov.ph]');
    process.exit(1);
  }
  const [username, password, emailArg] = args;
  const email = emailArg && emailArg.includes('@') ? emailArg.trim() : `${username}@deped.gov.ph`;

  const { ok, errors } = validatePasswordStrength(password);
  if (!ok) {
    console.error('Password policy:', errors.join('; '));
    process.exit(2);
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO admins (username, email, password, must_change_password) VALUES (?, ?, ?, 0)',
      [username, email, hash]
    );
    console.log('Admin created with id:', result.insertId, 'email:', email);
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err.message);
    process.exit(4);
  }
}

main();
