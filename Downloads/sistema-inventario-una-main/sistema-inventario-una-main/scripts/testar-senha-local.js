#!/usr/bin/env node
// Testa a senha de um usuário direto no banco PostgreSQL local
// Uso: node scripts/testar-senha-local.js <username> <senha>

const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
  const [,, usernameArg, senhaArg] = process.argv;
  if (!usernameArg || !senhaArg) {
    console.log('Uso: node scripts/testar-senha-local.js <username> <senha>');
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
    // Tenta buscar por username; se não achar e for técnico, tenta por campus
    const res = await client.query('SELECT username, name, role, password, campus_id FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1', [usernameArg]);
    let user = res.rows[0];

    if (!user) {
      // Buscar por técnico do campus
      const campusRes = await client.query('SELECT id, name FROM campus WHERE LOWER(name) = LOWER($1) LIMIT 1', [usernameArg]);
      const campus = campusRes.rows[0];
      if (campus) {
        const techRes = await client.query('SELECT username, name, role, password FROM users WHERE role = $1 AND campus_id = $2 LIMIT 1', ['tecnico', campus.id]);
        user = techRes.rows[0];
      }
    }

    if (!user) {
      console.log('❌ Usuário não encontrado:', usernameArg);
      return;
    }

    const stored = user.password || '';
    let ok = false;
    if (stored.startsWith('$2b$') || stored.startsWith('$2a$')) {
      ok = await bcrypt.compare(senhaArg, stored);
    } else {
      ok = senhaArg === stored;
    }

    console.log('👤 Usuário:', user.username, `(${user.name})`, '- Papel:', user.role);
    console.log('🔐 Tipo de senha armazenada:', stored.startsWith('$2') ? 'bcrypt hash' : 'texto simples');
    console.log('🧪 Senha informada:', senhaArg);
    console.log(ok ? '✅ CORRETA' : '❌ INCORRETA');
  } catch (e) {
    console.error('Erro ao testar senha:', e.message);
  } finally {
    await client.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });