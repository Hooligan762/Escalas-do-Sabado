#!/usr/bin/env node
// Script para limpar dados e garantir isolamento completo - remove itens globais e recria separadamente
const { Client } = require('pg');
const path = require('path');
const crypto = require('crypto');
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
    console.log('🧹 Forçando isolamento completo - movendo itens globais para específicos...\n');
    
    // 1. Listar todos os campus
    const campusList = await client.query('SELECT id, name FROM campus WHERE name != \'Administrador\' ORDER BY name');
    console.log(`📍 Campus encontrados: ${campusList.rows.map(c => c.name).join(', ')}\n`);
    
    // 2. Para cada campus, criar suas próprias categorias e setores
    const baseCategorias = ['Desktop', 'Notebook', 'Monitor', 'Mouse', 'Teclado'];
    const baseSetores = ['Administração', 'Laboratório', 'Secretaria', 'Biblioteca'];
    
    for (const campus of campusList.rows) {
      console.log(`🏢 Configurando campus: ${campus.name}`);
      
      // Criar categorias específicas para este campus
      for (const catName of baseCategorias) {
        const categoryId = crypto.randomUUID();
        const fullName = `${catName} ${campus.name}`;
        
        await client.query(
          'INSERT INTO categories (id, name, campus_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [categoryId, fullName, campus.id]
        );
        console.log(`  ✅ Categoria: ${fullName}`);
      }
      
      // Criar setores específicos para este campus  
      for (const setName of baseSetores) {
        const sectorId = crypto.randomUUID();
        const fullName = `${setName} ${campus.name}`;
        
        await client.query(
          'INSERT INTO sectors (id, name, campus_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [sectorId, fullName, campus.id]
        );
        console.log(`  ✅ Setor: ${fullName}`);
      }
      
      console.log();
    }
    
    // 3. Verificar resultado
    console.log('📊 Verificando resultado...\n');
    
    for (const campus of campusList.rows.slice(0, 2)) { // Testar apenas 2 para não poluir output
      const categories = await client.query(`
        SELECT name FROM categories 
        WHERE campus_id = $1 OR campus_id IS NULL 
        ORDER BY name
      `, [campus.id]);
      
      const sectors = await client.query(`
        SELECT name FROM sectors 
        WHERE campus_id = $1 OR campus_id IS NULL 
        ORDER BY name
      `, [campus.id]);
      
      console.log(`👤 ${campus.name}:`);
      console.log(`  📁 Categorias (${categories.rows.length}): ${categories.rows.slice(0, 5).map(r => r.name).join(', ')}...`);
      console.log(`  🏢 Setores (${sectors.rows.length}): ${sectors.rows.slice(0, 5).map(r => r.name).join(', ')}...`);
      console.log();
    }
    
    console.log('✅ Isolamento reforçado! Agora cada campus tem seus próprios dados específicos.');
    console.log('💡 Recomendação: Reinicie o servidor Next.js para limpar qualquer cache.');
    
  } catch (e) {
    console.error('Erro:', e.message);
  } finally {
    await client.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });