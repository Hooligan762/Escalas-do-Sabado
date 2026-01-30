#!/usr/bin/env node

/**
 * DIAGNÓSTICO COMPLETO DO BANCO DE DADOS
 * Verifica a estrutura real vs esperada para entender os erros
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function diagnosticarBanco() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DO BANCO DE DADOS');
  console.log('='.repeat(60));
  
  try {
    // 1. Verificar todas as tabelas
    console.log('\n📋 [1/6] TABELAS EXISTENTES:');
    const tabelas = await pool.query(`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`Total de tabelas: ${tabelas.rows.length}`);
    tabelas.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

    // 2. Verificar estrutura de cada tabela principal
    console.log('\n🏗️ [2/6] ESTRUTURA DAS TABELAS:');
    
    const tabelasPrincipais = ['campus', 'categories', 'sectors', 'inventory_items', 'users'];
    
    for (const tabela of tabelasPrincipais) {
      const existe = tabelas.rows.find(t => t.table_name === tabela);
      if (existe) {
        console.log(`\n📊 Tabela: ${tabela.toUpperCase()}`);
        
        // Colunas
        const colunas = await pool.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position
        `, [tabela]);
        
        colunas.rows.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          console.log(`  - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
        });

        // Constraints
        const constraints = await pool.query(`
          SELECT 
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_name = $1 AND tc.table_schema = 'public'
          ORDER BY tc.constraint_type, tc.constraint_name
        `, [tabela]);
        
        if (constraints.rows.length > 0) {
          console.log(`  🔒 Constraints:`);
          constraints.rows.forEach(constraint => {
            console.log(`    - ${constraint.constraint_type}: ${constraint.constraint_name} (${constraint.column_name})`);
          });
        }

        // Contagem de registros
        const count = await pool.query(`SELECT COUNT(*) as total FROM ${tabela}`);
        console.log(`  📊 Registros: ${count.rows[0].total}`);
        
      } else {
        console.log(`\n❌ Tabela ${tabela.toUpperCase()} NÃO EXISTE!`);
      }
    }

    // 3. Verificar problemas específicos
    console.log('\n🚨 [3/6] VERIFICAÇÃO DE PROBLEMAS:');
    
    // Verificar se campus tem constraint UNIQUE em name
    const campusUnique = await pool.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'campus' 
      AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%name%'
    `);
    
    if (campusUnique.rows.length > 0) {
      console.log('✅ Campus tem constraint UNIQUE no name');
    } else {
      console.log('❌ Campus NÃO tem constraint UNIQUE no name - Por isso ON CONFLICT falha!');
    }

    // Verificar registros com problemas
    const problemasComuns = [
      {
        nome: 'Campus com ID nulo',
        query: 'SELECT COUNT(*) as count FROM campus WHERE id IS NULL'
      },
      {
        nome: 'Campus com name nulo',
        query: 'SELECT COUNT(*) as count FROM campus WHERE name IS NULL'
      },
      {
        nome: 'Categories sem campusId',
        query: 'SELECT COUNT(*) as count FROM categories WHERE campusId IS NULL'
      },
      {
        nome: 'Inventory_items órfãos',
        query: `SELECT COUNT(*) as count FROM inventory_items i 
                WHERE NOT EXISTS (SELECT 1 FROM campus c WHERE c.name = i.campus)`
      }
    ];

    for (const problema of problemasComuns) {
      try {
        const result = await pool.query(problema.query);
        const count = result.rows[0].count;
        if (count > 0) {
          console.log(`❌ ${problema.nome}: ${count} registros`);
        } else {
          console.log(`✅ ${problema.nome}: OK`);
        }
      } catch (error) {
        console.log(`⚠️  ${problema.nome}: Erro na verificação - ${error.message}`);
      }
    }

    // 4. Verificar foreign keys
    console.log('\n🔗 [4/6] FOREIGN KEYS:');
    const foreignKeys = await pool.query(`
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name
    `);

    if (foreignKeys.rows.length > 0) {
      foreignKeys.rows.forEach(fk => {
        console.log(`  ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    } else {
      console.log('  ❌ Nenhuma foreign key encontrada!');
    }

    // 5. Verificar dados de exemplo
    console.log('\n📝 [5/6] DADOS DE EXEMPLO:');
    
    // Campus existentes
    const campusExistentes = await pool.query('SELECT id, name FROM campus LIMIT 5');
    console.log('Campus:');
    campusExistentes.rows.forEach(c => {
      console.log(`  - ${c.name} (${c.id})`);
    });

    // Items existentes
    const itemsExistentes = await pool.query('SELECT id, campus, category, serial FROM inventory_items LIMIT 3');
    console.log('Items (primeiros 3):');
    itemsExistentes.rows.forEach(i => {
      console.log(`  - ${i.serial} (${i.category}) - Campus: ${i.campus}`);
    });

    // 6. Recomendações
    console.log('\n💡 [6/6] RECOMENDAÇÕES:');
    
    const recomendacoes = [];
    
    if (campusUnique.rows.length === 0) {
      recomendacoes.push('Adicionar constraint UNIQUE na coluna name da tabela campus');
    }
    
    if (foreignKeys.rows.length === 0) {
      recomendacoes.push('Verificar se as foreign keys estão configuradas corretamente');
    }
    
    if (recomendacoes.length > 0) {
      console.log('📋 Ações necessárias:');
      recomendacoes.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    } else {
      console.log('✅ Estrutura do banco parece estar correta!');
    }

  } catch (error) {
    console.error('❌ ERRO no diagnóstico:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

// Executar diagnóstico
diagnosticarBanco();