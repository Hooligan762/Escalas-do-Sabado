const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🚀 Iniciando configuração automática do banco Railway...');
  
  if (!process.env.DATABASE_URL) {
    console.log('⚠️ DATABASE_URL não encontrada, pulando configuração.');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // Adicionar timeout e tentativas para Railway
    connectionTimeoutMillis: 10000,
    query_timeout: 10000,
  });

  try {
    // Tentar conectar com timeout
    console.log('🔌 Tentando conectar ao banco...');
    const client = await pool.connect();
    client.release();
    console.log('✅ Conexão estabelecida!');
    
    // Verificar se as tabelas já existem
    console.log('🔍 Verificando se banco já foi configurado...');
    const tableCheck = await pool.query(
      "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campus'"
    );
    
    const tablesExist = parseInt(tableCheck.rows[0].count) > 0;
    
    if (!tablesExist) {
      console.log('🔧 Configurando banco pela primeira vez...');
      
      // Ler e executar script SQL
      const sqlScript = fs.readFileSync(path.join(__dirname, 'railway-database-setup.sql'), 'utf8');
      
      // Executar script completo
      await pool.query(sqlScript);
    } else {
      console.log('✅ Banco já existe, verificando correções...');
    }
    
    console.log('🔧 Verificando e corrigindo campus Administrador...');
    
    // Garantir que campus Administrador existe
    const adminCampusCheck = await pool.query("SELECT * FROM campus WHERE name = 'Administrador'");
    if (adminCampusCheck.rows.length === 0) {
      console.log('➕ Adicionando campus Administrador...');
      await pool.query("INSERT INTO campus (id, name) VALUES ('admin-campus', 'Administrador')");
    }
    
    // CRÍTICO: Verificar e adicionar colunas campus_id se não existirem
    console.log('🔧 Verificando colunas campus_id...');
    
    const campusIdCheck = await pool.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_name IN ('categories', 'sectors') 
      AND column_name = 'campus_id'
    `);
    
    console.log(`📋 Colunas campus_id encontradas: ${campusIdCheck.rows.length}/2`);
    
    if (campusIdCheck.rows.length < 2) {
      console.log('❌ Colunas campus_id faltando! Adicionando...');
      
      // Adicionar coluna campus_id na tabela categories
      try {
        await pool.query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS campus_id TEXT');
        console.log('✅ Coluna campus_id adicionada na tabela categories');
      } catch (e) {
        console.log('⚠️ Coluna campus_id já existe na tabela categories');
      }
      
      // Adicionar coluna campus_id na tabela sectors
      try {
        await pool.query('ALTER TABLE sectors ADD COLUMN IF NOT EXISTS campus_id TEXT');
        console.log('✅ Coluna campus_id adicionada na tabela sectors');
      } catch (e) {
        console.log('⚠️ Coluna campus_id já existe na tabela sectors');
      }
      
      // Buscar ou criar campus Administrador
      let adminCampusId = await pool.query("SELECT id FROM campus WHERE name = 'Administrador'");
      let adminId = adminCampusId.rows[0]?.id;
      
      // Se não existir, criar campus Administrador
      if (!adminId) {
        console.log('🔧 Criando campus Administrador...');
        const newCampus = await pool.query(`
          INSERT INTO campus (id, name, created_at, updated_at)
          VALUES ('admin-campus', 'Administrador', NOW(), NOW())
          RETURNING id
        `);
        adminId = newCampus.rows[0].id;
        console.log('✅ Campus Administrador criado!');
      }
      
      if (adminId) {
        console.log(`🏢 Campus Administrador ID: ${adminId}`);
        
        // Atualizar categorias sem campus_id
        const catUpdate = await pool.query('UPDATE categories SET campus_id = $1 WHERE campus_id IS NULL', [adminId]);
        console.log(`📦 ${catUpdate.rowCount} categorias associadas ao campus Administrador`);
        
        // Atualizar setores sem campus_id
        const secUpdate = await pool.query('UPDATE sectors SET campus_id = $1 WHERE campus_id IS NULL', [adminId]);
        console.log(`🏗️ ${secUpdate.rowCount} setores associados ao campus Administrador`);
        
        // Tornar colunas NOT NULL apenas se houver dados
        const catCount = await pool.query('SELECT COUNT(*) FROM categories WHERE campus_id IS NOT NULL');
        const secCount = await pool.query('SELECT COUNT(*) FROM sectors WHERE campus_id IS NOT NULL');
        
        if (parseInt(catCount.rows[0].count) > 0) {
          await pool.query('ALTER TABLE categories ALTER COLUMN campus_id SET NOT NULL');
          console.log('🔒 Coluna categories.campus_id definida como NOT NULL');
        }
        
        if (parseInt(secCount.rows[0].count) > 0) {
          await pool.query('ALTER TABLE sectors ALTER COLUMN campus_id SET NOT NULL');
          console.log('🔒 Coluna sectors.campus_id definida como NOT NULL');
        }
      }
    } else {
      console.log('✅ Colunas campus_id já existem!');
    }
    
    // CRÍTICO: Verificar e adicionar coluna is_fixed se não existir
    console.log('🔧 Verificando coluna is_fixed...');
    
    const isFixedCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'inventory_items' AND column_name = 'is_fixed'
    `);
    
    if (isFixedCheck.rows.length === 0) {
      console.log('➕ Adicionando coluna is_fixed na tabela inventory_items...');
      try {
        await pool.query('ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS is_fixed BOOLEAN DEFAULT false');
        console.log('✅ Coluna is_fixed adicionada com sucesso!');
      } catch (e) {
        console.log('⚠️ Coluna is_fixed já existe ou erro ao adicionar:', e.message);
      }
    } else {
      console.log('✅ Coluna is_fixed já existe!');
    }
    
    // CRÍTICO: Corrigir constraints UNIQUE para permitir mesmo nome em campus diferentes
    console.log('🔧 Verificando constraints UNIQUE de categorias e setores...');
    
    try {
      // Remover constraints antigas que impedem duplicatas globais
      await pool.query('ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key');
      await pool.query('ALTER TABLE sectors DROP CONSTRAINT IF EXISTS sectors_name_key');
      
      // Adicionar constraints compostas (nome + campus_id)
      await pool.query('ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_campus_id_key');
      await pool.query('ALTER TABLE categories ADD CONSTRAINT categories_name_campus_id_key UNIQUE (name, campus_id)');
      
      await pool.query('ALTER TABLE sectors DROP CONSTRAINT IF EXISTS sectors_name_campus_id_key');
      await pool.query('ALTER TABLE sectors ADD CONSTRAINT sectors_name_campus_id_key UNIQUE (name, campus_id)');
      
      console.log('✅ Constraints UNIQUE corrigidas - mesmo nome permitido em campus diferentes!');
    } catch (e) {
      console.log('⚠️ Erro ao corrigir constraints (podem já estar corretas):', e.message);
    }
    
    // Garantir que usuários admin estão associados ao campus correto
    console.log('🔄 Verificando usuários admin...');
    const adminUsersWithoutCampus = await pool.query(`
      SELECT username FROM users 
      WHERE role = 'admin' AND (campus_id IS NULL OR campus_id != 'admin-campus')
    `);
    
    if (adminUsersWithoutCampus.rows.length > 0) {
      console.log('🔧 Corrigindo associação de campus para usuários admin...');
      
      // Primeiro, garantir que existe um campus admin
      let adminCampusForUsers = await pool.query("SELECT id FROM campus WHERE name = 'Administrador'");
      let adminCampusId = adminCampusForUsers.rows[0]?.id;
      
      if (!adminCampusId) {
        const newCampus = await pool.query(`
          INSERT INTO campus (id, name, created_at, updated_at)
          VALUES ('admin-campus', 'Administrador', NOW(), NOW())
          RETURNING id
        `);
        adminCampusId = newCampus.rows[0].id;
      }
      
      await pool.query(`
        UPDATE users 
        SET campus_id = $1 
        WHERE role = 'admin' AND (campus_id IS NULL OR campus_id != $1)
      `, [adminCampusId]);
    }
    
    // Verificar resultado final
    const adminUsersCheck = await pool.query(`
      SELECT u.username, u.name, c.name as campus 
      FROM users u 
      LEFT JOIN campus c ON u.campus_id = c.id 
      WHERE u.role = 'admin'
    `);
    
    console.log('👥 Usuários admin configurados:');
    adminUsersCheck.rows.forEach(user => {
      console.log(`   - ${user.username} (${user.name}) → Campus: ${user.campus}`);
    });
    
    console.log('✅ Banco configurado com sucesso!');
    
    // Verificar dados inseridos
    const campusCount = await pool.query('SELECT COUNT(*) FROM campus');
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    
    console.log(`📊 Campus criados: ${campusCount.rows[0].count}`);
    console.log(`👥 Usuários criados: ${usersCount.rows[0].count}`);
    
  } catch (error) {
    // Se for erro de conexão durante build, apenas avisar mas não falhar
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('⚠️ Banco não disponível durante build (normal no Railway)');
      console.log('   Setup será executado automaticamente no start');
      return; // Não falhar o processo
    }
    
    console.error('❌ Erro ao configurar banco:', error);
    throw error;
  } finally {
    try {
      await pool.end();
    } catch (e) {
      console.log('⚠️ Aviso: erro ao fechar pool de conexões:', e.message);
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;