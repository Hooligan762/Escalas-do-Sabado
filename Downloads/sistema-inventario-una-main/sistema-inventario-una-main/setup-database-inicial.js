#!/usr/bin/env node

console.log('🗄️ SETUP INICIAL DO BANCO RAILWAY');
console.log('=================================');

async function criarEstruturaBanco() {
  if (!process.env.DATABASE_URL) {
    console.log('⚠️ DATABASE_URL não encontrada');
    return;
  }

  const { Pool } = require('pg');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 2,
    connectionTimeoutMillis: 15000,
  });

  let client;
  try {
    console.log('🔌 Conectando ao PostgreSQL...');
    client = await pool.connect();
    console.log('✅ Conectado!');

    // Verificar se já tem estrutura
    const tablesCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    const hasStructure = parseInt(tablesCheck.rows[0].count) > 0;
    console.log(`📋 Tabelas existentes: ${tablesCheck.rows[0].count}`);

    if (!hasStructure) {
      console.log('\n🔧 CRIANDO ESTRUTURA COMPLETA...');
      
      // Criar tabelas na ordem correta
      console.log('📋 Criando tabela campus...');
      await client.query(`
        CREATE TABLE campus (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('📋 Criando tabela categories...');
      await client.query(`
        CREATE TABLE categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          campus_id TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(name, campus_id)
        )
      `);

      console.log('📋 Criando tabela sectors...');
      await client.query(`
        CREATE TABLE sectors (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          campus_id TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(name, campus_id)
        )
      `);

      console.log('📋 Criando tabela inventory...');
      await client.query(`
        CREATE TABLE inventory (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          category_id TEXT,
          sector_id TEXT,
          campus_id TEXT,
          quantity INTEGER DEFAULT 1,
          location TEXT,
          status TEXT DEFAULT 'ativo',
          is_fixed BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('📋 Criando tabela users...');
      await client.query(`
        CREATE TABLE users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          campus_id TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('📋 Criando tabela audit_logs...');
      await client.query(`
        CREATE TABLE audit_logs (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          action TEXT NOT NULL,
          details TEXT,
          campus_id TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Inserir dados básicos
      console.log('\n📝 Inserindo dados básicos...');
      
      await client.query(`
        INSERT INTO campus (id, name) VALUES 
        ('liberdade', 'Campus Liberdade'),
        ('aimores', 'Campus Aimorés'),
        ('admin-campus', 'Administrador')
      `);

      await client.query(`
        INSERT INTO categories (id, name, campus_id) VALUES 
        ('informatica-liberdade', 'Informática', 'liberdade'),
        ('mobiliario-liberdade', 'Mobiliário', 'liberdade'),
        ('equipamentos-liberdade', 'Equipamentos', 'liberdade'),
        ('informatica-aimores', 'Informática', 'aimores'),
        ('mobiliario-aimores', 'Mobiliário', 'aimores'),
        ('equipamentos-aimores', 'Equipamentos', 'aimores')
      `);

      await client.query(`
        INSERT INTO sectors (id, name, campus_id) VALUES 
        ('ti-liberdade', 'Tecnologia da Informação', 'liberdade'),
        ('administracao-liberdade', 'Administração', 'liberdade'),
        ('secretaria-liberdade', 'Secretaria', 'liberdade'),
        ('ti-aimores', 'Tecnologia da Informação', 'aimores'),
        ('administracao-aimores', 'Administração', 'aimores'),
        ('secretaria-aimores', 'Secretaria', 'aimores')
      `);

      // Criar usuários admin
      const bcrypt = require('bcrypt');
      const adminPasswordHash = await bcrypt.hash('admin123', 10);
      
      await client.query(`
        INSERT INTO users (id, username, password_hash, role, campus_id) VALUES 
        ('admin-liberdade', 'admin_liberdade', $1, 'admin', 'liberdade'),
        ('admin-aimores', 'admin_aimores', $1, 'admin', 'aimores'),
        ('super-admin', 'super_admin', $1, 'super_admin', 'admin-campus')
      `, [adminPasswordHash]);

      console.log('🎉 ESTRUTURA CRIADA COM SUCESSO!');
      
    } else {
      console.log('✅ Estrutura já existe');
      
      // Garantir que o campo is_fixed existe
      try {
        const fieldCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'inventory' AND column_name = 'is_fixed'
        `);
        if (fieldCheck.rows.length === 0) {
          await client.query('ALTER TABLE inventory ADD COLUMN is_fixed BOOLEAN DEFAULT false');
          console.log('✅ Campo is_fixed adicionado');
        }
      } catch (error) {
        console.log(`⚠️ Campo is_fixed: ${error.message}`);
      }

      // Garantir que o campo updated_at existe na tabela campus
      try {
        const fieldCheckCampus = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'campus' AND column_name = 'updated_at'
        `);
        if (fieldCheckCampus.rows.length === 0) {
          await client.query('ALTER TABLE campus ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
          console.log('✅ Campo updated_at adicionado à tabela campus');
        }
      } catch (error) {
        console.log(`⚠️ Campo updated_at: ${error.message}`);
      }
    }

    // Verificação final
    const finalStats = await Promise.all([
      client.query('SELECT COUNT(*) as count FROM campus'),
      client.query('SELECT COUNT(*) as count FROM categories'),
      client.query('SELECT COUNT(*) as count FROM sectors'),
      client.query('SELECT COUNT(*) as count FROM users'),
      client.query('SELECT COUNT(*) as count FROM inventory')
    ]);

    console.log('\n📊 ESTATÍSTICAS FINAIS:');
    console.log(`🏢 Campus: ${finalStats[0].rows[0].count}`);
    console.log(`📂 Categorias: ${finalStats[1].rows[0].count}`);
    console.log(`🏗️ Setores: ${finalStats[2].rows[0].count}`);
    console.log(`👥 Usuários: ${finalStats[3].rows[0].count}`);
    console.log(`📦 Inventário: ${finalStats[4].rows[0].count}`);

    console.log('\n🎉 BANCO CONFIGURADO E PRONTO!');

  } catch (error) {
    console.log(`\n❌ ERRO: ${error.message}`);
    process.exit(1);
    
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

criarEstruturaBanco();