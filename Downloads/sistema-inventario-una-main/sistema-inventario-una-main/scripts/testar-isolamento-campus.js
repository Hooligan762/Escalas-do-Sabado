#!/usr/bin/env node
// Testa o isolamento por campus - verifica se categories e sectors aparecem apenas para o campus correto
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
    console.log('🧪 Testando isolamento por campus...\n');
    
    // 1. Listar todos os campus
    const campusResult = await client.query('SELECT id, name FROM campus ORDER BY name');
    console.log('📍 Campus disponíveis:');
    campusResult.rows.forEach(campus => {
      console.log(`  - ${campus.name} (ID: ${campus.id})`);
    });
    
    // 2. Pegar um campus específico para teste (Aimorés)
    const aimoresCampus = campusResult.rows.find(c => c.name === 'Aimorés');
    if (!aimoresCampus) {
      console.log('❌ Campus Aimorés não encontrado');
      return;
    }
    
    console.log(`\n🔍 Testando isolamento para campus: ${aimoresCampus.name}`);
    
    // 3. Simular query de categories para usuário do campus Aimorés
    const categoriesQuery = `
      SELECT * FROM categories 
      WHERE campus_id = $1 OR campus_id IS NULL 
      ORDER BY name ASC
    `;
    const categoriesResult = await client.query(categoriesQuery, [aimoresCampus.id]);
    
    console.log(`\n📁 Categorias visíveis para ${aimoresCampus.name}:`);
    categoriesResult.rows.forEach(cat => {
      const scope = cat.campus_id ? 'Campus específico' : 'Global (sem campus)';
      console.log(`  - ${cat.name} (${scope})`);
    });
    
    // 4. Simular query de sectors para usuário do campus Aimorés
    const sectorsQuery = `
      SELECT * FROM sectors 
      WHERE campus_id = $1 OR campus_id IS NULL 
      ORDER BY name ASC
    `;
    const sectorsResult = await client.query(sectorsQuery, [aimoresCampus.id]);
    
    console.log(`\n🏢 Setores visíveis para ${aimoresCampus.name}:`);
    sectorsResult.rows.forEach(sector => {
      const scope = sector.campus_id ? 'Campus específico' : 'Global (sem campus)';
      console.log(`  - ${sector.name} (${scope})`);
    });
    
    // 5. Comparar com query para admin (todas as categories/sectors)
    const allCategoriesResult = await client.query('SELECT * FROM categories ORDER BY name ASC');
    const allSectorsResult = await client.query('SELECT * FROM sectors ORDER BY name ASC');
    
    console.log(`\n👑 Para comparação - Admin vê:`);
    console.log(`  - ${allCategoriesResult.rows.length} categorias total`);
    console.log(`  - ${allSectorsResult.rows.length} setores total`);
    
    console.log(`\n📊 Resumo do isolamento:`);
    console.log(`  - Campus ${aimoresCampus.name} vê: ${categoriesResult.rows.length} categorias, ${sectorsResult.rows.length} setores`);
    console.log(`  - Admin vê: ${allCategoriesResult.rows.length} categorias, ${allSectorsResult.rows.length} setores`);
    
    if (categoriesResult.rows.length < allCategoriesResult.rows.length || 
        sectorsResult.rows.length < allSectorsResult.rows.length) {
      console.log('✅ Isolamento funcionando - campus vê menos itens que admin');
    } else {
      console.log('⚠️ Isolamento pode não estar funcionando - campus vê todos os itens');
    }
    
  } catch (e) {
    console.error('Erro:', e.message);
  } finally {
    await client.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });