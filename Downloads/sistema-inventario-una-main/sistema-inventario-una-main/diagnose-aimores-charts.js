#!/usr/bin/env node

/**
 * DIAGNÓSTICO: Por que "Aimorés" não aparece nos gráficos
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function diagnosticarCampusGraficos() {
  console.log('🔍 DIAGNÓSTICO: Campus Aimorés nos Gráficos');
  console.log('='.repeat(60));
  
  try {
    // 1. Verificar todos os campus cadastrados
    console.log('\n📋 [1/5] CAMPUS CADASTRADOS:');
    const campus = await pool.query('SELECT id, name FROM campus ORDER BY name');
    
    console.log(`Total de campus: ${campus.rows.length}`);
    campus.rows.forEach((c, index) => {
      console.log(`  ${index + 1}. ID: "${c.id}" | Nome: "${c.name}"`);
    });

    // 2. Verificar se Aimorés existe
    console.log('\n🔍 [2/5] VERIFICANDO AIMORÉS:');
    const aimores = campus.rows.find(c => c.name && c.name.toLowerCase().includes('aimor'));
    if (aimores) {
      console.log(`✅ Aimorés encontrado: ID="${aimores.id}", Nome="${aimores.name}"`);
    } else {
      console.log('❌ Aimorés NÃO encontrado na tabela campus!');
    }

    // 3. Verificar items no inventário por campus
    console.log('\n📦 [3/5] INVENTÁRIO POR CAMPUS:');
    const inventoryByCampus = await pool.query(`
      SELECT 
        campus,
        COUNT(*) as total_items,
        COUNT(CASE WHEN status = 'funcionando' THEN 1 END) as funcionando,
        COUNT(CASE WHEN status = 'defeito' THEN 1 END) as defeito,
        COUNT(CASE WHEN status = 'manutencao' THEN 1 END) as manutencao,
        COUNT(CASE WHEN status = 'backup' THEN 1 END) as backup,
        COUNT(CASE WHEN status = 'descarte' THEN 1 END) as descarte
      FROM inventory_items 
      GROUP BY campus 
      ORDER BY campus
    `);
    
    console.log('Inventário por campus:');
    if (inventoryByCampus.rows.length === 0) {
      console.log('  ❌ Nenhum item no inventário!');
    } else {
      inventoryByCampus.rows.forEach(row => {
        console.log(`  📊 ${row.campus}:`);
        console.log(`    - Total: ${row.total_items}`);
        console.log(`    - Funcionando: ${row.funcionando}`);
        console.log(`    - Defeito: ${row.defeito}`);
        console.log(`    - Manutenção: ${row.manutencao}`);
        console.log(`    - Backup: ${row.backup}`);
        console.log(`    - Descarte: ${row.descarte}`);
      });
    }

    // 4. Verificar se existe algum item com campus "Aimorés"
    console.log('\n🔎 [4/5] ITEMS DO CAMPUS AIMORÉS:');
    const aimoresItems = await pool.query(`
      SELECT category, status, COUNT(*) as count 
      FROM inventory_items 
      WHERE campus ILIKE '%aimor%' OR campus ILIKE '%aimorés%'
      GROUP BY category, status
      ORDER BY category, status
    `);
    
    if (aimoresItems.rows.length === 0) {
      console.log('❌ Nenhum item encontrado para campus Aimorés!');
      console.log('💡 POSSÍVEL CAUSA: Items foram cadastrados com nome diferente');
      
      // Verificar nomes únicos de campus no inventário
      const uniqueCampusNames = await pool.query(`
        SELECT DISTINCT campus, COUNT(*) as items
        FROM inventory_items 
        GROUP BY campus 
        ORDER BY campus
      `);
      
      console.log('\n📋 Nomes de campus únicos no inventário:');
      uniqueCampusNames.rows.forEach(row => {
        console.log(`  - "${row.campus}" (${row.items} items)`);
      });
      
    } else {
      console.log(`✅ ${aimoresItems.rows.length} registros encontrados para Aimorés:`);
      aimoresItems.rows.forEach(row => {
        console.log(`  - ${row.category} (${row.status}): ${row.count} items`);
      });
    }

    // 5. Verificar filtros aplicados no código
    console.log('\n🚫 [5/5] FILTROS NO CÓDIGO:');
    console.log('Código atual remove campus "Administrador" dos gráficos:');
    console.log('  campusNames.filter(name => name.toLowerCase() !== "administrador")');
    console.log('');
    
    const filteredNames = campus.rows
      .map(c => c.name)
      .filter(name => name && name.toLowerCase() !== 'administrador' && name.toLowerCase() !== 'admin');
    
    console.log('Campus que DEVERIAM aparecer nos gráficos:');
    filteredNames.forEach((name, index) => {
      console.log(`  ${index + 1}. "${name}"`);
    });

    // 6. Diagnóstico final
    console.log('\n🎯 DIAGNÓSTICO FINAL:');
    
    const hasAimores = campus.rows.some(c => c.name && c.name.toLowerCase().includes('aimor'));
    const hasAimoresItems = aimoresItems.rows.length > 0;
    const shouldAppearInCharts = filteredNames.some(name => name.toLowerCase().includes('aimor'));
    
    if (hasAimores && hasAimoresItems && shouldAppearInCharts) {
      console.log('✅ Aimorés DEVERIA aparecer nos gráficos!');
      console.log('🔍 Problema pode ser no frontend ou sincronização de dados');
    } else if (hasAimores && !hasAimoresItems) {
      console.log('❌ Campus Aimorés existe, mas NÃO há items cadastrados!');
      console.log('💡 Solução: Cadastrar items para o campus Aimorés');
    } else if (!hasAimores) {
      console.log('❌ Campus Aimorés não existe na tabela campus!');
      console.log('💡 Solução: Criar o campus Aimorés no banco de dados');
    } else {
      console.log('⚠️  Estado inconsistente - necessária investigação manual');
    }

  } catch (error) {
    console.error('❌ ERRO no diagnóstico:', error.message);
  } finally {
    await pool.end();
  }
}

// Executar diagnóstico
diagnosticarCampusGraficos();