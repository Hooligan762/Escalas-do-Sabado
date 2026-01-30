const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:VtOVxujBWMEhnxDDBPYqaBRWNdMWVchd@trolley.proxy.rlwy.net:43460/railway',
  ssl: { rejectUnauthorized: false }
});

async function fixSectorsTable() {
  let client;
  try {
    client = await pool.connect();
    try {
      await client.query('ALTER TABLE sectors ADD COLUMN campus_id VARCHAR(255);');
      console.log('✅ Campo campus_id adicionado à tabela sectors!');
    } catch (err) {
      if (err.code === '42701') {
        console.log('ℹ️ Campo campus_id já existe.');
      } else {
        throw err;
      }
    }
    try {
      await client.query('ALTER TABLE sectors ADD CONSTRAINT fk_sectors_campus FOREIGN KEY (campus_id) REFERENCES campus(id) ON DELETE SET NULL;');
      console.log('✅ FK adicionada à tabela sectors!');
    } catch (err) {
      if (err.code === '42710') {
        console.log('ℹ️ FK já existe.');
      } else {
        throw err;
      }
    }
  } catch (err) {
    console.error('Erro ao corrigir tabela sectors:', err.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

fixSectorsTable();
