#!/usr/bin/env node
// Script para verificar o que está realmente no banco após o teste
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
    console.log('🔍 Verificando dados atuais no banco após o teste...\n');
    
    // Verificar todos os setores com campus_id
    const sectorsResult = await client.query(`
      SELECT s.name, c.name as campus_name, s.id, s.campus_id
      FROM sectors s 
      LEFT JOIN campus c ON s.campus_id = c.id 
      ORDER BY c.name, s.name
    `);
    
    console.log('🏢 Setores no banco:');
    sectorsResult.rows.forEach(sector => {
      console.log(`  - ${sector.name} → Campus: ${sector.campus_name} (ID: ${sector.campus_id})`);
    });
    
    // Verificar todas as categorias com campus_id
    const categoriesResult = await client.query(`
      SELECT cat.name, c.name as campus_name, cat.id, cat.campus_id
      FROM categories cat 
      LEFT JOIN campus c ON cat.campus_id = c.id 
      ORDER BY c.name, cat.name
    `);
    
    console.log('\n📁 Categorias no banco:');
    categoriesResult.rows.forEach(category => {
      console.log(`  - ${category.name} → Campus: ${category.campus_name} (ID: ${category.campus_id})`);
    });
    
    // Contar por campus
    console.log('\n📊 Resumo por campus:');
    const campusResult = await client.query('SELECT id, name FROM campus ORDER BY name');
    
    for (const campus of campusResult.rows) {
      const sectorCount = await client.query(
        'SELECT COUNT(*) as total FROM sectors WHERE campus_id = $1', 
        [campus.id]
      );
      const categoryCount = await client.query(
        'SELECT COUNT(*) as total FROM categories WHERE campus_id = $1', 
        [campus.id]
      );
      
      console.log(`  ${campus.name}: ${categoryCount.rows[0].total} categorias, ${sectorCount.rows[0].total} setores`);
    }
    
  } catch (e) {
    console.error('Erro:', e.message);
  } finally {
    await client.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });