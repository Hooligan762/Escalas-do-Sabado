import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function GET() {
  try {
    // 1. Buscar todos os campus
    const campusResult = await pool.query('SELECT id, name FROM campus ORDER BY name');
    
    const result: any = {
      total_campus: campusResult.rows.length,
      campus: []
    };
    
    // 2. Para cada campus, buscar setores e categorias
    for (const campus of campusResult.rows) {
      const sectorsResult = await pool.query(
        'SELECT name FROM sectors WHERE campus_id = $1 ORDER BY name',
        [campus.id]
      );
      
      const categoriesResult = await pool.query(
        'SELECT name FROM categories WHERE campus_id = $1 ORDER BY name',
        [campus.id]
      );
      
      result.campus.push({
        id: campus.id,
        name: campus.name,
        setores: sectorsResult.rows.map(s => s.name),
        categorias: categoriesResult.rows.map(c => c.name),
        total_setores: sectorsResult.rows.length,
        total_categorias: categoriesResult.rows.length
      });
    }
    
    // 3. Verificar duplicatas entre campus
    const duplicateSectors = await pool.query(`
      SELECT 
        s.name as nome,
        COUNT(*) as total,
        string_agg(c.name, ', ' ORDER BY c.name) as campus_list
      FROM sectors s
      JOIN campus c ON s.campus_id = c.id
      GROUP BY s.name
      HAVING COUNT(*) > 1
      ORDER BY s.name
    `);
    
    const duplicateCategories = await pool.query(`
      SELECT 
        cat.name as nome,
        COUNT(*) as total,
        string_agg(c.name, ', ' ORDER BY c.name) as campus_list
      FROM categories cat
      JOIN campus c ON cat.campus_id = c.id
      GROUP BY cat.name
      HAVING COUNT(*) > 1
      ORDER BY cat.name
    `);
    
    result.setores_duplicados = duplicateSectors.rows;
    result.categorias_duplicadas = duplicateCategories.rows;
    
    // 4. Verificar constraints
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
    `);
    
    result.constraints = constraints.rows.map(c => ({
      tabela: c.table_name,
      constraint: c.constraint_name,
      colunas: c.columns,
      correto: c.columns.includes('campus_id')
    }));
    
    // 5. Verificar coluna is_fixed
    const isFixedCheck = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'inventory_items' AND column_name = 'is_fixed'
    `);
    
    result.is_fixed_exists = isFixedCheck.rows.length > 0;
    
    return NextResponse.json(result, { status: 200 });
    
  } catch (error: any) {
    console.error('Erro ao buscar dados dos campus:', error);
    return NextResponse.json(
      { error: error.message || 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
