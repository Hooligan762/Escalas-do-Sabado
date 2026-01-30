#!/usr/bin/env node
// Script para verificar todos os setores e categorias por campus
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function verificarDados() {
  console.log('🔍 Verificando setores e categorias por campus...\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não encontrada');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    // 1. Listar todos os campus
    const campusResult = await pool.query('SELECT id, name FROM campus ORDER BY name');
    console.log(`📍 Total de campus: ${campusResult.rows.length}\n`);
    
    // 2. Para cada campus, mostrar seus setores
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏢 SETORES POR CAMPUS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    for (const campus of campusResult.rows) {
      const sectorsResult = await pool.query(
        'SELECT name FROM sectors WHERE campus_id = $1 ORDER BY name',
        [campus.id]
      );
      
      console.log(`📍 ${campus.name}:`);
      if (sectorsResult.rows.length === 0) {
        console.log('   (nenhum setor cadastrado)\n');
      } else {
        sectorsResult.rows.forEach(sector => {
          console.log(`   ✓ ${sector.name}`);
        });
        console.log('');
      }
    }
    
    // 3. Para cada campus, mostrar suas categorias
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📁 CATEGORIAS POR CAMPUS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    for (const campus of campusResult.rows) {
      const categoriesResult = await pool.query(
        'SELECT name FROM categories WHERE campus_id = $1 ORDER BY name',
        [campus.id]
      );
      
      console.log(`📍 ${campus.name}:`);
      if (categoriesResult.rows.length === 0) {
        console.log('   (nenhuma categoria cadastrada)\n');
      } else {
        categoriesResult.rows.forEach(category => {
          console.log(`   ✓ ${category.name}`);
        });
        console.log('');
      }
    }
    
    // 4. Mostrar setores duplicados (mesmo nome em campus diferentes)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 SETORES COM MESMO NOME EM CAMPUS DIFERENTES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const duplicateSectors = await pool.query(`
      SELECT 
        s.name as setor_nome,
        COUNT(*) as total_campus,
        string_agg(c.name, ', ' ORDER BY c.name) as campus_list
      FROM sectors s
      JOIN campus c ON s.campus_id = c.id
      GROUP BY s.name
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC, s.name
    `);
    
    if (duplicateSectors.rows.length === 0) {
      console.log('   ℹ️  Nenhum setor duplicado entre campus (ainda)\n');
    } else {
      duplicateSectors.rows.forEach(row => {
        console.log(`   ✅ "${row.setor_nome}" existe em ${row.total_campus} campus:`);
        console.log(`      → ${row.campus_list}\n`);
      });
    }
    
    // 5. Status das constraints
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔒 STATUS DAS CONSTRAINTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const constraints = await pool.query(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'UNIQUE' 
        AND tc.table_name IN ('categories', 'sectors')
      GROUP BY tc.table_name, tc.constraint_name
      ORDER BY tc.table_name, tc.constraint_name
    `);
    
    constraints.rows.forEach(row => {
      const isCorrect = row.columns.includes('campus_id');
      const status = isCorrect ? '✅ CORRETO' : '❌ PROBLEMA';
      console.log(`${status} ${row.table_name}.${row.constraint_name}:`);
      console.log(`        Colunas: (${row.columns})\n`);
    });
    
    // 6. Status coluna is_fixed
    const isFixedCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'inventory_items' AND column_name = 'is_fixed'
    `);
    
    if (isFixedCheck.rows.length > 0) {
      console.log('✅ Coluna is_fixed EXISTE');
      console.log(`   Tipo: ${isFixedCheck.rows[0].data_type}`);
      console.log(`   Default: ${isFixedCheck.rows[0].column_default}\n`);
    } else {
      console.log('❌ Coluna is_fixed NÃO EXISTE\n');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verificarDados();
