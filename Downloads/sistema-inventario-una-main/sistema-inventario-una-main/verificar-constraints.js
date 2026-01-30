#!/usr/bin/env node
// Script para verificar o estado das constraints no banco
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function verificarConstraints() {
  console.log('🔍 Verificando constraints no banco de dados...\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não encontrada');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    // 1. Verificar constraints UNIQUE em categories
    console.log('📁 CATEGORIES - Constraints UNIQUE:');
    const catConstraints = await pool.query(`
      SELECT 
        tc.constraint_name,
        string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'UNIQUE' 
        AND tc.table_name = 'categories'
      GROUP BY tc.constraint_name
      ORDER BY tc.constraint_name
    `);
    
    if (catConstraints.rows.length === 0) {
      console.log('  ⚠️  Nenhuma constraint UNIQUE encontrada!');
    } else {
      catConstraints.rows.forEach(row => {
        const isCorrect = row.columns.includes('campus_id');
        console.log(`  ${isCorrect ? '✅' : '❌'} ${row.constraint_name}: (${row.columns})`);
      });
    }
    
    // 2. Verificar constraints UNIQUE em sectors
    console.log('\n🏢 SECTORS - Constraints UNIQUE:');
    const secConstraints = await pool.query(`
      SELECT 
        tc.constraint_name,
        string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'UNIQUE' 
        AND tc.table_name = 'sectors'
      GROUP BY tc.constraint_name
      ORDER BY tc.constraint_name
    `);
    
    if (secConstraints.rows.length === 0) {
      console.log('  ⚠️  Nenhuma constraint UNIQUE encontrada!');
    } else {
      secConstraints.rows.forEach(row => {
        const isCorrect = row.columns.includes('campus_id');
        console.log(`  ${isCorrect ? '✅' : '❌'} ${row.constraint_name}: (${row.columns})`);
      });
    }
    
    // 3. Verificar coluna is_fixed
    console.log('\n💾 INVENTORY_ITEMS - Coluna is_fixed:');
    const isFixedCheck = await pool.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'inventory_items' AND column_name = 'is_fixed'
    `);
    
    if (isFixedCheck.rows.length === 0) {
      console.log('  ❌ Coluna is_fixed NÃO existe');
    } else {
      const col = isFixedCheck.rows[0];
      console.log(`  ✅ Coluna is_fixed existe: ${col.data_type}, default: ${col.column_default}, nullable: ${col.is_nullable}`);
    }
    
    // 4. Verificar setores duplicados (mesmo nome em campus diferentes)
    console.log('\n🔍 Setores com mesmo nome em campus diferentes:');
    const duplicateSectors = await pool.query(`
      SELECT s.name, COUNT(*) as count, string_agg(c.name, ', ') as campus_names
      FROM sectors s
      LEFT JOIN campus c ON s.campus_id = c.id
      GROUP BY s.name
      HAVING COUNT(*) > 1
      ORDER BY s.name
    `);
    
    if (duplicateSectors.rows.length === 0) {
      console.log('  ℹ️  Nenhum setor duplicado encontrado');
    } else {
      console.log('  📊 Setores duplicados:');
      duplicateSectors.rows.forEach(row => {
        console.log(`    - ${row.name}: ${row.count}x (${row.campus_names})`);
      });
    }
    
    // 5. Status geral
    console.log('\n📊 RESUMO:');
    const catOk = catConstraints.rows.some(r => r.columns.includes('campus_id'));
    const secOk = secConstraints.rows.some(r => r.columns.includes('campus_id'));
    const isFixedOk = isFixedCheck.rows.length > 0;
    
    console.log(`  Categories UNIQUE (name, campus_id): ${catOk ? '✅' : '❌'}`);
    console.log(`  Sectors UNIQUE (name, campus_id): ${secOk ? '✅' : '❌'}`);
    console.log(`  Coluna is_fixed existe: ${isFixedOk ? '✅' : '❌'}`);
    
    if (catOk && secOk && isFixedOk) {
      console.log('\n✅ TUDO CORRETO! O banco está configurado corretamente.');
    } else {
      console.log('\n⚠️  PROBLEMAS ENCONTRADOS! Execute: npm run setup-db');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verificarConstraints();
