/**
 * Script de diagnóstico para investigar erro "Item não encontrado para atualização"
 * Executa em produção para identificar problemas no banco
 */

const { Pool } = require('pg');

async function diagnoseProdError() {
  console.log('🔍 [DIAGNÓSTICO] Investigando erro de atualização de item...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔌 [DIAGNÓSTICO] Conectando ao PostgreSQL...');
    
    // 1. Verificar estrutura da tabela inventory_items
    console.log('\n📋 [1/6] Verificando estrutura da tabela inventory_items...');
    const tableStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'inventory_items' 
      ORDER BY ordinal_position
    `);
    console.log('Colunas encontradas:', tableStructure.rows.length);
    tableStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // 2. Contar itens na tabela
    console.log('\n📊 [2/6] Contando itens no inventário...');
    const countRes = await pool.query('SELECT COUNT(*) as total FROM inventory_items');
    console.log(`Total de itens no banco: ${countRes.rows[0].total}`);

    // 3. Verificar primeiros 5 itens
    console.log('\n📝 [3/6] Listando primeiros 5 itens...');
    const itemsRes = await pool.query('SELECT id, serial, brand, status FROM inventory_items LIMIT 5');
    console.log('Primeiros itens:');
    itemsRes.rows.forEach(item => {
      console.log(`  - ID: ${item.id}, Serial: ${item.serial}, Brand: ${item.brand}, Status: ${item.status}`);
    });

    // 4. Verificar se existe coluna is_fixed
    console.log('\n🔧 [4/6] Verificando coluna is_fixed...');
    const fixedColumn = await pool.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'inventory_items' AND column_name = 'is_fixed'
    `);
    if (fixedColumn.rows.length > 0) {
      console.log('✅ Coluna is_fixed existe:', fixedColumn.rows[0]);
    } else {
      console.log('❌ Coluna is_fixed NÃO existe - isso pode causar erros!');
    }

    // 5. Verificar constraints e índices
    console.log('\n🔐 [5/6] Verificando constraints...');
    const constraints = await pool.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'inventory_items'
    `);
    console.log('Constraints encontradas:');
    constraints.rows.forEach(constraint => {
      console.log(`  - ${constraint.constraint_name}: ${constraint.constraint_type}`);
    });

    // 6. Testar uma query de update simples
    console.log('\n🧪 [6/6] Testando capacidade de update...');
    if (countRes.rows[0].total > 0) {
      const testItem = await pool.query('SELECT id FROM inventory_items LIMIT 1');
      if (testItem.rows.length > 0) {
        const testId = testItem.rows[0].id;
        console.log(`Testando update no item ID: ${testId}`);
        
        try {
          const updateTest = await pool.query(
            'UPDATE inventory_items SET updated_at = NOW() WHERE id = $1 RETURNING id',
            [testId]
          );
          if (updateTest.rows.length > 0) {
            console.log('✅ Update de teste funcionou!');
          } else {
            console.log('❌ Update de teste retornou 0 linhas afetadas');
          }
        } catch (updateError) {
          console.log('❌ Erro no update de teste:', updateError.message);
        }
      }
    }

    console.log('\n✅ [DIAGNÓSTICO] Análise completa!');

  } catch (error) {
    console.error('❌ [DIAGNÓSTICO] Erro durante análise:', error);
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  diagnoseProdError().catch(console.error);
}

module.exports = { diagnoseProdError };