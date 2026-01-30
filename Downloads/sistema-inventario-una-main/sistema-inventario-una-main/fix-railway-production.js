#!/usr/bin/env node

/**
 * Script para executar a correção do banco de produção no Railway
 * Este script conecta diretamente ao banco do Railway e aplica as correções
 */

const { Client } = require('pg');

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' });

async function fixRailwayDatabase() {
    console.log('🚂 Conectando ao banco de produção do Railway...');
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        await client.connect();
        console.log('✅ Conectado ao Railway com sucesso!');

        // Primeiro, vamos verificar se as colunas já existem
        console.log('🔍 Verificando estrutura atual...');
        const checkColumns = await client.query(`
            SELECT table_name, column_name 
            FROM information_schema.columns 
            WHERE table_name IN ('categories', 'sectors') 
            AND column_name = 'campus_id'
        `);
        
        console.log('📋 Colunas campus_id encontradas:', checkColumns.rows);

        // Buscar o ID do campus Administrador (sempre necessário para o teste)
        console.log('🏢 Buscando campus Administrador...');
        const adminCampus = await client.query(`SELECT id FROM campus WHERE name = 'Administrador'`);
        
        if (adminCampus.rows.length === 0) {
            throw new Error('Campus Administrador não encontrado no banco!');
        }
        
        const adminCampusId = adminCampus.rows[0].id;
        console.log('✅ Campus Administrador encontrado:', adminCampusId);

        if (checkColumns.rows.length === 0) {
            console.log('❌ Colunas campus_id não existem. Executando correção...');
            
            // Executar as correções
            console.log('🔧 Adicionando coluna campus_id na tabela categories...');
            await client.query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS campus_id TEXT');
            
            console.log('🔧 Adicionando coluna campus_id na tabela sectors...');
            await client.query('ALTER TABLE sectors ADD COLUMN IF NOT EXISTS campus_id TEXT');
            
            // Associar categorias existentes ao campus Administrador
            console.log('📦 Associando categorias ao campus Administrador...');
            const categoriesResult = await client.query(
                'UPDATE categories SET campus_id = $1 WHERE campus_id IS NULL',
                [adminCampusId]
            );
            console.log(`✅ ${categoriesResult.rowCount} categorias atualizadas`);
            
            // Associar setores existentes ao campus Administrador
            console.log('🏗️ Associando setores ao campus Administrador...');
            const sectorsResult = await client.query(
                'UPDATE sectors SET campus_id = $1 WHERE campus_id IS NULL',
                [adminCampusId]
            );
            console.log(`✅ ${sectorsResult.rowCount} setores atualizados`);
            
            // Tornar as colunas NOT NULL
            console.log('🔒 Definindo colunas como NOT NULL...');
            await client.query('ALTER TABLE categories ALTER COLUMN campus_id SET NOT NULL');
            await client.query('ALTER TABLE sectors ALTER COLUMN campus_id SET NOT NULL');
            
        } else {
            console.log('✅ Colunas campus_id já existem!');
        }

        // Verificação final
        console.log('🔍 Verificação final...');
        const finalCheck = await client.query(`
            SELECT 'categories' as tabela, count(*) as total, count(campus_id) as com_campus
            FROM categories
            UNION ALL
            SELECT 'sectors' as tabela, count(*) as total, count(campus_id) as com_campus
            FROM sectors
        `);
        
        console.log('📊 Estado final:');
        finalCheck.rows.forEach(row => {
            console.log(`  - ${row.tabela}: ${row.total} registros, ${row.com_campus} com campus_id`);
        });
        
        // Testar criação de um setor
        console.log('🧪 Testando criação de setor...');
        const testSectorId = 'test-' + Date.now();
        await client.query(
            'INSERT INTO sectors (id, name, campus_id) VALUES ($1, $2, $3)',
            [testSectorId, 'Teste Automatico', adminCampusId]
        );
        console.log('✅ Setor de teste criado com sucesso!');
        
        // Remover setor de teste
        await client.query('DELETE FROM sectors WHERE id = $1', [testSectorId]);
        console.log('🗑️ Setor de teste removido');
        
        console.log('🎉 Correção do Railway concluída com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao corrigir banco do Railway:', error);
        throw error;
    } finally {
        await client.end();
        console.log('🔐 Conexão fechada');
    }
}

if (require.main === module) {
    fixRailwayDatabase()
        .then(() => {
            console.log('✅ Script executado com sucesso!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Erro fatal:', error);
            process.exit(1);
        });
}

module.exports = { fixRailwayDatabase };