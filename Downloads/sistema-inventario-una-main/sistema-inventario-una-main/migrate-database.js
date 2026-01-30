/**
 * Script de migração automática para corrigir constraints do banco de dados
 * Executa automaticamente quando a aplicação inicia no Railway
 * 
 * LOCALIZAÇÃO: /app/migrate-database.js (raiz do projeto)
 */

const { Pool } = require('pg');

async function fixDatabaseConstraints() {
  console.log('🔧 [Database Migration] Script localizado em:', __filename);
  console.log('🔧 [Database Migration] Iniciando correção de constraints...');
  
  // Usar variável de ambiente do Railway
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔌 [Database Migration] Conectando ao PostgreSQL...');
    
    // 1. Verificar constraints existentes
    console.log('🔍 [Database Migration] Verificando constraints existentes...');
    const existingConstraints = await pool.query(`
      SELECT conname, contype
      FROM pg_constraint 
      WHERE conrelid = 'sectors'::regclass AND contype = 'u'
    `);
    
    console.log('📊 [Database Migration] Constraints encontradas:', existingConstraints.rows);
    
    // 2. Remover constraint antiga de setores (se existir)
    const hasOldSectorConstraint = existingConstraints.rows.some(row => row.conname === 'sectors_name_key');
    if (hasOldSectorConstraint) {
      console.log('🗑️ [Database Migration] Removendo constraint antiga: sectors_name_key');
      await pool.query('ALTER TABLE sectors DROP CONSTRAINT IF EXISTS sectors_name_key');
      console.log('✅ [Database Migration] Constraint sectors_name_key removida');
    } else {
      console.log('ℹ️ [Database Migration] Constraint sectors_name_key já foi removida');
    }
    
    // 3. Adicionar constraint nova de setores (se não existir)
    const hasNewSectorConstraint = existingConstraints.rows.some(row => row.conname === 'sectors_name_campus_unique');
    if (!hasNewSectorConstraint) {
      console.log('➕ [Database Migration] Adicionando constraint nova: sectors_name_campus_unique');
      await pool.query('ALTER TABLE sectors ADD CONSTRAINT sectors_name_campus_unique UNIQUE (name, campus_id)');
      console.log('✅ [Database Migration] Constraint sectors_name_campus_unique adicionada');
    } else {
      console.log('ℹ️ [Database Migration] Constraint sectors_name_campus_unique já existe');
    }
    
    // 4. Verificar constraints de categorias
    console.log('🔍 [Database Migration] Verificando constraints de categorias...');
    const categoryConstraints = await pool.query(`
      SELECT conname, contype
      FROM pg_constraint 
      WHERE conrelid = 'categories'::regclass AND contype = 'u'
    `);
    
    console.log('📊 [Database Migration] Constraints de categorias:', categoryConstraints.rows);
    
    // 5. Remover constraint antiga de categorias (se existir)
    const hasOldCategoryConstraint = categoryConstraints.rows.some(row => row.conname === 'categories_name_key');
    if (hasOldCategoryConstraint) {
      console.log('🗑️ [Database Migration] Removendo constraint antiga: categories_name_key');
      await pool.query('ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key');
      console.log('✅ [Database Migration] Constraint categories_name_key removida');
    } else {
      console.log('ℹ️ [Database Migration] Constraint categories_name_key já foi removida');
    }
    
    // 6. Adicionar constraint nova de categorias (se não existir)
    const hasNewCategoryConstraint = categoryConstraints.rows.some(row => row.conname === 'categories_name_campus_unique');
    if (!hasNewCategoryConstraint) {
      console.log('➕ [Database Migration] Adicionando constraint nova: categories_name_campus_unique');
      await pool.query('ALTER TABLE categories ADD CONSTRAINT categories_name_campus_unique UNIQUE (name, campus_id)');
      console.log('✅ [Database Migration] Constraint categories_name_campus_unique adicionada');
    } else {
      console.log('ℹ️ [Database Migration] Constraint categories_name_campus_unique já existe');
    }
    
    // 7. Verificar resultado final
    console.log('🔍 [Database Migration] Verificando resultado final...');
    
    // Verificar constraints de setores
    const sectorsConstraints = await pool.query(`
      SELECT conname as constraint_name
      FROM pg_constraint 
      WHERE conrelid = 'sectors'::regclass AND contype = 'u'
    `);
    
    // Verificar constraints de categorias
    const categoriesConstraints = await pool.query(`
      SELECT conname as constraint_name
      FROM pg_constraint 
      WHERE conrelid = 'categories'::regclass AND contype = 'u'
    `);
    
    console.log('📋 [Database Migration] Constraints finais:');
    console.log('  SECTORS:');
    sectorsConstraints.rows.forEach(row => {
      console.log(`    - ${row.constraint_name}`);
    });
    console.log('  CATEGORIES:');
    categoriesConstraints.rows.forEach(row => {
      console.log(`    - ${row.constraint_name}`);
    });
    
    console.log('🎉 [Database Migration] Migração concluída com sucesso!');
    console.log('✅ [Database Migration] Campus agora são completamente isolados para setores e categorias!');
    
  } catch (error) {
    console.error('❌ [Database Migration] Erro durante migração:', error);
    throw error;
  } finally {
    await pool.end();
    console.log('🔌 [Database Migration] Conexão fechada');
  }
}

module.exports = { fixDatabaseConstraints };

// Executar se chamado diretamente
if (require.main === module) {
  fixDatabaseConstraints()
    .then(() => {
      console.log('✅ Migração executada com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na migração:', error);
      process.exit(1);
    });
}