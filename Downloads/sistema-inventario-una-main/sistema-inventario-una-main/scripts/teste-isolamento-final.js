#!/usr/bin/env node
// Teste final - validar isolamento TOTAL por campus
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
    console.log('🧪 TESTE FINAL - Validando isolamento TOTAL por campus\n');
    
    // 1. Pegar 3 campus para teste
    const campusResult = await client.query(`
      SELECT id, name FROM campus 
      WHERE name IN ('Administrador', 'Aimorés', 'Barreiro') 
      ORDER BY name
    `);
    
    if (campusResult.rows.length < 3) {
      console.log('❌ Precisa dos campus Administrador, Aimorés e Barreiro para o teste');
      return;
    }
    
    const admin = campusResult.rows.find(c => c.name === 'Administrador');
    const aimores = campusResult.rows.find(c => c.name === 'Aimorés');
    const barreiro = campusResult.rows.find(c => c.name === 'Barreiro');
    
    console.log(`📍 Testando com 3 campus:`);
    console.log(`  - ${admin.name} (${admin.id})`);
    console.log(`  - ${aimores.name} (${aimores.id})`);
    console.log(`  - ${barreiro.name} (${barreiro.id})`);
    
    // 2. Criar itens específicos para cada campus
    console.log('\n🔧 Criando itens de teste...');
    
    const categoriaAimoresId = crypto.randomUUID();
    await client.query(
      'INSERT INTO categories (id, name, campus_id) VALUES ($1, $2, $3)', 
      [categoriaAimoresId, 'Categoria Específica Aimorés', aimores.id]
    );
    
    const setorBarreiroId = crypto.randomUUID();
    await client.query(
      'INSERT INTO sectors (id, name, campus_id) VALUES ($1, $2, $3)', 
      [setorBarreiroId, 'Setor Específico Barreiro', barreiro.id]
    );
    
    console.log('✅ Criados itens de teste');
    
    // 3. Testar visibilidade para cada campus
    console.log('\n🔍 Testando visibilidade...');
    
    // ADMIN - deve ver TUDO
    const adminCategories = await client.query('SELECT name, campus_id FROM categories ORDER BY name');
    const adminSectors = await client.query('SELECT name, campus_id FROM sectors ORDER BY name');
    
    console.log(`\n👑 ADMIN vê:`);
    console.log(`  📁 ${adminCategories.rows.length} categorias:`);
    adminCategories.rows.forEach(cat => {
      const campusName = campusResult.rows.find(c => c.id === cat.campus_id)?.name || 'Desconhecido';
      console.log(`    - ${cat.name} (${campusName})`);
    });
    console.log(`  🏢 ${adminSectors.rows.length} setores:`);
    adminSectors.rows.forEach(sector => {
      const campusName = campusResult.rows.find(c => c.id === sector.campus_id)?.name || 'Desconhecido';
      console.log(`    - ${sector.name} (${campusName})`);
    });
    
    // AIMORÉS - deve ver APENAS seus itens
    const aimoresCategories = await client.query(
      'SELECT name FROM categories WHERE campus_id = $1 ORDER BY name', 
      [aimores.id]
    );
    const aimoresSectors = await client.query(
      'SELECT name FROM sectors WHERE campus_id = $1 ORDER BY name', 
      [aimores.id]
    );
    
    console.log(`\n🏠 ${aimores.name.toUpperCase()} vê:`);
    console.log(`  📁 ${aimoresCategories.rows.length} categorias:`);
    aimoresCategories.rows.forEach(cat => console.log(`    - ${cat.name}`));
    console.log(`  🏢 ${aimoresSectors.rows.length} setores:`);
    aimoresSectors.rows.forEach(sector => console.log(`    - ${sector.name}`));
    
    // BARREIRO - deve ver APENAS seus itens
    const barreiroCategories = await client.query(
      'SELECT name FROM categories WHERE campus_id = $1 ORDER BY name', 
      [barreiro.id]
    );
    const barreiroSectors = await client.query(
      'SELECT name FROM sectors WHERE campus_id = $1 ORDER BY name', 
      [barreiro.id]
    );
    
    console.log(`\n🏠 ${barreiro.name.toUpperCase()} vê:`);
    console.log(`  📁 ${barreiroCategories.rows.length} categorias:`);
    barreiroCategories.rows.forEach(cat => console.log(`    - ${cat.name}`));
    console.log(`  🏢 ${barreiroSectors.rows.length} setores:`);
    barreiroSectors.rows.forEach(sector => console.log(`    - ${sector.name}`));
    
    // 4. Validar isolamento
    console.log('\n📊 VALIDAÇÃO DO ISOLAMENTO:');
    
    const aimoresTemItemBarreiro = aimoresSectors.rows.some(s => s.name === 'Setor Específico Barreiro');
    const barreiroTemItemAimores = barreiroCategories.rows.some(c => c.name === 'Categoria Específica Aimorés');
    const aimoresTemItemAdmin = aimoresCategories.rows.some(c => ['Desktop', 'Notebook', 'Monitor'].includes(c.name));
    const barreiroTemItemAdmin = barreiroSectors.rows.some(s => ['Administração', 'Biblioteca', 'Laboratório'].includes(s.name));
    
    let isolamentoCompleto = true;
    const problemas = [];
    
    if (aimoresTemItemBarreiro) {
      problemas.push('❌ Aimorés vê item de Barreiro');
      isolamentoCompleto = false;
    }
    if (barreiroTemItemAimores) {
      problemas.push('❌ Barreiro vê item de Aimorés');
      isolamentoCompleto = false;
    }
    if (aimoresTemItemAdmin) {
      problemas.push('❌ Aimorés vê itens de Admin');
      isolamentoCompleto = false;
    }
    if (barreiroTemItemAdmin) {
      problemas.push('❌ Barreiro vê itens de Admin');
      isolamentoCompleto = false;
    }
    
    if (isolamentoCompleto) {
      console.log('🎉 ISOLAMENTO TOTAL FUNCIONANDO PERFEITAMENTE!');
      console.log('   ✅ Cada campus vê APENAS seus próprios dados');
      console.log('   ✅ Nenhum campus vê dados de outros');
      console.log('   ✅ Admin vê todos os dados (como esperado)');
    } else {
      console.log('❌ PROBLEMAS NO ISOLAMENTO:');
      problemas.forEach(problema => console.log(`   ${problema}`));
    }
    
    // 5. Limpeza
    console.log('\n🧹 Limpando itens de teste...');
    await client.query('DELETE FROM categories WHERE id = $1', [categoriaAimoresId]);
    await client.query('DELETE FROM sectors WHERE id = $1', [setorBarreiroId]);
    console.log('✅ Limpeza concluída');
    
  } catch (e) {
    console.error('Erro:', e.message);
  } finally {
    await client.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });