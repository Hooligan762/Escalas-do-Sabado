#!/usr/bin/env node
// Verifica o problema atual com isolamento - mostra todos os dados de categories e sectors
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
    console.log('🔍 Verificando problema de isolamento...\n');
    
    // Listar todos os dados atuais
    console.log('📁 TODAS as categorias no banco:');
    const categoriesResult = await client.query(`
      SELECT c.id, c.name, c.campus_id, cp.name as campus_name 
      FROM categories c 
      LEFT JOIN campus cp ON c.campus_id = cp.id 
      ORDER BY c.name
    `);
    
    categoriesResult.rows.forEach(row => {
      const campusInfo = row.campus_name ? `Campus: ${row.campus_name}` : 'Global (sem campus)';
      console.log(`  - ${row.name} (${campusInfo})`);
    });
    
    console.log('\n🏢 TODOS os setores no banco:');
    const sectorsResult = await client.query(`
      SELECT s.id, s.name, s.campus_id, cp.name as campus_name 
      FROM sectors s 
      LEFT JOIN campus cp ON s.campus_id = cp.id 
      ORDER BY s.name
    `);
    
    sectorsResult.rows.forEach(row => {
      const campusInfo = row.campus_name ? `Campus: ${row.campus_name}` : 'Global (sem campus)';
      console.log(`  - ${row.name} (${campusInfo})`);
    });
    
    // Agora testar o que cada campus vê
    console.log('\n🎯 TESTANDO VISIBILIDADE POR CAMPUS:\n');
    
    const campusResult = await client.query('SELECT id, name FROM campus WHERE name != \'Administrador\' ORDER BY name LIMIT 3');
    
    for (const campus of campusResult.rows) {
      console.log(`👤 Campus: ${campus.name}`);
      
      // Categorias visíveis
      const catVisible = await client.query(`
        SELECT name FROM categories 
        WHERE campus_id = $1 OR campus_id IS NULL 
        ORDER BY name
      `, [campus.id]);
      
      console.log(`  📁 Categorias (${catVisible.rows.length}): ${catVisible.rows.map(r => r.name).join(', ')}`);
      
      // Setores visíveis
      const secVisible = await client.query(`
        SELECT name FROM sectors 
        WHERE campus_id = $1 OR campus_id IS NULL 
        ORDER BY name
      `, [campus.id]);
      
      console.log(`  🏢 Setores (${secVisible.rows.length}): ${secVisible.rows.map(r => r.name).join(', ')}\n`);
    }
    
  } catch (e) {
    console.error('Erro:', e.message);
  } finally {
    await client.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });