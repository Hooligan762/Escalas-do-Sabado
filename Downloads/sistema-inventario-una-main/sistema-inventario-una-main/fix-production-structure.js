#!/usr/bin/env node

/**
 * Script para corrigir a estrutura do banco de produção
 * Adiciona as colunas campus_id nas tabelas categories e sectors
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' });

async function main() {
    console.log('🔧 Corrigindo estrutura do banco de produção...');
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        await client.connect();
        console.log('✅ Conectado ao banco de dados');

        // Ler o script SQL
        const sqlScript = fs.readFileSync(path.join(__dirname, 'fix-production-database.sql'), 'utf8');
        
        console.log('📝 Executando script de correção...');
        
        // Executar o script
        const result = await client.query(sqlScript);
        
        console.log('✅ Script executado com sucesso!');
        console.log('📊 Resultado:', result);
        
        // Verificar se as colunas foram criadas
        console.log('\n🔍 Verificando estrutura das tabelas...');
        
        const checkStructure = await client.query(`
            SELECT table_name, column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name IN ('categories', 'sectors') 
            AND column_name = 'campus_id'
            ORDER BY table_name
        `);
        
        console.log('📋 Colunas campus_id encontradas:');
        checkStructure.rows.forEach(row => {
            console.log(`  - ${row.table_name}.${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
        });
        
        // Verificar dados de exemplo
        console.log('\n📊 Verificando dados...');
        
        const dataCheck = await client.query(`
            SELECT 'categories' as tabela, count(*) as total_registros, 
                   count(campus_id) as com_campus_id,
                   count(*) - count(campus_id) as sem_campus_id
            FROM categories
            UNION ALL
            SELECT 'sectors' as tabela, count(*) as total_registros, 
                   count(campus_id) as com_campus_id,
                   count(*) - count(campus_id) as sem_campus_id
            FROM sectors
        `);
        
        console.log('📈 Estatísticas:');
        dataCheck.rows.forEach(row => {
            console.log(`  - ${row.tabela}: ${row.total_registros} total, ${row.com_campus_id} com campus_id, ${row.sem_campus_id} sem campus_id`);
        });
        
    } catch (error) {
        console.error('❌ Erro ao executar correção:', error);
        process.exit(1);
    } finally {
        await client.end();
        console.log('🔐 Conexão fechada');
    }
}

if (require.main === module) {
    main().then(() => {
        console.log('🎉 Correção concluída com sucesso!');
        process.exit(0);
    }).catch(error => {
        console.error('💥 Erro fatal:', error);
        process.exit(1);
    });
}

module.exports = { main };