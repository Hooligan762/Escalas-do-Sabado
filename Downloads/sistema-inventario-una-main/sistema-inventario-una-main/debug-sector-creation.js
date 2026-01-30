#!/usr/bin/env node

/**
 * Script para debugar problema de criação de setor
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function debugSectorCreation() {
    console.log('🐛 Debug - Problema de criação de setor');
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        await client.connect();
        console.log('✅ Conectado ao banco');

        // 1. Verificar campus existentes
        console.log('\n🏫 Campus existentes:');
        const campusResult = await client.query('SELECT * FROM campus ORDER BY name');
        campusResult.rows.forEach(campus => {
            console.log(`  - ${campus.name} (ID: ${campus.id}, tipo: ${typeof campus.id})`);
        });

        // 2. Simular o que o código faz
        console.log('\n🔍 Simulando busca do campus Administrador...');
        const campusList = campusResult.rows;
        const adminCampus = campusList.find(c => c.name === 'Administrador');
        
        if (!adminCampus) {
            console.log('❌ Campus Administrador não encontrado na lista!');
            console.log('Nomes disponíveis:', campusList.map(c => c.name));
        } else {
            console.log('✅ Campus Administrador encontrado:', adminCampus);
            console.log('ID do campus:', adminCampus.id, 'tipo:', typeof adminCampus.id);
        }

        // 3. Verificar função insertSector
        console.log('\n🔍 Testando inserção igual ao código...');
        
        if (adminCampus) {
            const campusId = adminCampus.id.toString();
            console.log('Campus ID para inserção:', campusId, 'tipo:', typeof campusId);
            
            // Simulação exata do que o código faz
            const newId = crypto.randomUUID();
            const name = 'Teste Debug Setor';
            
            console.log('Tentando inserir com:');
            console.log(`  - id: ${newId}`);
            console.log(`  - name: ${name}`);
            console.log(`  - campusId: ${campusId}`);
            
            try {
                const result = await client.query(
                    'INSERT INTO sectors (id, name, campus_id) VALUES ($1, $2, $3) RETURNING *',
                    [newId, name, campusId]
                );
                
                console.log('✅ Inserção bem-sucedida!');
                console.log('Resultado:', result.rows[0]);
                
                // Limpar
                await client.query('DELETE FROM sectors WHERE id = $1', [newId]);
                console.log('🧹 Registro de teste removido');
                
            } catch (insertError) {
                console.error('❌ Erro na inserção:', insertError.message);
                console.error('Código do erro:', insertError.code);
                console.error('Detalhes:', insertError.detail);
            }
        }

        // 4. Verificar se há problema com tipos de dados
        console.log('\n🔍 Verificando tipos de dados...');
        const typeCheck = await client.query(`
            SELECT 
                column_name,
                data_type,
                character_maximum_length,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_name = 'sectors' AND column_name IN ('id', 'name', 'campus_id')
            ORDER BY ordinal_position
        `);
        
        console.log('Estrutura das colunas relevantes:');
        typeCheck.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

    } catch (error) {
        console.error('❌ Erro no debug:', error);
    } finally {
        await client.end();
        console.log('🔐 Conexão fechada');
    }
}

const crypto = require('crypto');

if (require.main === module) {
    debugSectorCreation().then(() => {
        console.log('🏁 Debug concluído!');
        process.exit(0);
    }).catch(error => {
        console.error('💥 Erro fatal:', error);
        process.exit(1);
    });
}