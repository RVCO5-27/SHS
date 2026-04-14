
const db = require('./backend/config/db');

async function syncAdmins() {
  try {
    // 1. Get all admin users from 'users' table
    const [users] = await db.execute('SELECT username, email, password FROM users WHERE role = "admin"');
    console.log(`Found ${users.length} admin users in 'users' table.`);

    for (const user of users) {
      // 2. Check if they already exist in 'admins' table
      const [existing] = await db.execute('SELECT id FROM admins WHERE username = ?', [user.username]);
      
      if (existing.length === 0) {
        // 3. Insert into 'admins' table
        // Mapping role 'admin' from 'users' to 'SuperAdmin' in 'admins'
        await db.execute(
          'INSERT INTO admins (username, password, full_name, role) VALUES (?, ?, ?, "SuperAdmin")',
          [user.username, user.password, user.username]
        );
        console.log(`Synced user '${user.username}' to 'admins' table as SuperAdmin.`);
      } else {
        console.log(`User '${user.username}' already exists in 'admins' table. Skipping.`);
      }
    }

    console.log('Sync complete.');
    process.exit(0);
  } catch (err) {
    console.error('Sync failed:', err);
    process.exit(1);
  }
}

syncAdmins();
