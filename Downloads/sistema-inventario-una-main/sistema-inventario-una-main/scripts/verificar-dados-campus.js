#!/usr/bin/env node
// Verifica os dados atuais de categories e sectors e seus campus_id
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
    console.log('📁 Categorias atuais:\n');
    const categoriesResult = await client.query(`
      SELECT c.id, c.name, c.campus_id, cp.name as campus_name 
      FROM categories c 
      LEFT JOIN campus cp ON c.campus_id = cp.id 
      ORDER BY c.name
    `);
    
    categoriesResult.rows.forEach(row => {
      const campusInfo = row.campus_name ? `(Campus: ${row.campus_name})` : '(Sem campus associado)';
      console.log(`  - ${row.name} ${campusInfo}`);
    });
    
    console.log('\n🏢 Setores atuais:\n');
    const sectorsResult = await client.query(`
      SELECT s.id, s.name, s.campus_id, cp.name as campus_name 
      FROM sectors s 
      LEFT JOIN campus cp ON s.campus_id = cp.id 
      ORDER BY s.name
    `);
    
    sectorsResult.rows.forEach(row => {
      const campusInfo = row.campus_name ? `(Campus: ${row.campus_name})` : '(Sem campus associado)';
      console.log(`  - ${row.name} ${campusInfo}`);
    });
    
    console.log('\n📊 Resumo:');
    const categoriesWithoutCampus = categoriesResult.rows.filter(r => !r.campus_id).length;
    const sectorsWithoutCampus = sectorsResult.rows.filter(r => !r.campus_id).length;
    
    console.log(`  - ${categoriesWithoutCampus}/${categoriesResult.rows.length} categorias sem campus associado`);
    console.log(`  - ${sectorsWithoutCampus}/${sectorsResult.rows.length} setores sem campus associado`);
    
  } catch (e) {
    console.error('Erro:', e.message);
  } finally {
    await client.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });