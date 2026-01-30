#!/usr/bin/env node

/**
 * Debug detalhado para entender por que a criação falha na interface
 */

const { Client } = require('pg');

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' });

async function debugCampusIds() {
    console.log('🔍 Investigando IDs dos campus...');
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        await client.connect();
        console.log('✅ Conectado ao banco');

        // Listar todos os campus com seus IDs
        console.log('\n📋 Todos os campus no banco:');
        const campusList = await client.query('SELECT id, name FROM campus ORDER BY name');
        campusList.rows.forEach(campus => {
            console.log(`  - ID: "${campus.id}" | Nome: "${campus.name}"`);
        });

        // Verificar especificamente o campus Administrador
        console.log('\n🏢 Campus Administrador:');
        const adminCampus = await client.query(`SELECT * FROM campus WHERE name = 'Administrador'`);
        if (adminCampus.rows.length > 0) {
            console.log('✅ Encontrado:', adminCampus.rows[0]);
        } else {
            console.log('❌ Campus Administrador não encontrado!');
        }

        // Testar diferentes variações do nome
        const variations = ['Administrador', 'administrador', 'ADMINISTRADOR', 'Admin'];
        for (const variation of variations) {
            const result = await client.query('SELECT id, name FROM campus WHERE name = $1', [variation]);
            console.log(`🔍 Busca por "${variation}":`, result.rows.length > 0 ? result.rows[0] : 'Não encontrado');
        }

        // Verificar setores existentes e seus campus_id
        console.log('\n🏗️ Setores existentes (primeiros 5):');
        const sectors = await client.query(`
            SELECT s.id, s.name, s.campus_id, c.name as campus_name 
            FROM sectors s 
            LEFT JOIN campus c ON s.campus_id = c.id 
            LIMIT 5
        `);
        sectors.rows.forEach(sector => {
            console.log(`  - Setor: "${sector.name}" | campus_id: "${sector.campus_id}" | Campus: "${sector.campus_name}"`);
        });

        // Tentar simular o que a aplicação faz
        console.log('\n🧪 Simulando processo da aplicação...');
        
        // 1. Buscar lista de campus (como getCampusList)
        const campusListResult = await client.query('SELECT * FROM campus ORDER BY name ASC');
        console.log('📊 getCampusList retornaria:', campusListResult.rows.map(c => ({ id: c.id, name: c.name })));
        
        // 2. Encontrar o campus Administrador
        const adminFromList = campusListResult.rows.find(c => c.name === 'Administrador');
        console.log('🎯 Campus Admin encontrado na lista:', adminFromList);
        
        if (adminFromList) {
            // 3. Tentar criar um setor com esse ID
            const testSectorId = 'debug-test-' + Date.now();
            console.log(`🧪 Tentando criar setor com campus_id: "${adminFromList.id}"`);
            
            try {
                await client.query(
                    'INSERT INTO sectors (id, name, campus_id) VALUES ($1, $2, $3)',
                    [testSectorId, 'Debug Test Setor', adminFromList.id.toString()]
                );
                console.log('✅ Setor debug criado com sucesso!');
                
                // Limpar
                await client.query('DELETE FROM sectors WHERE id = $1', [testSectorId]);
                console.log('🗑️ Setor debug removido');
                
            } catch (error) {
                console.log('❌ Erro ao criar setor debug:', error.message);
            }
        }

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await client.end();
    }
}

debugCampusIds();