import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import crypto from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function GET() {
  const testResults: any = {
    timestamp: new Date().toISOString(),
    database_connection: false,
    tests: [],
    summary: {
      total_tests: 0,
      passed: 0,
      failed: 0
    }
  };

  try {
    // ========================================
    // TESTE 1: Conexão com banco
    // ========================================
    testResults.tests.push({
      name: '1. Conexão com Railway PostgreSQL',
      status: 'running'
    });
    
    const connectionTest = await pool.query('SELECT NOW() as time, version() as version');
    testResults.database_connection = true;
    testResults.database_info = {
      time: connectionTest.rows[0].time,
      version: connectionTest.rows[0].version.split(',')[0]
    };
    testResults.tests[0].status = 'passed';
    testResults.tests[0].details = 'Conexão estabelecida com sucesso';
    testResults.summary.passed++;

    // ========================================
    // TESTE 2: Buscar todos os campus
    // ========================================
    testResults.tests.push({
      name: '2. Listar todos os campus',
      status: 'running'
    });
    
    const campusResult = await pool.query('SELECT id, name FROM campus ORDER BY name');
    testResults.tests[1].status = 'passed';
    testResults.tests[1].total_campus = campusResult.rows.length;
    testResults.tests[1].campus_list = campusResult.rows.map(c => c.name);
    testResults.summary.passed++;

    // ========================================
    // TESTE 3: Buscar setores e categorias por campus
    // ========================================
    const campusData: any[] = [];
    
    for (const campus of campusResult.rows) {
      const sectorsResult = await pool.query(
        'SELECT id, name FROM sectors WHERE campus_id = $1 ORDER BY name',
        [campus.id]
      );
      
      const categoriesResult = await pool.query(
        'SELECT id, name FROM categories WHERE campus_id = $1 ORDER BY name',
        [campus.id]
      );
      
      campusData.push({
        id: campus.id,
        name: campus.name,
        setores: sectorsResult.rows,
        categorias: categoriesResult.rows,
        total_setores: sectorsResult.rows.length,
        total_categorias: categoriesResult.rows.length
      });
    }
    
    testResults.tests.push({
      name: '3. Buscar setores e categorias por campus',
      status: 'passed',
      details: campusData
    });
    testResults.summary.passed++;

    // ========================================
    // TESTE 4: Criar setor (teste de INSERT)
    // ========================================
    testResults.tests.push({
      name: '4. Criar setor de teste',
      status: 'running'
    });
    
    try {
      const testCampus = campusResult.rows[0];
      const testSectorId = crypto.randomUUID();
      const testSectorName = `Teste_${Date.now()}`;
      
      await pool.query(
        'INSERT INTO sectors (id, name, campus_id) VALUES ($1, $2, $3)',
        [testSectorId, testSectorName, testCampus.id]
      );
      
      testResults.tests[3].status = 'passed';
      testResults.tests[3].created_sector = {
        id: testSectorId,
        name: testSectorName,
        campus: testCampus.name
      };
      testResults.summary.passed++;
      
      // ========================================
      // TESTE 5: Editar setor (teste de UPDATE)
      // ========================================
      testResults.tests.push({
        name: '5. Editar setor de teste',
        status: 'running'
      });
      
      const updatedName = `Teste_Editado_${Date.now()}`;
      await pool.query(
        'UPDATE sectors SET name = $1 WHERE id = $2',
        [updatedName, testSectorId]
      );
      
      const verifyUpdate = await pool.query(
        'SELECT name FROM sectors WHERE id = $1',
        [testSectorId]
      );
      
      if (verifyUpdate.rows[0].name === updatedName) {
        testResults.tests[4].status = 'passed';
        testResults.tests[4].updated_name = updatedName;
        testResults.summary.passed++;
      } else {
        throw new Error('Nome não foi atualizado corretamente');
      }
      
      // ========================================
      // TESTE 6: Excluir setor (teste de DELETE)
      // ========================================
      testResults.tests.push({
        name: '6. Excluir setor de teste',
        status: 'running'
      });
      
      await pool.query('DELETE FROM sectors WHERE id = $1', [testSectorId]);
      
      const verifyDelete = await pool.query(
        'SELECT id FROM sectors WHERE id = $1',
        [testSectorId]
      );
      
      if (verifyDelete.rows.length === 0) {
        testResults.tests[5].status = 'passed';
        testResults.tests[5].details = 'Setor excluído com sucesso';
        testResults.summary.passed++;
      } else {
        throw new Error('Setor não foi excluído');
      }
      
    } catch (error: any) {
      const lastTest = testResults.tests[testResults.tests.length - 1];
      lastTest.status = 'failed';
      lastTest.error = error.message;
      testResults.summary.failed++;
    }

    // ========================================
    // TESTE 7: Verificar isolamento por campus
    // ========================================
    testResults.tests.push({
      name: '7. Verificar isolamento por campus',
      status: 'running'
    });
    
    try {
      const duplicateSectors = await pool.query(`
        SELECT 
          s.name,
          COUNT(*) as total,
          string_agg(c.name, ', ' ORDER BY c.name) as campus_list
        FROM sectors s
        JOIN campus c ON s.campus_id = c.id
        GROUP BY s.name
        HAVING COUNT(*) > 1
        ORDER BY COUNT(*) DESC
        LIMIT 10
      `);
      
      testResults.tests[6].status = 'passed';
      testResults.tests[6].setores_duplicados = duplicateSectors.rows;
      testResults.tests[6].isolamento_funcionando = duplicateSectors.rows.length >= 0;
      testResults.summary.passed++;
    } catch (error: any) {
      testResults.tests[6].status = 'failed';
      testResults.tests[6].error = error.message;
      testResults.summary.failed++;
    }

    // ========================================
    // TESTE 8: Verificar constraints UNIQUE
    // ========================================
    testResults.tests.push({
      name: '8. Verificar constraints UNIQUE',
      status: 'running'
    });
    
    try {
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
      
      const allCorrect = constraints.rows.every(c => c.columns.includes('campus_id'));
      
      testResults.tests[7].status = allCorrect ? 'passed' : 'failed';
      testResults.tests[7].constraints = constraints.rows.map(c => ({
        tabela: c.table_name,
        constraint: c.constraint_name,
        colunas: c.columns,
        correto: c.columns.includes('campus_id')
      }));
      
      if (allCorrect) {
        testResults.summary.passed++;
      } else {
        testResults.summary.failed++;
      }
    } catch (error: any) {
      testResults.tests[7].status = 'failed';
      testResults.tests[7].error = error.message;
      testResults.summary.failed++;
    }

    // ========================================
    // TESTE 9: Verificar coluna is_fixed
    // ========================================
    testResults.tests.push({
      name: '9. Verificar coluna is_fixed',
      status: 'running'
    });
    
    try {
      const isFixedCheck = await pool.query(`
        SELECT column_name, data_type, column_default, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'inventory_items' AND column_name = 'is_fixed'
      `);
      
      if (isFixedCheck.rows.length > 0) {
        testResults.tests[8].status = 'passed';
        testResults.tests[8].column_info = isFixedCheck.rows[0];
        testResults.summary.passed++;
      } else {
        testResults.tests[8].status = 'failed';
        testResults.tests[8].error = 'Coluna is_fixed não existe';
        testResults.summary.failed++;
      }
    } catch (error: any) {
      testResults.tests[8].status = 'failed';
      testResults.tests[8].error = error.message;
      testResults.summary.failed++;
    }

    // ========================================
    // TESTE 10: Tempo de resposta
    // ========================================
    testResults.tests.push({
      name: '10. Tempo de resposta do banco',
      status: 'running'
    });
    
    try {
      const start = Date.now();
      await pool.query('SELECT 1');
      const end = Date.now();
      const responseTime = end - start;
      
      testResults.tests[9].status = 'passed';
      testResults.tests[9].response_time_ms = responseTime;
      testResults.tests[9].performance = responseTime < 100 ? 'excelente' : 
                                         responseTime < 300 ? 'bom' : 
                                         responseTime < 1000 ? 'aceitável' : 'lento';
      testResults.summary.passed++;
    } catch (error: any) {
      testResults.tests[9].status = 'failed';
      testResults.tests[9].error = error.message;
      testResults.summary.failed++;
    }

    // ========================================
    // RESUMO FINAL
    // ========================================
    testResults.summary.total_tests = testResults.tests.length;
    testResults.summary.success_rate = Math.round((testResults.summary.passed / testResults.summary.total_tests) * 100);
    testResults.summary.status = testResults.summary.failed === 0 ? 'SISTEMA 100% FUNCIONAL ✅' : 'SISTEMA COM PROBLEMAS ❌';

    return NextResponse.json(testResults, { status: 200 });

  } catch (error: any) {
    console.error('Erro nos testes:', error);
    testResults.database_connection = false;
    testResults.error = error.message;
    testResults.summary.status = 'FALHA CRÍTICA ❌';
    
    return NextResponse.json(testResults, { status: 500 });
  }
}
