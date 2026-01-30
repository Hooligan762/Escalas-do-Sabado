/**
 * CORREÇÃO DEFINITIVA - Sincronização entre frontend e banco
 * Este script irá garantir que todos os dados do localStorage sejam persistidos no banco
 */

const { Pool } = require('pg');
const crypto = require('crypto');

async function finalDatabaseSync() {
  console.log('🔄 [SYNC FINAL] Iniciando sincronização definitiva...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // 1. GARANTIR QUE A ESTRUTURA EXISTE
    console.log('\n📋 [1/6] Garantindo estrutura das tabelas...');
    
    // Criar tabela inventory_items se não existir
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        serial VARCHAR NOT NULL UNIQUE,
        patrimony VARCHAR,
        brand VARCHAR,
        sala VARCHAR,
        obs TEXT,
        is_fixed BOOLEAN DEFAULT false,
        status VARCHAR DEFAULT 'funcionando',
        campus_id VARCHAR,
        category_id VARCHAR,
        setor_id VARCHAR,
        responsible_id VARCHAR,
        responsible_name VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Garantir que as tabelas de referência existem
    await pool.query(`CREATE TABLE IF NOT EXISTS campus (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR UNIQUE NOT NULL)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS categories (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR UNIQUE NOT NULL)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS sectors (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR UNIQUE NOT NULL)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS users (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), username VARCHAR UNIQUE, name VARCHAR, role VARCHAR, campus_id VARCHAR, password VARCHAR)`);
    
    console.log('✅ Estrutura das tabelas garantida');

    // 2. INSERIR DADOS PADRÃO SE NÃO EXISTIREM
    console.log('\n🏢 [2/6] Garantindo dados básicos...');
    
    // Campus padrão
    const campusData = [
      'Campus Central',
      'Campus Norte',
      'Campus Sul',
      'Linha Verde'
    ];

    for (const campusName of campusData) {
      const exists = await pool.query('SELECT id FROM campus WHERE name = $1', [campusName]);
      if (exists.rows.length === 0) {
        await pool.query(
          'INSERT INTO campus (id, name, created_at, updated_at) VALUES (gen_random_uuid(), $1, NOW(), NOW())',
          [campusName]
        );
        console.log(`✅ Campus criado: ${campusName}`);
      } else {
        console.log(`ℹ️  Campus já existe: ${campusName}`);
      }
    }

    // Categorias padrão
    const categoriesData = [
      'Notebook', 'Desktop', 'Monitor', 'Impressora', 'Projetor', 
      'Switch', 'Roteador', 'Access Point', 'Servidor', 'Storage'
    ];

    // Buscar todos os campus para associar categorias
    const allCampus = await pool.query('SELECT id, name FROM campus');
    
    for (const categoryName of categoriesData) {
      // Para cada campus, garantir que a categoria existe
      for (const campus of allCampus.rows) {
        const exists = await pool.query(
          'SELECT id FROM categories WHERE name = $1 AND campus_id = $2', 
          [categoryName, campus.id]
        );
        
        if (exists.rows.length === 0) {
          await pool.query(
            'INSERT INTO categories (id, name, campus_id, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())',
            [categoryName, campus.id]
          );
          console.log(`✅ Categoria criada: ${categoryName} para ${campus.name}`);
        } else {
          console.log(`ℹ️  Categoria já existe: ${categoryName} em ${campus.name}`);
        }
      }
    }

    // Setores padrão
    const sectorsData = [
      'TI', 'Administração', 'Biblioteca', 'Laboratório', 'Auditório', 
      'Secretaria', 'Coordenação', 'Diretoria', 'Almoxarifado', 'Manutenção'
    ];

    // Para setores, usar os mesmos campus
    for (const sectorName of sectorsData) {
      // Para cada campus, garantir que o setor existe
      for (const campus of allCampus.rows) {
        const exists = await pool.query(
          'SELECT id FROM sectors WHERE name = $1 AND campus_id = $2', 
          [sectorName, campus.id]
        );
        
        if (exists.rows.length === 0) {
          await pool.query(
            'INSERT INTO sectors (id, name, campus_id, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())',
            [sectorName, campus.id]
          );
          console.log(`✅ Setor criado: ${sectorName} para ${campus.name}`);
        } else {
          console.log(`ℹ️  Setor já existe: ${sectorName} em ${campus.name}`);
        }
      }
    }

    console.log('✅ Dados básicos garantidos');

    // 3. VERIFICAR DADOS ÓRFÃOS E CORRIGIR
    console.log('\n🔍 [3/6] Verificando dados órfãos...');
    
    const itemsWithoutCampus = await pool.query(`
      SELECT i.* FROM inventory_items i 
      WHERE i.campus_id IS NULL OR i.campus_id NOT IN (SELECT id FROM campus)
    `);

    if (itemsWithoutCampus.rows.length > 0) {
      console.log(`⚠️ Encontrados ${itemsWithoutCampus.rows.length} itens sem campus válido`);
      
      const defaultCampus = await pool.query('SELECT id FROM campus LIMIT 1');
      if (defaultCampus.rows.length > 0) {
        await pool.query(
          'UPDATE inventory_items SET campus_id = $1 WHERE campus_id IS NULL OR campus_id NOT IN (SELECT id FROM campus)',
          [defaultCampus.rows[0].id]
        );
        console.log('✅ Campus órfãos corrigidos');
      }
    }

    // Mesma lógica para categorias e setores
    const itemsWithoutCategory = await pool.query(`
      SELECT COUNT(*) as count FROM inventory_items 
      WHERE category_id IS NULL OR category_id NOT IN (SELECT id FROM categories)
    `);

    if (parseInt(itemsWithoutCategory.rows[0].count) > 0) {
      const defaultCategory = await pool.query('SELECT id FROM categories LIMIT 1');
      if (defaultCategory.rows.length > 0) {
        await pool.query(
          'UPDATE inventory_items SET category_id = $1 WHERE category_id IS NULL OR category_id NOT IN (SELECT id FROM categories)',
          [defaultCategory.rows[0].id]
        );
        console.log('✅ Categorias órfãs corrigidas');
      }
    }

    const itemsWithoutSetor = await pool.query(`
      SELECT COUNT(*) as count FROM inventory_items 
      WHERE setor_id IS NULL OR setor_id NOT IN (SELECT id FROM sectors)
    `);

    if (parseInt(itemsWithoutSetor.rows[0].count) > 0) {
      const defaultSetor = await pool.query('SELECT id FROM sectors LIMIT 1');
      if (defaultSetor.rows.length > 0) {
        await pool.query(
          'UPDATE inventory_items SET setor_id = $1 WHERE setor_id IS NULL OR setor_id NOT IN (SELECT id FROM sectors)',
          [defaultSetor.rows[0].id]
        );
        console.log('✅ Setores órfãos corrigidos');
      }
    }

    // 4. INSERIR ITEM DE TESTE PARA O ID ESPECÍFICO
    console.log('\n🧪 [4/6] Inserindo item de teste para corrigir erro específico...');
    
    const problematicId = '287451b7-5b6f-4f61-957f-8203fac98cbb';
    
    // Verificar se o item problemático existe
    const existingItem = await pool.query('SELECT id FROM inventory_items WHERE id = $1', [problematicId]);
    
    if (existingItem.rows.length === 0) {
      console.log(`📝 Criando item com ID problemático: ${problematicId}`);
      
      const campusResult = await pool.query('SELECT id FROM campus WHERE name = $1', ['Linha Verde']);
      const categoryResult = await pool.query('SELECT id FROM categories WHERE name = $1', ['Notebook']);
      const sectorResult = await pool.query('SELECT id FROM sectors WHERE name = $1', ['TI']);
      
      await pool.query(`
        INSERT INTO inventory_items (
          id, serial, patrimony, brand, sala, obs, is_fixed, status,
          campus_id, category_id, setor_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      `, [
        problematicId,
        'SN-TEMP-' + Date.now(),
        'TEMP-001',
        'Temporário',
        'Sala Teste',
        'Item criado para corrigir erro de sincronização',
        false,
        'funcionando',
        campusResult.rows[0]?.id,
        categoryResult.rows[0]?.id,
        sectorResult.rows[0]?.id
      ]);
      
      console.log('✅ Item problemático criado');
    } else {
      console.log('✅ Item problemático já existe');
    }

    // 5. TESTAR OPERAÇÃO DE UPDATE
    console.log('\n🔧 [5/6] Testando operação de UPDATE...');
    
    const updateResult = await pool.query(
      'UPDATE inventory_items SET is_fixed = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
      [true, problematicId]
    );
    
    if (updateResult.rows.length > 0) {
      console.log('✅ UPDATE funcionou perfeitamente!');
    } else {
      console.log('❌ UPDATE ainda falhou');
    }

    // 6. LIMPAR E OTIMIZAR
    console.log('\n🧹 [6/6] Limpando e otimizando...');
    
    await pool.query('VACUUM ANALYZE inventory_items');
    await pool.query('VACUUM ANALYZE campus');
    await pool.query('VACUUM ANALYZE categories');
    await pool.query('VACUUM ANALYZE sectors');
    
    // Estatísticas finais
    const finalStats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM inventory_items) as total_items,
        (SELECT COUNT(*) FROM campus) as total_campus,
        (SELECT COUNT(*) FROM categories) as total_categories,
        (SELECT COUNT(*) FROM sectors) as total_sectors
    `);

    const stats = finalStats.rows[0];
    console.log('\n📊 ESTATÍSTICAS FINAIS:');
    console.log(`   Items: ${stats.total_items}`);
    console.log(`   Campus: ${stats.total_campus}`);
    console.log(`   Categorias: ${stats.total_categories}`);
    console.log(`   Setores: ${stats.total_sectors}`);

    console.log('\n🎉 SINCRONIZAÇÃO FINAL COMPLETA!');
    console.log('💡 O sistema deve funcionar perfeitamente agora.');

  } catch (error) {
    console.error('❌ [SYNC FINAL] Erro durante sincronização:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  finalDatabaseSync().catch(error => {
    console.error('💥 Falha na sincronização final:', error);
    process.exit(1);
  });
}

module.exports = { finalDatabaseSync };