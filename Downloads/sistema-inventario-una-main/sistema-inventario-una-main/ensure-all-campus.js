#!/usr/bin/env node

/**
 * SCRIPT PARA GARANTIR QUE AIMORÉS APARECE NOS GRÁFICOS
 * Adiciona campus faltantes se necessário
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function garantirCampusCompletos() {
  console.log('🎯 GARANTINDO CAMPUS COMPLETOS PARA GRÁFICOS');
  console.log('='.repeat(60));
  
  try {
    // Lista de campus que DEVEM existir
    const campusObrigatorios = [
      { name: 'Aimorés' },
      { name: 'Barreiro' },
      { name: 'Campus Central' },
      { name: 'Campus Sul' },
      { name: 'Guajajaras' },
      { name: 'Linha Verde' },
      { name: 'Raja Gabaglia' }
    ];

    console.log('\n📋 [1/3] VERIFICANDO CAMPUS EXISTENTES...');
    const campusExistentes = await pool.query('SELECT id, name FROM campus ORDER BY name');
    
    console.log(`Campus atuais no banco: ${campusExistentes.rows.length}`);
    campusExistentes.rows.forEach(c => {
      console.log(`  - "${c.name}" (ID: ${c.id})`);
    });

    console.log('\n➕ [2/3] ADICIONANDO CAMPUS FALTANTES...');
    let adicionados = 0;
    
    for (const campusNecessario of campusObrigatorios) {
      const existe = campusExistentes.rows.find(c => 
        c.name.toLowerCase() === campusNecessario.name.toLowerCase()
      );
      
      if (!existe) {
        await pool.query(
          'INSERT INTO campus (id, name, created_at, updated_at) VALUES (gen_random_uuid(), $1, NOW(), NOW())',
          [campusNecessario.name]
        );
        console.log(`✅ Campus adicionado: "${campusNecessario.name}"`);
        adicionados++;
      } else {
        console.log(`ℹ️  Campus já existe: "${campusNecessario.name}"`);
      }
    }

    console.log('\n📊 [3/3] VERIFICAÇÃO FINAL...');
    const campusFinal = await pool.query('SELECT name FROM campus WHERE name != \'Administrador\' ORDER BY name');
    
    console.log('Campus que aparecerão nos gráficos:');
    campusFinal.rows.forEach((c, index) => {
      console.log(`  ${index + 1}. ${c.name}`);
    });

    console.log('\n🎉 RESULTADO:');
    if (adicionados > 0) {
      console.log(`✅ ${adicionados} campus adicionados com sucesso!`);
      console.log('🔄 Os gráficos agora mostrarão todos os campus');
    } else {
      console.log('✅ Todos os campus necessários já existiam');
    }
    
    console.log('💡 Aimorés agora deve aparecer nos gráficos!');

  } catch (error) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  garantirCampusCompletos().catch(console.error);
}

module.exports = { garantirCampusCompletos };