
const db = require('./backend/config/db');

async function migrate() {
  try {
    console.log('Adding avatar_url column to admins and users tables...');
    
    // Add avatar_url to admins
    try {
      await db.execute("ALTER TABLE admins ADD COLUMN avatar_url VARCHAR(255) DEFAULT NULL AFTER role");
      console.log('Added avatar_url column to admins.');
    } catch (e) {
      console.log('avatar_url column might already exist in admins:', e.message);
    }

    // Add avatar_url to users
    try {
      await db.execute("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) DEFAULT NULL AFTER role");
      console.log('Added avatar_url column to users.');
    } catch (e) {
      console.log('avatar_url column might already exist in users:', e.message);
    }

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
