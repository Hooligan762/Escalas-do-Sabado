#!/usr/bin/env node
// Verifica quais usuários aceitam a senha informada (bcrypt ou texto simples)
// Uso: node scripts/testar-senha-para-todos.js <senha>

const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
  const [,, senhaArg] = process.argv;
  if (!senhaArg) {
    console.log('Uso: node scripts/testar-senha-para-todos.js <senha>');
    process.exit(1);
  }

  const conn = process.env.DATABASE_URL;
  if (!conn) {
    console.error('DATABASE_URL não encontrada no .env.local');
    process.exit(1);
  }

  const client = new Client({ connectionString: conn });
  await client.connect();
  try {
    const res = await client.query('SELECT username, name, role, password FROM users ORDER BY role, username');
    const users = res.rows;
    const ok = [];
    for (const u of users) {
      const stored = u.password || '';
      let match = false;
      if (stored.startsWith('$2b$') || stored.startsWith('$2a$')) {
        match = await bcrypt.compare(senhaArg, stored);
      } else {
        match = senhaArg === stored;
      }
      if (match) ok.push({ username: u.username, name: u.name, role: u.role });
    }

    console.log(`🧪 Testando senha: "${senhaArg}"`);
    console.log(`👥 Usuários verificados: ${users.length}`);
    if (ok.length === 0) {
      console.log('❌ Nenhum usuário aceitou essa senha.');
    } else {
      console.log('✅ Usuários que aceitam essa senha:');
      for (const u of ok) {
        console.log(` - ${u.username} (${u.name}) [${u.role}]`);
      }
    }
  } catch (e) {
    console.error('Erro ao testar:', e.message);
  } finally {
    await client.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });