const { Pool } = require('pg');
const fs = require('fs');

const DATABASE_URL = 'postgresql://postgres:VtOVxujBWMEhnxDDBPYqaBRWNdMWVchd@trolley.proxy.rlwy.net:43460/railway';
const SQL_FILE = 'railway-database-setup.sql';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runSqlFile() {
  const sql = fs.readFileSync(SQL_FILE, 'utf8');
  // Split by semicolon, filter empty, and run each statement
  const statements = sql.split(/;\s*\n/).filter(s => s.trim());
  let client;
  try {
    client = await pool.connect();
    for (const stmt of statements) {
      try {
        await client.query(stmt);
        console.log('Executado:', stmt.split('\n')[0].slice(0, 80));
      } catch (err) {
        console.error('Erro ao executar:', stmt.split('\n')[0].slice(0, 80), err.message);
      }
    }
    console.log('✅ Script SQL executado!');
  } catch (err) {
    console.error('Falha geral:', err.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

runSqlFile();
