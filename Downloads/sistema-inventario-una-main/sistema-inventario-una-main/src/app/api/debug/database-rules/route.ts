import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function GET() {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      regras: {}
    };
    
    // 1. Constraints UNIQUE
    const uniqueConstraints = await pool.query(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name IN ('categories', 'sectors')
      GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
      ORDER BY tc.table_name, tc.constraint_type
    `);
    
    results.regras.constraints = uniqueConstraints.rows;
    
    // 2. Foreign Keys
    const foreignKeys = await pool.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name IN ('categories', 'sectors')
    `);
    
    results.regras.foreign_keys = foreignKeys.rows;
    
    // 3. NOT NULL constraints
    const notNullColumns = await pool.query(`
      SELECT 
        table_name,
        column_name,
        is_nullable,
        data_type,
        column_default
      FROM information_schema.columns
      WHERE table_name IN ('categories', 'sectors')
        AND is_nullable = 'NO'
      ORDER BY table_name, ordinal_position
    `);
    
    results.regras.not_null_columns = notNullColumns.rows;
    
    // 4. Verificar triggers
    const triggers = await pool.query(`
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_statement
      FROM information_schema.triggers
      WHERE event_object_table IN ('categories', 'sectors')
    `);
    
    results.regras.triggers = triggers.rows;
    
    // 5. Estrutura completa das tabelas
    const categoriesStructure = await pool.query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'categories'
      ORDER BY ordinal_position
    `);
    
    const sectorsStructure = await pool.query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'sectors'
      ORDER BY ordinal_position
    `);
    
    results.estrutura = {
      categories: categoriesStructure.rows,
      sectors: sectorsStructure.rows
    };
    
    // 6. Resumo das regras em português
    results.resumo_regras = {
      categories: {
        "1_campos_obrigatorios": notNullColumns.rows
          .filter(c => c.table_name === 'categories')
          .map(c => c.column_name),
        "2_nome_unico_por_campus": "Não pode ter 2 categorias com o mesmo nome NO MESMO campus",
        "3_nome_permitido_em_campus_diferentes": "PODE ter categorias com o mesmo nome em campus DIFERENTES",
        "4_campus_id_obrigatorio": "Toda categoria PRECISA estar ligada a um campus válido",
        "5_campus_deve_existir": "O campus_id precisa existir na tabela 'campus'"
      },
      sectors: {
        "1_campos_obrigatorios": notNullColumns.rows
          .filter(c => c.table_name === 'sectors')
          .map(c => c.column_name),
        "2_nome_unico_por_campus": "Não pode ter 2 setores com o mesmo nome NO MESMO campus",
        "3_nome_permitido_em_campus_diferentes": "PODE ter setores com o mesmo nome em campus DIFERENTES",
        "4_campus_id_obrigatorio": "Todo setor PRECISA estar ligado a um campus válido",
        "5_campus_deve_existir": "O campus_id precisa existir na tabela 'campus'"
      },
      erros_comuns: [
        {
          erro: "duplicate key value violates unique constraint",
          causa: "Tentando criar setor/categoria com nome que JÁ EXISTE no MESMO campus",
          solucao: "Use outro nome OU crie em outro campus"
        },
        {
          erro: "violates foreign key constraint",
          causa: "O campus_id não existe na tabela campus",
          solucao: "Verifique se o campus existe e use o ID correto"
        },
        {
          erro: "null value in column violates not-null constraint",
          causa: "Faltou informar um campo obrigatório (name ou campus_id)",
          solucao: "Preencha todos os campos obrigatórios"
        }
      ]
    };
    
    return NextResponse.json(results, { status: 200 });
    
  } catch (error: any) {
    console.error('Erro ao buscar regras:', error);
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
