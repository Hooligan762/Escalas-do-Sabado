#!/usr/bin/env node
// Verifica a estrutura atual das tabelas categories e sectors
const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
  const conn = process.env.DATABASE_URL;
  if (!conn) {
    console.error('DATABASE_URL não encontrada no .env.local');
    process.exit(1);
  }

  const client = new Client({ connectionString: conn });
  await client.connect();
  
  try {
    console.log('🏗️ Estrutura das tabelas categories e sectors:\n');
    
    const result = await client.query(`
      SELECT table_name, column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name IN ('categories', 'sectors') 
      ORDER BY table_name, ordinal_position
    `);
    
    let currentTable = '';
    result.rows.forEach(row => {
      if (row.table_name !== currentTable) {
        currentTable = row.table_name;
        console.log(`📋 Tabela: ${currentTable}`);
      }
      console.log(`  - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
    });
    
    console.log('\n🔍 Verificando se existem dados com campus_id:');
    
    try {
      const categoriesResult = await client.query('SELECT COUNT(*) as total FROM categories');
      console.log(`📁 Categories: ${categoriesResult.rows[0].total} registros`);
      
      const sectorsResult = await client.query('SELECT COUNT(*) as total FROM sectors');  
      console.log(`🏢 Sectors: ${sectorsResult.rows[0].total} registros`);
    } catch (e) {
      console.log('❌ Erro ao contar registros:', e.message);
    }
    
  } catch (e) {
    console.error('Erro:', e.message);
  } finally {
    await client.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });