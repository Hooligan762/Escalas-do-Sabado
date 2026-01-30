#!/usr/bin/env node
// Testa a criação de categorias e setores específicos por campus
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
    console.log('🧪 Testando criação de itens específicos por campus...\n');
    
    // Pegar campus Aimorés e Barreiro para teste
    const campusResult = await client.query(`
      SELECT id, name FROM campus 
      WHERE name IN ('Aimorés', 'Barreiro') 
      ORDER BY name
    `);
    
    if (campusResult.rows.length < 2) {
      console.log('❌ Precisa dos campus Aimorés e Barreiro para o teste');
      return;
    }
    
    const aimores = campusResult.rows.find(c => c.name === 'Aimorés');
    const barreiro = campusResult.rows.find(c => c.name === 'Barreiro');
    
    console.log(`📍 Testando com campus: ${aimores.name} (${aimores.id}) e ${barreiro.name} (${barreiro.id})\n`);
    
    // 1. Criar categoria específica para Aimorés
    const categoriaAimoresId = crypto.randomUUID();
    await client.query(
      'INSERT INTO categories (id, name, campus_id) VALUES ($1, $2, $3)', 
      [categoriaAimoresId, 'Categoria Teste Aimorés', aimores.id]
    );
    console.log('✅ Criada categoria específica para Aimorés');
    
    // 2. Criar setor específico para Barreiro
    const setorBarreiroId = crypto.randomUUID();
    await client.query(
      'INSERT INTO sectors (id, name, campus_id) VALUES ($1, $2, $3)', 
      [setorBarreiroId, 'Setor Teste Barreiro', barreiro.id]
    );
    console.log('✅ Criado setor específico para Barreiro');
    
    // 3. Testar visibilidade para Aimorés
    console.log(`\n🔍 Testando visibilidade para ${aimores.name}:`);
    
    const categoriasAimores = await client.query(`
      SELECT name, campus_id FROM categories 
      WHERE campus_id = $1 OR campus_id IS NULL 
      ORDER BY name ASC
    `, [aimores.id]);
    
    console.log('📁 Categorias visíveis:');
    categoriasAimores.rows.forEach(cat => {
      const scope = cat.campus_id ? '🏠 Campus específico' : '🌐 Global';
      console.log(`  - ${cat.name} ${scope}`);
    });
    
    const setoresAimores = await client.query(`
      SELECT name, campus_id FROM sectors 
      WHERE campus_id = $1 OR campus_id IS NULL 
      ORDER BY name ASC
    `, [aimores.id]);
    
    console.log('🏢 Setores visíveis:');
    setoresAimores.rows.forEach(sector => {
      const scope = sector.campus_id ? '🏠 Campus específico' : '🌐 Global';
      console.log(`  - ${sector.name} ${scope}`);
    });
    
    // 4. Testar visibilidade para Barreiro
    console.log(`\n🔍 Testando visibilidade para ${barreiro.name}:`);
    
    const categoriasBarreiro = await client.query(`
      SELECT name, campus_id FROM categories 
      WHERE campus_id = $1 OR campus_id IS NULL 
      ORDER BY name ASC
    `, [barreiro.id]);
    
    console.log('📁 Categorias visíveis:');
    categoriasBarreiro.rows.forEach(cat => {
      const scope = cat.campus_id ? '🏠 Campus específico' : '🌐 Global';
      console.log(`  - ${cat.name} ${scope}`);
    });
    
    const setoresBarreiro = await client.query(`
      SELECT name, campus_id FROM sectors 
      WHERE campus_id = $1 OR campus_id IS NULL 
      ORDER BY name ASC
    `, [barreiro.id]);
    
    console.log('🏢 Setores visíveis:');
    setoresBarreiro.rows.forEach(sector => {
      const scope = sector.campus_id ? '🏠 Campus específico' : '🌐 Global';
      console.log(`  - ${sector.name} ${scope}`);
    });
    
    // 5. Validar isolamento
    console.log('\n📊 Validação do isolamento:');
    
    const temCategoriaAimoresEmBarreiro = categoriasBarreiro.rows.some(c => c.name === 'Categoria Teste Aimorés');
    const temSetorBarreiroEmAimores = setoresAimores.rows.some(s => s.name === 'Setor Teste Barreiro');
    
    if (!temCategoriaAimoresEmBarreiro && !temSetorBarreiroEmAimores) {
      console.log('✅ ISOLAMENTO FUNCIONANDO!');
      console.log('  - Categoria de Aimorés NÃO aparece em Barreiro');
      console.log('  - Setor de Barreiro NÃO aparece em Aimorés');
    } else {
      console.log('❌ ISOLAMENTO COM PROBLEMAS!');
      if (temCategoriaAimoresEmBarreiro) {
        console.log('  - Categoria de Aimorés aparece incorretamente em Barreiro');
      }
      if (temSetorBarreiroEmAimores) {
        console.log('  - Setor de Barreiro aparece incorretamente em Aimorés');
      }
    }
    
    // 6. Limpeza - remover itens de teste
    console.log('\n🧹 Limpando itens de teste...');
    await client.query('DELETE FROM categories WHERE id = $1', [categoriaAimoresId]);
    await client.query('DELETE FROM sectors WHERE id = $1', [setorBarreiroId]);
    console.log('✅ Itens de teste removidos');
    
  } catch (e) {
    console.error('Erro:', e.message);
  } finally {
    await client.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });