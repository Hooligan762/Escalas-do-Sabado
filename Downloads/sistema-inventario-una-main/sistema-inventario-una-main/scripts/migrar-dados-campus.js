#!/usr/bin/env node
// Migra dados existentes (sem campus_id) para o campus Administrador
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
    console.log('🔄 Migrando dados existentes para campus Administrador...\n');
    
    // 1. Verificar campus Administrador
    const adminCampusResult = await client.query(`
      SELECT id, name FROM campus WHERE name = 'Administrador'
    `);
    
    if (adminCampusResult.rows.length === 0) {
      console.error('❌ Campus Administrador não encontrado!');
      return;
    }
    
    const adminCampusId = adminCampusResult.rows[0].id;
    console.log(`✅ Campus Administrador encontrado: ${adminCampusId}`);
    
    // 2. Verificar dados sem campus_id
    const categoriesResult = await client.query(`
      SELECT COUNT(*) as total FROM categories WHERE campus_id IS NULL
    `);
    const sectorsResult = await client.query(`
      SELECT COUNT(*) as total FROM sectors WHERE campus_id IS NULL
    `);
    
    const categoriesCount = parseInt(categoriesResult.rows[0].total);
    const sectorsCount = parseInt(sectorsResult.rows[0].total);
    
    console.log(`📊 Dados para migrar:`);
    console.log(`  - ${categoriesCount} categorias sem campus_id`);
    console.log(`  - ${sectorsCount} setores sem campus_id`);
    
    if (categoriesCount === 0 && sectorsCount === 0) {
      console.log('✅ Todos os dados já têm campus_id associado!');
      return;
    }
    
    // 3. Migrar categorias
    if (categoriesCount > 0) {
      console.log(`\n🔄 Migrando ${categoriesCount} categorias...`);
      const migrateCategories = await client.query(`
        UPDATE categories 
        SET campus_id = $1 
        WHERE campus_id IS NULL
        RETURNING name
      `, [adminCampusId]);
      
      console.log('✅ Categorias migradas:');
      migrateCategories.rows.forEach(cat => {
        console.log(`  - ${cat.name}`);
      });
    }
    
    // 4. Migrar setores
    if (sectorsCount > 0) {
      console.log(`\n🔄 Migrando ${sectorsCount} setores...`);
      const migrateSectors = await client.query(`
        UPDATE sectors 
        SET campus_id = $1 
        WHERE campus_id IS NULL
        RETURNING name
      `, [adminCampusId]);
      
      console.log('✅ Setores migrados:');
      migrateSectors.rows.forEach(sector => {
        console.log(`  - ${sector.name}`);
      });
    }
    
    // 5. Verificar resultado final
    console.log('\n🔍 Verificação final...');
    const finalCategoriesResult = await client.query(`
      SELECT COUNT(*) as total FROM categories WHERE campus_id IS NULL
    `);
    const finalSectorsResult = await client.query(`
      SELECT COUNT(*) as total FROM sectors WHERE campus_id IS NULL
    `);
    
    const finalCategoriesCount = parseInt(finalCategoriesResult.rows[0].total);
    const finalSectorsCount = parseInt(finalSectorsResult.rows[0].total);
    
    if (finalCategoriesCount === 0 && finalSectorsCount === 0) {
      console.log('🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
      console.log('   Todos os dados agora têm campus_id associado.');
    } else {
      console.log(`⚠️ Ainda existem ${finalCategoriesCount} categorias e ${finalSectorsCount} setores sem campus_id`);
    }
    
  } catch (e) {
    console.error('Erro durante migração:', e.message);
  } finally {
    await client.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });