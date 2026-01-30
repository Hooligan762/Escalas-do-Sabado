/**
 * 🔍 DIAGNÓSTICO: Verifica se o campo is_fixed existe na tabela inventory_items
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function diagnosticarCampoFixed() {
  console.log('🔍 DIAGNÓSTICO: Campo is_fixed na tabela inventory_items');
  console.log('='.repeat(60));

  try {
    // 1. Verificar colunas da tabela
    console.log('\n📋 [1/4] VERIFICANDO COLUNAS DA TABELA inventory_items:');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'inventory_items' 
      ORDER BY ordinal_position
    `);
    
    console.log(`Total de colunas: ${columns.rows.length}`);
    columns.rows.forEach((col, index) => {
      const isFixed = col.column_name.toLowerCase().includes('fixed');
      const marker = isFixed ? '🎯' : '  ';
      console.log(`${marker} ${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // 2. Verificar especificamente campo is_fixed
    console.log('\n🔍 [2/4] PROCURANDO CAMPO is_fixed:');
    const fixedColumn = columns.rows.find(col => col.column_name.toLowerCase() === 'is_fixed');
    
    if (fixedColumn) {
      console.log('✅ Campo is_fixed ENCONTRADO!');
      console.log(`   - Tipo: ${fixedColumn.data_type}`);
      console.log(`   - Nulo: ${fixedColumn.is_nullable}`);
      console.log(`   - Padrão: ${fixedColumn.column_default || 'Nenhum'}`);
    } else {
      console.log('❌ Campo is_fixed NÃO ENCONTRADO!');
      
      // Verificar variações do campo
      const variations = ['fixed', 'is_fixed', 'isfixed', 'item_fixed'];
      console.log('\n🔍 Procurando variações...');
      variations.forEach(variation => {
        const found = columns.rows.find(col => col.column_name.toLowerCase().includes(variation));
        if (found) {
          console.log(`✅ Encontrada variação: ${found.column_name}`);
        }
      });
    }

    // 3. Verificar alguns registros para ver como está o campo
    console.log('\n📊 [3/4] VERIFICANDO DADOS EXISTENTES:');
    const sampleQuery = fixedColumn 
      ? `SELECT id, serial, is_fixed FROM inventory_items LIMIT 5`
      : `SELECT id, serial FROM inventory_items LIMIT 5`;
      
    const sampleData = await pool.query(sampleQuery);
    
    if (sampleData.rows.length > 0) {
      console.log(`Amostra de ${sampleData.rows.length} registros:`);
      sampleData.rows.forEach((row, index) => {
        const fixedValue = fixedColumn ? row.is_fixed : 'N/A';
        console.log(`   ${index + 1}. ID: ${row.id.substring(0, 8)}... | Serial: ${row.serial} | is_fixed: ${fixedValue}`);
      });
    } else {
      console.log('⚠️ Nenhum registro encontrado na tabela');
    }

    // 4. Tentar adicionar campo se não existir
    if (!fixedColumn) {
      console.log('\n🛠️ [4/4] CRIANDO CAMPO is_fixed:');
      try {
        await pool.query(`ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS is_fixed BOOLEAN DEFAULT false`);
        console.log('✅ Campo is_fixed criado com sucesso!');
        
        // Verificar se foi criado
        const checkAgain = await pool.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'inventory_items' AND column_name = 'is_fixed'
        `);
        
        if (checkAgain.rows.length > 0) {
          console.log('✅ Confirmado: Campo is_fixed agora existe!');
        }
      } catch (error) {
        console.error('❌ Erro ao criar campo is_fixed:', error.message);
      }
    } else {
      console.log('\n✅ [4/4] Campo is_fixed já existe - nenhuma ação necessária');
    }

  } catch (error) {
    console.error('❌ ERRO no diagnóstico:', error.message);
  } finally {
    await pool.end();
  }
}

// Executar diagnóstico
diagnosticarCampoFixed().catch(console.error);