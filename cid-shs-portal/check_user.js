const db = require('./backend/config/db');

async function listAll() {
  try {
    const [f] = await db.execute('SELECT id, name, parent_id FROM folders');
    console.log('Folders:', f);
    
    const [i] = await db.execute('SELECT id, title, folder_id FROM issuances');
    console.log('Issuances:', i);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listAll();
