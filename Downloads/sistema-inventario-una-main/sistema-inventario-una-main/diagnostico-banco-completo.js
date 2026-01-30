/**
 * 🔍 DIAGNÓSTICO COMPLETO: Por que não salva no banco Railway?
 * Vamos descobrir a causa exata do problema
 */

const { Pool } = require('pg');

// Tentar diferentes formas de conectar ao Railway
async function diagnosticarBancoRailway() {
  console.log('🔍 DIAGNÓSTICO: Por que não salva no banco Railway?');
  console.log('='.repeat(70));

  // 1. Verificar variáveis de ambiente disponíveis
  console.log('\n📋 [1/6] VARIÁVEIS DE AMBIENTE:');
  const envVars = [
    'DATABASE_URL', 'POSTGRES_URL', 'DB_URL',
    'POSTGRES_HOST', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 
    'POSTGRES_DATABASE', 'POSTGRES_PORT'
  ];
  
  envVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      // Mascarar password para segurança
      const masked = varName.includes('PASSWORD') || varName.includes('URL') 
        ? value.substring(0, 10) + '...' 
        : value;
      console.log(`✅ ${varName}: ${masked}`);
    } else {
      console.log(`❌ ${varName}: não definida`);
    }
  });

  // 2. Tentar conectar usando as variáveis disponíveis
  console.log('\n🔌 [2/6] TESTANDO CONEXÃO COM RAILWAY:');
  
  const connectionStrings = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.DB_URL
  ].filter(Boolean);

  if (connectionStrings.length === 0) {
    console.log('❌ Nenhuma string de conexão encontrada!');
    console.log('💡 Isso explica por que não consegue salvar no banco');
    return;
  }

  for (const [index, connectionString] of connectionStrings.entries()) {
    console.log(`\n🔗 Tentativa ${index + 1}: Conectando...`);
    
    try {
      const pool = new Pool({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
      });

      // Testar conexão
      const client = await pool.connect();
      console.log('✅ Conexão estabelecida com sucesso!');

      // 3. Verificar tabela inventory_items
      console.log('\n📊 [3/6] VERIFICANDO TABELA inventory_items:');
      const tableCheck = await client.query(`
        SELECT COUNT(*) as total 
        FROM information_schema.tables 
        WHERE table_name = 'inventory_items'
      `);
      
      if (tableCheck.rows[0].total > 0) {
        console.log('✅ Tabela inventory_items existe');
        
        // 4. Verificar colunas da tabela
        console.log('\n🔍 [4/6] VERIFICANDO COLUNAS:');
        const columns = await client.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'inventory_items' 
          ORDER BY ordinal_position
        `);
        
        console.log(`Total de colunas: ${columns.rows.length}`);
        const fixedColumn = columns.rows.find(col => 
          col.column_name.toLowerCase() === 'is_fixed'
        );
        
        if (fixedColumn) {
          console.log('✅ Campo is_fixed existe!');
          console.log(`   Tipo: ${fixedColumn.data_type}`);
          console.log(`   Permite NULL: ${fixedColumn.is_nullable}`);
        } else {
          console.log('❌ Campo is_fixed NÃO existe!');
          console.log('💡 ESTA É A CAUSA DO ERRO!');
          
          // Mostrar todas as colunas
          console.log('\n📋 Colunas existentes:');
          columns.rows.forEach((col, i) => {
            console.log(`   ${i+1}. ${col.column_name} (${col.data_type})`);
          });
        }

        // 5. Testar alguns registros
        console.log('\n📦 [5/6] TESTANDO REGISTROS:');
        const items = await client.query(`
          SELECT id, serial, campus, status 
          FROM inventory_items 
          WHERE campus = 'Liberdade' OR campus LIKE '%iberdade%'
          LIMIT 3
        `);
        
        console.log(`Itens do Campus Liberdade: ${items.rows.length}`);
        items.rows.forEach((item, i) => {
          console.log(`   ${i+1}. ${item.serial} - ${item.campus} (${item.status})`);
        });

        // 6. Tentar simular o update que está falhando
        if (items.rows.length > 0) {
          console.log('\n🧪 [6/6] SIMULANDO UPDATE QUE FALHA:');
          const testId = items.rows[0].id;
          
          try {
            if (fixedColumn) {
              await client.query(
                'UPDATE inventory_items SET is_fixed = $1 WHERE id = $2',
                [true, testId]
              );
              console.log('✅ Update simulado funcionou!');
            } else {
              console.log('❌ Não pode testar update - campo is_fixed não existe');
              console.log('💡 SOLUÇÃO: Criar campo is_fixed na tabela');
            }
          } catch (updateError) {
            console.log('❌ Erro no update simulado:', updateError.message);
          }
        }

      } else {
        console.log('❌ Tabela inventory_items não existe!');
      }

      client.release();
      await pool.end();
      break; // Sucesso, não precisa tentar outras conexões

    } catch (error) {
      console.log(`❌ Erro na conexão ${index + 1}:`, error.message);
      if (index === connectionStrings.length - 1) {
        console.log('\n💥 TODAS AS CONEXÕES FALHARAM!');
        console.log('💡 Isso explica por que não consegue salvar no banco');
      }
    }
  }

  console.log('\n🎯 RESUMO DO DIAGNÓSTICO:');
  console.log('1. Verificar se variáveis de ambiente estão definidas no Railway');
  console.log('2. Verificar se campo is_fixed existe na tabela');
  console.log('3. Verificar se a conexão SSL está funcionando');
  console.log('4. Verificar logs do Railway para mais detalhes');
}

// Executar diagnóstico
diagnosticarBancoRailway().catch(error => {
  console.error('\n💥 ERRO GERAL no diagnóstico:', error.message);
  console.log('\n💡 POSSÍVEIS CAUSAS:');
  console.log('- Variáveis de ambiente não configuradas');
  console.log('- Banco Railway inacessível');
  console.log('- Problemas de SSL/TLS');
  console.log('- Campo is_fixed não existe na tabela');
});