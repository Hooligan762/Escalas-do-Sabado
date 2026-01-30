import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

/**
 * API Route para executar migração de constraints do banco
 * Acesse: /api/migrate-database
 * Executa automaticamente a correção das constraints
 */

export async function GET(request: NextRequest) {
  console.log('🔧 [API Migration] Iniciando migração via API...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const results = [];
    
    // 1. Verificar e corrigir setores
    console.log('🔍 [API Migration] Verificando constraints de setores...');
    
    const sectorConstraints = await pool.query(`
      SELECT conname FROM pg_constraint 
      WHERE conrelid = 'sectors'::regclass AND contype = 'u'
    `);
    
    const hasOldSectorConstraint = sectorConstraints.rows.some(row => row.conname === 'sectors_name_key');
    const hasNewSectorConstraint = sectorConstraints.rows.some(row => row.conname === 'sectors_name_campus_unique');
    
    if (hasOldSectorConstraint) {
      await pool.query('ALTER TABLE sectors DROP CONSTRAINT sectors_name_key');
      results.push('✅ Removida constraint antiga: sectors_name_key');
    }
    
    if (!hasNewSectorConstraint) {
      await pool.query('ALTER TABLE sectors ADD CONSTRAINT sectors_name_campus_unique UNIQUE (name, campus_id)');
      results.push('✅ Adicionada constraint nova: sectors_name_campus_unique');
    }
    
    // 2. Verificar e corrigir categorias
    console.log('🔍 [API Migration] Verificando constraints de categorias...');
    
    const categoryConstraints = await pool.query(`
      SELECT conname FROM pg_constraint 
      WHERE conrelid = 'categories'::regclass AND contype = 'u'
    `);
    
    const hasOldCategoryConstraint = categoryConstraints.rows.some(row => row.conname === 'categories_name_key');
    const hasNewCategoryConstraint = categoryConstraints.rows.some(row => row.conname === 'categories_name_campus_unique');
    
    if (hasOldCategoryConstraint) {
      await pool.query('ALTER TABLE categories DROP CONSTRAINT categories_name_key');
      results.push('✅ Removida constraint antiga: categories_name_key');
    }
    
    if (!hasNewCategoryConstraint) {
      await pool.query('ALTER TABLE categories ADD CONSTRAINT categories_name_campus_unique UNIQUE (name, campus_id)');
      results.push('✅ Adicionada constraint nova: categories_name_campus_unique');
    }
    
    // 3. Verificar resultado final
    const finalCheck = await pool.query(`
      SELECT 
        CASE 
          WHEN c.conrelid = 'sectors'::regclass THEN 'SECTORS'
          WHEN c.conrelid = 'categories'::regclass THEN 'CATEGORIES'
        END as table_name,
        c.conname as constraint_name,
        array_agg(a.attname ORDER BY a.attnum) as columns
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attnum = ANY(c.conkey)
      WHERE c.conrelid IN ('sectors'::regclass, 'categories'::regclass) 
      AND c.contype = 'u'
      GROUP BY c.conrelid, c.conname
      ORDER BY table_name, constraint_name
    `);
    
    console.log('🎉 [API Migration] Migração concluída!');
    
    return NextResponse.json({
      success: true,
      message: 'Migração de constraints executada com sucesso!',
      changes: results.length > 0 ? results : ['ℹ️ Todas as constraints já estavam corretas'],
      finalConstraints: finalCheck.rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ [API Migration] Erro:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
    
  } finally {
    await pool.end();
  }
}

export async function POST(request: NextRequest) {
  // Permitir POST também para flexibilidade
  return GET(request);
}