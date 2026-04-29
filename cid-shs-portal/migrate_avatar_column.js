const db = require('./backend/config/db');

async function migrateAvatarColumn() {
  try {
    console.log('Creating avatar_url column...');

    // Add to admins table
    try {
      await db.execute(`
        ALTER TABLE admins 
        ADD COLUMN avatar_url LONGTEXT DEFAULT NULL AFTER role
      `);
      console.log('✓ Added admins.avatar_url column');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ admins.avatar_url already exists');
      } else {
        throw err;
      }
    }

    // Add to users table (if exists)
    try {
      await db.execute(`
        ALTER TABLE users 
        ADD COLUMN avatar_url LONGTEXT DEFAULT NULL AFTER role
      `);
      console.log('✓ Added users.avatar_url column');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ users.avatar_url already exists');
      } else if (err.code === 'ER_NO_SUCH_TABLE') {
        console.log('ℹ users table does not exist (not using student users table)');
      } else {
        throw err;
      }
    }

    console.log('\nMigration complete! Avatar column is ready to store base64 images.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrateAvatarColumn();
