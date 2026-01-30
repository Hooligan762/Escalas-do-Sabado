import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function POST() {
  const results: any = {
    timestamp: new Date().toISOString(),
    steps: []
  };

  try {
    console.log('🔧 Iniciando correção das constraints...');
    
    // 1. Remover constraints antigas de categories
    results.steps.push({ action: 'Remover constraint categories_name_key', status: 'running' });
    try {
      await pool.query('ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key CASCADE');
      results.steps[results.steps.length - 1].status = 'success';
    } catch (e: any) {
      results.steps[results.steps.length - 1].status = 'warning';
      results.steps[results.steps.length - 1].message = e.message;
    }
    
    // 2. Remover constraints antigas de sectors
    results.steps.push({ action: 'Remover constraint sectors_name_key', status: 'running' });
    try {
      await pool.query('ALTER TABLE sectors DROP CONSTRAINT IF EXISTS sectors_name_key CASCADE');
      results.steps[results.steps.length - 1].status = 'success';
    } catch (e: any) {
      results.steps[results.steps.length - 1].status = 'warning';
      results.steps[results.steps.length - 1].message = e.message;
    }
    
    // 3. Adicionar constraint composta em categories
    results.steps.push({ action: 'Adicionar constraint categories_name_campus_id_key', status: 'running' });
    try {
      await pool.query('ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_campus_id_key');
      await pool.query('ALTER TABLE categories ADD CONSTRAINT categories_name_campus_id_key UNIQUE (name, campus_id)');
      results.steps[results.steps.length - 1].status = 'success';
    } catch (e: any) {
      results.steps[results.steps.length - 1].status = 'error';
      results.steps[results.steps.length - 1].error = e.message;
    }
    
    // 4. Adicionar constraint composta em sectors
    results.steps.push({ action: 'Adicionar constraint sectors_name_campus_id_key', status: 'running' });
    try {
      await pool.query('ALTER TABLE sectors DROP CONSTRAINT IF EXISTS sectors_name_campus_id_key');
      await pool.query('ALTER TABLE sectors ADD CONSTRAINT sectors_name_campus_id_key UNIQUE (name, campus_id)');
      results.steps[results.steps.length - 1].status = 'success';
    } catch (e: any) {
      results.steps[results.steps.length - 1].status = 'error';
      results.steps[results.steps.length - 1].error = e.message;
    }
    
    // 5. Verificar resultado
    results.steps.push({ action: 'Verificar constraints finais', status: 'running' });
    const verifyConstraints = await pool.query(`
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
    `);
    
    results.steps[results.steps.length - 1].status = 'success';
    results.steps[results.steps.length - 1].constraints = verifyConstraints.rows;
    
    const allCorrect = verifyConstraints.rows.every(c => c.columns.includes('campus_id'));
    results.success = allCorrect;
    results.message = allCorrect 
      ? '✅ CONSTRAINTS CORRIGIDAS! Agora você pode criar "Laboratório" em todos os campus!'
      : '⚠️ Algumas constraints ainda precisam de ajuste';
    
    return NextResponse.json(results, { status: 200 });
    
  } catch (error: any) {
    console.error('Erro ao corrigir constraints:', error);
    results.error = error.message;
    return NextResponse.json(results, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST para executar a correção das constraints',
    info: 'Este endpoint corrige as constraints UNIQUE para permitir mesmo nome em campus diferentes'
  });
}
