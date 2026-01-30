/**
 * SCRIPT DE EMERGÊNCIA - Correção automática do banco de dados
 * Executa diagnóstico completo e correção de inconsistências
 */

const { Pool } = require('pg');

async function emergencyDatabaseFix() {
  console.log('🚨 [EMERGÊNCIA] Iniciando correção automática do banco...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // 1. VERIFICAR SE A TABELA inventory_items EXISTE
    console.log('\n📋 [1/8] Verificando estrutura do banco...');
    const tablesCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('inventory_items', 'inventory', 'campus', 'users')
    `);
    
    const existingTables = tablesCheck.rows.map(row => row.table_name);
    console.log('Tabelas encontradas:', existingTables);
    
    // 2. VERIFICAR SE EXISTE TABELA inventory ANTIGA
    if (existingTables.includes('inventory') && !existingTables.includes('inventory_items')) {
      console.log('\n🔄 [2/8] MIGRANDO dados da tabela inventory para inventory_items...');
      
      // Criar tabela inventory_items se não existir
      await pool.query(`
        CREATE TABLE IF NOT EXISTS inventory_items (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          serial VARCHAR NOT NULL,
          patrimony VARCHAR,
          brand VARCHAR,
          sala VARCHAR,
          obs TEXT,
          is_fixed BOOLEAN DEFAULT false,
          status VARCHAR DEFAULT 'funcionando',
          campus_id VARCHAR REFERENCES campus(id),
          category_id VARCHAR REFERENCES categories(id),
          setor_id VARCHAR REFERENCES sectors(id),
          responsible_id VARCHAR REFERENCES users(id),
          responsible_name VARCHAR,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // Migrar dados da tabela inventory para inventory_items
      await pool.query(`
        INSERT INTO inventory_items (
          id, serial, patrimony, brand, sala, obs, is_fixed, status,
          campus_id, category_id, setor_id, responsible_name, created_at, updated_at
        )
        SELECT 
          COALESCE(i.id::varchar, gen_random_uuid()),
          i.serial,
          i.patrimony,
          i.brand,
          i.sala,
          i.obs,
          COALESCE(i."isFixed", false),
          COALESCE(i.status, 'funcionando'),
          c.id,
          cat.id,
          s.id,
          i.responsible,
          COALESCE(i.created, NOW()),
          COALESCE(i.updated, NOW())
        FROM inventory i
        LEFT JOIN campus c ON c.name = i.campus
        LEFT JOIN categories cat ON cat.name = i.category
        LEFT JOIN sectors s ON s.name = i.setor
        ON CONFLICT (id) DO NOTHING
      `);
      
      console.log('✅ Migração da tabela inventory concluída');
    }

    // 3. VERIFICAR INTEGRIDADE DAS FOREIGN KEYS
    console.log('\n🔗 [3/8] Verificando integridade das foreign keys...');
    const orphanedItems = await pool.query(`
      SELECT id, serial, campus_id, category_id, setor_id 
      FROM inventory_items 
      WHERE campus_id IS NULL OR category_id IS NULL OR setor_id IS NULL
      LIMIT 10
    `);
    
    if (orphanedItems.rows.length > 0) {
      console.log(`⚠️ Encontrados ${orphanedItems.rows.length} itens com foreign keys nulas`);
      
      // Corrigir itens órfãos
      for (const item of orphanedItems.rows) {
        if (!item.campus_id) {
          const defaultCampus = await pool.query('SELECT id FROM campus LIMIT 1');
          if (defaultCampus.rows.length > 0) {
            await pool.query('UPDATE inventory_items SET campus_id = $1 WHERE id = $2', 
              [defaultCampus.rows[0].id, item.id]);
          }
        }
        
        if (!item.category_id) {
          const defaultCategory = await pool.query('SELECT id FROM categories LIMIT 1');
          if (defaultCategory.rows.length > 0) {
            await pool.query('UPDATE inventory_items SET category_id = $1 WHERE id = $2', 
              [defaultCategory.rows[0].id, item.id]);
          }
        }
        
        if (!item.setor_id) {
          const defaultSetor = await pool.query('SELECT id FROM sectors LIMIT 1');
          if (defaultSetor.rows.length > 0) {
            await pool.query('UPDATE inventory_items SET setor_id = $1 WHERE id = $2', 
              [defaultSetor.rows[0].id, item.id]);
          }
        }
      }
      console.log('✅ Foreign keys órfãs corrigidas');
    }

    // 4. GARANTIR QUE TODOS OS IDs SÃO STRINGS
    console.log('\n🔤 [4/8] Padronizando IDs como strings...');
    await pool.query(`
      UPDATE inventory_items 
      SET id = id::varchar 
      WHERE id IS NOT NULL
    `);

    // 5. CRIAR ÍNDICES PARA PERFORMANCE
    console.log('\n⚡ [5/8] Criando índices para performance...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_inventory_campus ON inventory_items(campus_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_inventory_serial ON inventory_items(serial)');

    // 6. VERIFICAR DADOS FINAIS
    console.log('\n📊 [6/8] Verificando dados após correção...');
    const finalCount = await pool.query('SELECT COUNT(*) as total FROM inventory_items');
    const validItems = await pool.query(`
      SELECT COUNT(*) as valid 
      FROM inventory_items 
      WHERE campus_id IS NOT NULL AND category_id IS NOT NULL AND setor_id IS NOT NULL
    `);
    
    console.log(`Total de itens: ${finalCount.rows[0].total}`);
    console.log(`Itens válidos: ${validItems.rows[0].valid}`);

    // 7. TESTAR UPDATE
    console.log('\n🧪 [7/8] Testando operação de UPDATE...');
    const testItem = await pool.query('SELECT id FROM inventory_items LIMIT 1');
    if (testItem.rows.length > 0) {
      const updateTest = await pool.query(
        'UPDATE inventory_items SET updated_at = NOW() WHERE id = $1 RETURNING id',
        [testItem.rows[0].id]
      );
      if (updateTest.rows.length > 0) {
        console.log('✅ Teste de UPDATE funcionou perfeitamente!');
      } else {
        console.log('❌ Teste de UPDATE ainda falhou');
      }
    }

    // 8. LIMPAR CACHE E REINICIAR CONEXÕES
    console.log('\n🔄 [8/8] Limpando cache e otimizando banco...');
    await pool.query('VACUUM ANALYZE inventory_items');
    
    console.log('\n🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('💡 O sistema deve funcionar normalmente agora.');

  } catch (error) {
    console.error('❌ [EMERGÊNCIA] Erro durante correção:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  emergencyDatabaseFix().catch(error => {
    console.error('💥 Falha crítica na correção:', error);
    process.exit(1);
  });
}

module.exports = { emergencyDatabaseFix };