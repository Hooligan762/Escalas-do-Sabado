#!/usr/bin/env node

/**
 * Script para diagnosticar por que técnicos não veem dados
 * Executa queries diretamente no Railway PostgreSQL
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:kZvzFmtmvSdeHjMezrlsTesDfLDPvPZE@junction.proxy.rlwy.net:48063/railway';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function diagnose() {
  console.log('🔍 Diagnóstico: Por que técnicos não veem dados\n');
  console.log('═'.repeat(60));
  
  try {
    // 1. Ver todos os campus
    console.log('\n1️⃣ CAMPUS DISPONÍVEIS:\n');
    const campusResult = await pool.query('SELECT id, name FROM campus ORDER BY name');
    console.table(campusResult.rows);
    
    // 2. Ver usuário aimores
    console.log('\n2️⃣ USUÁRIO AIMORÉS:\n');
    const aimorésUser = await pool.query(`
      SELECT u.id, u.username, u.role, u.campus_id, c.name as campus_name
      FROM users u
      LEFT JOIN campus c ON u.campus_id = c.id
      WHERE u.username = 'aimores'
    `);
    console.table(aimorésUser.rows);
    
    if (aimorésUser.rows.length === 0) {
      console.log('❌ Usuário "aimores" NÃO ENCONTRADO!');
      console.log('\n3️⃣ TODOS OS USUÁRIOS TÉCNICOS:\n');
      const allUsers = await pool.query(`
        SELECT u.id, u.username, u.role, u.campus_id, c.name as campus_name
        FROM users u
        LEFT JOIN campus c ON u.campus_id = c.id
        WHERE u.role != 'admin'
        ORDER BY u.username
      `);
      console.table(allUsers.rows);
    }
    
    // 3. Ver setores do campus Aimorés
    console.log('\n4️⃣ SETORES DO CAMPUS AIMORÉS:\n');
    const aimorésSetores = await pool.query(`
      SELECT s.id, s.name, s.campus_id, c.name as campus_name
      FROM sectors s
      LEFT JOIN campus c ON s.campus_id = c.id
      WHERE c.name ILIKE '%aimor%'
      ORDER BY s.name
    `);
    console.table(aimorésSetores.rows);
    
    if (aimorésSetores.rows.length === 0) {
      console.log('⚠️  Nenhum setor encontrado para campus Aimorés!');
      console.log('\n5️⃣ TODOS OS SETORES (QUALQUER CAMPUS):\n');
      const allSetores = await pool.query(`
        SELECT s.id, s.name, s.campus_id, c.name as campus_name
        FROM sectors s
        LEFT JOIN campus c ON s.campus_id = c.id
        ORDER BY c.name, s.name
        LIMIT 20
      `);
      console.table(allSetores.rows);
    }
    
    // 6. Ver categorias do campus Aimorés
    console.log('\n6️⃣ CATEGORIAS DO CAMPUS AIMORÉS:\n');
    const aimorésCategorias = await pool.query(`
      SELECT cat.id, cat.name, cat.campus_id, c.name as campus_name
      FROM categories cat
      LEFT JOIN campus c ON cat.campus_id = c.id
      WHERE c.name ILIKE '%aimor%'
      ORDER BY cat.name
    `);
    console.table(aimorésCategorias.rows);
    
    // 7. Verificar constraints
    console.log('\n7️⃣ CONSTRAINTS DA TABELA SECTORS:\n');
    const constraints = await pool.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'sectors'::regclass
    `);
    console.table(constraints.rows);
    
    // 8. Diagnóstico final
    console.log('\n═'.repeat(60));
    console.log('📊 RESUMO DO DIAGNÓSTICO:\n');
    
    const campusAimores = campusResult.rows.find(c => c.name.toLowerCase().includes('aimor'));
    const userAimores = aimorésUser.rows[0];
    
    if (!campusAimores) {
      console.log('❌ PROBLEMA: Campus "Aimorés" não existe na tabela campus');
      console.log('   Solução: Executar INSERT INTO campus (id, name) VALUES (\'campus-aimores\', \'Aimorés\')');
    } else {
      console.log(`✅ Campus "Aimorés" existe: ID = ${campusAimores.id}`);
    }
    
    if (!userAimores) {
      console.log('❌ PROBLEMA: Usuário "aimores" não existe');
      console.log('   Solução: Criar usuário técnico para Aimorés');
    } else if (!userAimores.campus_id) {
      console.log('❌ PROBLEMA: Usuário "aimores" existe mas campus_id = NULL');
      console.log(`   Solução: UPDATE users SET campus_id = '${campusAimores?.id}' WHERE username = 'aimores'`);
    } else if (campusAimores && userAimores.campus_id !== campusAimores.id) {
      console.log('❌ PROBLEMA: Usuário "aimores" aponta para campus errado');
      console.log(`   campus_id do usuário: ${userAimores.campus_id}`);
      console.log(`   campus_id correto: ${campusAimores.id}`);
      console.log(`   Solução: UPDATE users SET campus_id = '${campusAimores.id}' WHERE username = 'aimores'`);
    } else {
      console.log(`✅ Usuário "aimores" está vinculado ao campus correto: ${userAimores.campus_name}`);
    }
    
    if (aimorésSetores.rows.length === 0) {
      console.log('⚠️  AVISO: Nenhum setor criado ainda para campus Aimorés');
      console.log('   Isso é normal se ainda não criaram nenhum setor');
    } else {
      console.log(`✅ Campus Aimorés tem ${aimorésSetores.rows.length} setores`);
    }
    
    if (aimorésCategorias.rows.length === 0) {
      console.log('⚠️  AVISO: Nenhuma categoria criada ainda para campus Aimorés');
    } else {
      console.log(`✅ Campus Aimorés tem ${aimorésCategorias.rows.length} categorias`);
    }
    
    console.log('\n═'.repeat(60));
    
  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error);
  } finally {
    await pool.end();
  }
}

diagnose();
