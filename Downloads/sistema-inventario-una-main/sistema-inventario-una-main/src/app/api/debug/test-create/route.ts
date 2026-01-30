import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function POST(request: Request) {
  try {
    const { type, name, campusName } = await request.json();
    
    const results: any = {
      timestamp: new Date().toISOString(),
      input: { type, name, campusName },
      steps: []
    };
    
    // 1. Buscar o campus pelo nome
    results.steps.push({ step: 'Buscar campus', status: 'running' });
    const campusResult = await pool.query('SELECT id, name FROM campus WHERE name = $1', [campusName]);
    
    if (campusResult.rows.length === 0) {
      results.steps[results.steps.length - 1].status = 'error';
      results.steps[results.steps.length - 1].error = `Campus "${campusName}" não encontrado`;
      results.success = false;
      return NextResponse.json(results, { status: 400 });
    }
    
    const campus = campusResult.rows[0];
    results.steps[results.steps.length - 1].status = 'success';
    results.steps[results.steps.length - 1].campus = campus;
    
    // 2. Verificar duplicatas no mesmo campus
    const table = type === 'sector' ? 'sectors' : 'categories';
    results.steps.push({ step: `Verificar duplicatas em ${table}`, status: 'running' });
    
    const duplicateCheck = await pool.query(
      `SELECT id, name, campus_id FROM ${table} WHERE name = $1 AND campus_id = $2`,
      [name, campus.id]
    );
    
    if (duplicateCheck.rows.length > 0) {
      results.steps[results.steps.length - 1].status = 'blocked';
      results.steps[results.steps.length - 1].existing = duplicateCheck.rows[0];
      results.success = false;
      results.message = `Já existe um ${type === 'sector' ? 'setor' : 'categoria'} com o nome "${name}" no campus "${campusName}"`;
      return NextResponse.json(results, { status: 400 });
    }
    
    results.steps[results.steps.length - 1].status = 'success';
    results.steps[results.steps.length - 1].message = 'Nenhuma duplicata encontrada';
    
    // 3. Verificar se o nome existe em outros campus
    results.steps.push({ step: 'Verificar nome em outros campus', status: 'running' });
    const otherCampusCheck = await pool.query(
      `SELECT ${table}.id, ${table}.name, campus.name as campus_name 
       FROM ${table} 
       JOIN campus ON ${table}.campus_id = campus.id 
       WHERE ${table}.name = $1 AND ${table}.campus_id != $2`,
      [name, campus.id]
    );
    
    results.steps[results.steps.length - 1].status = 'success';
    results.steps[results.steps.length - 1].found_in_other_campus = otherCampusCheck.rows;
    results.steps[results.steps.length - 1].message = otherCampusCheck.rows.length > 0 
      ? `Nome "${name}" existe em ${otherCampusCheck.rows.length} outro(s) campus (isso é permitido!)` 
      : `Nome "${name}" não existe em nenhum outro campus`;
    
    // 4. Tentar criar
    results.steps.push({ step: `Criar ${type}`, status: 'running' });
    const newId = crypto.randomUUID();
    
    try {
      await pool.query(
        `INSERT INTO ${table} (id, name, campus_id) VALUES ($1, $2, $3)`,
        [newId, name, campus.id]
      );
      
      results.steps[results.steps.length - 1].status = 'success';
      results.steps[results.steps.length - 1].created = {
        id: newId,
        name: name,
        campus_id: campus.id,
        campus_name: campus.name
      };
      
      results.success = true;
      results.message = `${type === 'sector' ? 'Setor' : 'Categoria'} "${name}" criado com sucesso no campus "${campusName}"!`;
      
      return NextResponse.json(results, { status: 200 });
      
    } catch (insertError: any) {
      results.steps[results.steps.length - 1].status = 'error';
      results.steps[results.steps.length - 1].error = {
        message: insertError.message,
        code: insertError.code,
        detail: insertError.detail,
        constraint: insertError.constraint
      };
      results.success = false;
      return NextResponse.json(results, { status: 500 });
    }
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST para testar criação',
    example: {
      type: 'sector', // ou 'category'
      name: 'Teste Laboratório',
      campusName: 'Barreiro' // ou qualquer outro campus
    }
  });
}
