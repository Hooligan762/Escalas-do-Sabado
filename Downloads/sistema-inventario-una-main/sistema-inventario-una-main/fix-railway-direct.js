#!/usr/bin/env node

/**
 * Script para conectar DIRETAMENTE ao banco do Railway e aplicar a correção
 * Usa a URL pública do Railway para garantir que estamos corrigindo o banco certo
 */

const { Client } = require('pg');

// URL do Railway (do arquivo .env.production)
const RAILWAY_URL = 'postgresql://postgres:VtOVxujBWMEhnxDDBPYqaBRWNdMWVchd@postgres.railway.internal:5432/railway';

async function fixRailwayDirectly() {
    console.log('🚂 Conectando DIRETAMENTE ao Railway...');
    console.log('🔗 URL:', RAILWAY_URL.substring(0, 50) + '...');
    
    const client = new Client({
        connectionString: RAILWAY_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Conectado ao Railway!');

        // Verificar se estamos no banco correto
        console.log('🔍 Verificando informações do banco...');
        const dbInfo = await client.query('SELECT current_database(), current_user, version()');
        console.log('📊 Banco atual:', dbInfo.rows[0]);

        // Verificar estrutura atual
        console.log('🔍 Verificando estrutura das tabelas...');
        const structure = await client.query(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name IN ('categories', 'sectors')
            ORDER BY table_name, ordinal_position
        `);
        
        console.log('📋 Estrutura atual:');
        structure.rows.forEach(row => {
            console.log(`  - ${row.table_name}.${row.column_name} (${row.data_type})`);
        });

        // Verificar se campus_id existe
        const campusIdCheck = await client.query(`
            SELECT table_name, column_name 
            FROM information_schema.columns 
            WHERE table_name IN ('categories', 'sectors') 
            AND column_name = 'campus_id'
        `);
        
        console.log('🏢 Colunas campus_id encontradas:', campusIdCheck.rows.length);

        if (campusIdCheck.rows.length < 2) {
            console.log('❌ Colunas campus_id faltando! Aplicando correção...');
            
            // Aplicar correções
            console.log('🔧 Adicionando campus_id na tabela categories...');
            await client.query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS campus_id TEXT');
            
            console.log('🔧 Adicionando campus_id na tabela sectors...');
            await client.query('ALTER TABLE sectors ADD COLUMN IF NOT EXISTS campus_id TEXT');
            
            // Buscar campus admin
            console.log('🏢 Buscando campus Administrador...');
            const adminCampus = await client.query(`SELECT id FROM campus WHERE name = 'Administrador'`);
            
            if (adminCampus.rows.length === 0) {
                throw new Error('Campus Administrador não encontrado!');
            }
            
            const adminId = adminCampus.rows[0].id;
            console.log('✅ Campus Administrador ID:', adminId);
            
            // Atualizar registros existentes
            console.log('📝 Atualizando categorias...');
            const catUpdate = await client.query('UPDATE categories SET campus_id = $1 WHERE campus_id IS NULL', [adminId]);
            console.log(`✅ ${catUpdate.rowCount} categorias atualizadas`);
            
            console.log('📝 Atualizando setores...');
            const secUpdate = await client.query('UPDATE sectors SET campus_id = $1 WHERE campus_id IS NULL', [adminId]);
            console.log(`✅ ${secUpdate.rowCount} setores atualizados`);
            
            // Tornar NOT NULL
            console.log('🔒 Definindo colunas como NOT NULL...');
            await client.query('ALTER TABLE categories ALTER COLUMN campus_id SET NOT NULL');
            await client.query('ALTER TABLE sectors ALTER COLUMN campus_id SET NOT NULL');
            
            console.log('🎉 Correção aplicada com sucesso!');
        } else {
            console.log('✅ Colunas campus_id já existem!');
        }

        // Teste final
        console.log('🧪 Testando criação de setor...');
        const testId = 'test-' + Date.now();
        const adminCampus = await client.query(`SELECT id FROM campus WHERE name = 'Administrador'`);
        
        await client.query(
            'INSERT INTO sectors (id, name, campus_id) VALUES ($1, $2, $3)',
            [testId, 'Teste Final', adminCampus.rows[0].id]
        );
        console.log('✅ Setor teste criado!');
        
        await client.query('DELETE FROM sectors WHERE id = $1', [testId]);
        console.log('🗑️ Setor teste removido');
        
        console.log('🎊 CORREÇÃO CONCLUÍDA! O sistema agora deve funcionar!');

    } catch (error) {
        console.error('❌ Erro:', error);
        throw error;
    } finally {
        await client.end();
    }
}

fixRailwayDirectly()
    .then(() => {
        console.log('✅ Script concluído com sucesso!');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Erro fatal:', error);
        process.exit(1);
    });