#!/usr/bin/env node
// Exibe dados crus do usuário no banco local
const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
  const [,, usernameArg] = process.argv;
  if (!usernameArg) {
    console.log('Uso: node scripts/mostrar-usuario.js <username|campus>');
    process.exit(1);
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    let res = await client.query('SELECT username, name, role, password, campus_id FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1', [usernameArg]);
    let user = res.rows[0];
    if (!user) {
      const campusRes = await client.query('SELECT id, name FROM campus WHERE LOWER(name) = LOWER($1) LIMIT 1', [usernameArg]);
      const campus = campusRes.rows[0];
      if (campus) {
        const techRes = await client.query('SELECT username, name, role, password, campus_id FROM users WHERE role = $1 AND campus_id = $2 LIMIT 1', ['tecnico', campus.id]);
        user = techRes.rows[0];
      }
    }
    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    console.log('👤', user);
  } finally {
    await client.end();
  }
}
main().catch(e => { console.error(e); process.exit(1); });