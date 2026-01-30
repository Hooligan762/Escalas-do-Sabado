#!/usr/bin/env node

/**
 * CORREÇÃO EMERGENCIAL - ID NULO NO CAMPUS
 * Corrige registros com ID nulo que estão causando constraint violations
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function corrigirIdsNulos() {
  console.log('🚨 CORREÇÃO EMERGENCIAL - IDs NULOS');
  console.log('='.repeat(50));
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Verificar registros com ID nulo na tabela campus
    console.log('\n🔍 [1/5] Verificando registros com ID nulo...');
    const campusNulos = await client.query('SELECT * FROM campus WHERE id IS NULL');
    console.log(`Registros com ID nulo encontrados: ${campusNulos.rows.length}`);
    
    if (campusNulos.rows.length > 0) {
      console.log('📋 Registros problemáticos:');
      campusNulos.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.name} (created: ${row.created_at})`);
      });
      
      // 2. Deletar registros com ID nulo
      console.log('\n🗑️ [2/5] Removendo registros inválidos...');
      const deleteResult = await client.query('DELETE FROM campus WHERE id IS NULL');
      console.log(`✅ ${deleteResult.rowCount} registros removidos`);
    }
    
    // 3. Garantir que campus básicos existam com IDs válidos
    console.log('\n🏢 [3/5] Garantindo campus básicos...');
    const campusBasicos = [
      'Campus Central',
      'Campus Norte', 
      'Campus Sul',
      'Linha Verde'
    ];
    
    for (const campusName of campusBasicos) {
      const existe = await client.query('SELECT id FROM campus WHERE name = $1', [campusName]);
      if (existe.rows.length === 0) {
        await client.query(
          'INSERT INTO campus (id, name, created_at, updated_at) VALUES (gen_random_uuid(), $1, NOW(), NOW())',
          [campusName]
        );
        console.log(`✅ Campus criado: ${campusName}`);
      } else {
        console.log(`ℹ️  Campus existe: ${campusName} (ID: ${existe.rows[0].id})`);
      }
    }
    
    // 4. Verificar outras tabelas
    console.log('\n🔍 [4/5] Verificando outras tabelas...');
    
    // Verificar users com ID nulo
    const usersNulos = await client.query('SELECT COUNT(*) as count FROM users WHERE id IS NULL');
    if (parseInt(usersNulos.rows[0].count) > 0) {
      console.log(`❌ ${usersNulos.rows[0].count} usuários com ID nulo encontrados`);
      await client.query('DELETE FROM users WHERE id IS NULL');
      console.log('✅ Usuários inválidos removidos');
    }
    
    // Verificar inventory_items com ID nulo
    const itemsNulos = await client.query('SELECT COUNT(*) as count FROM inventory_items WHERE id IS NULL');
    if (parseInt(itemsNulos.rows[0].count) > 0) {
      console.log(`❌ ${itemsNulos.rows[0].count} items com ID nulo encontrados`);
      await client.query('DELETE FROM inventory_items WHERE id IS NULL');
      console.log('✅ Items inválidos removidos');
    }
    
    // 5. Verificação final
    console.log('\n✅ [5/5] Verificação final...');
    const finalCheck = await client.query(`
      SELECT 
        'campus' as tabela, COUNT(*) as total, COUNT(id) as ids_validos
      FROM campus
      UNION ALL
      SELECT 
        'users' as tabela, COUNT(*) as total, COUNT(id) as ids_validos  
      FROM users
      UNION ALL
      SELECT 
        'inventory_items' as tabela, COUNT(*) as total, COUNT(id) as ids_validos
      FROM inventory_items
    `);
    
    console.log('\n📊 ESTADO FINAL DAS TABELAS:');
    finalCheck.rows.forEach(row => {
      const status = row.total === row.ids_validos ? '✅' : '❌';
      console.log(`  ${status} ${row.tabela}: ${row.ids_validos}/${row.total} IDs válidos`);
    });
    
    await client.query('COMMIT');
    console.log('\n🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('💡 Todos os registros agora têm IDs válidos.');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ ERRO durante correção:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  corrigirIdsNulos().catch(console.error);
}

module.exports = { corrigirIdsNulos };