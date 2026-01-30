#!/usr/bin/env node

/**
 * SCRIPT PARA LIMPAR DADOS PERSISTENTES - SECRETARIA/SALA 103
 * Remove items indesejados do inventário
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function limparDadosSecretaria() {
  console.log('🧹 LIMPEZA: REMOVENDO DADOS DA SECRETARIA/SALA 103');
  console.log('='.repeat(60));
  
  try {
    // 1. Verificar items com "Secretaria" no setor
    console.log('\n🔍 [1/4] VERIFICANDO ITEMS COM "SECRETARIA"...');
    const itemsSecretaria = await pool.query(`
      SELECT id, campus, setor, sala, category, serial, brand, status
      FROM inventory_items 
      WHERE setor ILIKE '%secretaria%' OR sala ILIKE '%103%'
      ORDER BY created DESC
    `);
    
    if (itemsSecretaria.rows.length === 0) {
      console.log('✅ Nenhum item encontrado com "Secretaria" ou "Sala 103"');
    } else {
      console.log(`❌ ${itemsSecretaria.rows.length} items encontrados:`);
      itemsSecretaria.rows.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.category} - S/N: ${item.serial}`);
        console.log(`     Localização: ${item.setor} / ${item.sala}`);
        console.log(`     Campus: ${item.campus}`);
        console.log(`     Status: ${item.status}`);
        console.log('');
      });
    }

    // 2. Remover items da Secretaria se existirem
    if (itemsSecretaria.rows.length > 0) {
      console.log('\n🗑️ [2/4] REMOVENDO ITEMS DA SECRETARIA...');
      
      const deleteResult = await pool.query(`
        DELETE FROM inventory_items 
        WHERE setor ILIKE '%secretaria%' OR sala ILIKE '%103%'
      `);
      
      console.log(`✅ ${deleteResult.rowCount} items removidos do banco de dados`);
      
      // Registrar no log de auditoria
      for (const item of itemsSecretaria.rows) {
        await pool.query(`
          INSERT INTO audit_log (id, action, user_id, campus_id, inventory_id, details, timestamp)
          VALUES (
            gen_random_uuid(),
            'delete',
            (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
            (SELECT id FROM campus WHERE name = $1 LIMIT 1),
            NULL,
            $2,
            NOW()
          )
        `, [
          item.campus,
          `Limpeza automática: Removido ${item.category} S/N: ${item.serial} da localização ${item.setor} / ${item.sala}`
        ]);
      }
      
      console.log('📝 Logs de auditoria criados para items removidos');
    }

    // 3. Verificar setores "Secretaria"
    console.log('\n🏢 [3/4] VERIFICANDO SETORES "SECRETARIA"...');
    const setoresSecretaria = await pool.query(`
      SELECT id, name, campus_id 
      FROM sectors 
      WHERE name ILIKE '%secretaria%'
    `);
    
    if (setoresSecretaria.rows.length > 0) {
      console.log(`Found ${setoresSecretaria.rows.length} setores "Secretaria":`);
      setoresSecretaria.rows.forEach(setor => {
        console.log(`  - ${setor.name} (ID: ${setor.id})`);
      });
      
      console.log('\n🚫 MANTENDO setores "Secretaria" (podem ser usados futuramente)');
      console.log('💡 Apenas removemos os ITEMS, não os setores');
    }

    // 4. Verificação final
    console.log('\n✅ [4/4] VERIFICAÇÃO FINAL...');
    const finalCheck = await pool.query(`
      SELECT COUNT(*) as count 
      FROM inventory_items 
      WHERE setor ILIKE '%secretaria%' OR sala ILIKE '%103%'
    `);
    
    const remaining = parseInt(finalCheck.rows[0].count);
    if (remaining === 0) {
      console.log('🎉 LIMPEZA CONCLUÍDA! Nenhum item restante na Secretaria/Sala 103');
      console.log('💡 O "Inventário por Localização" não deve mais mostrar Secretaria');
    } else {
      console.log(`⚠️  Ainda restam ${remaining} items - pode precisar de limpeza manual`);
    }

    // 5. Informações importantes para o usuário
    console.log('\n📋 IMPORTANTE PARA O USUÁRIO:');
    console.log('1. 🔄 Faça logout e login novamente no sistema');
    console.log('2. 🗑️ Limpe o cache do navegador (Ctrl+Shift+Del)');
    console.log('3. 📱 Se usar localStorage, pode precisar limpar manualmente');
    console.log('4. ⏰ Aguarde alguns minutos para sincronização completa');

  } catch (error) {
    console.error('❌ ERRO na limpeza:', error.message);
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  limparDadosSecretaria().catch(console.error);
}

module.exports = { limparDadosSecretaria };