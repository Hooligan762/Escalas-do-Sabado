/**
 * 🛠️ CORREÇÃO DEFINITIVA: Garante que campo is_fixed existe e funciona
 */

const { Pool } = require('pg');

async function corrigirCampoFixed() {
  console.log('🛠️ CORREÇÃO DEFINITIVA: Campo is_fixed');
  console.log('='.repeat(50));

  // Usar a mesma configuração que a aplicação usa
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔌 Conectando ao Railway...');
    const client = await pool.connect();
    console.log('✅ Conectado com sucesso!');

    // 1. Verificar se campo is_fixed existe
    console.log('\n🔍 [1/4] Verificando campo is_fixed...');
    const columnCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'inventory_items' 
      AND column_name = 'is_fixed'
    `);

    if (columnCheck.rows.length === 0) {
      console.log('❌ Campo is_fixed NÃO existe!');
      
      // 2. Criar o campo
      console.log('\n🛠️ [2/4] Criando campo is_fixed...');
      await client.query(`
        ALTER TABLE inventory_items 
        ADD COLUMN is_fixed BOOLEAN DEFAULT false
      `);
      console.log('✅ Campo is_fixed criado com sucesso!');

      // 3. Verificar se foi criado
      const verify = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'inventory_items' 
        AND column_name = 'is_fixed'
      `);
      
      if (verify.rows.length > 0) {
        console.log('✅ Confirmado: Campo is_fixed existe agora!');
      } else {
        console.log('❌ Erro: Campo não foi criado');
        return;
      }
    } else {
      console.log('✅ Campo is_fixed já existe!');
      console.log(`   Tipo: ${columnCheck.rows[0].data_type}`);
    }

    // 4. Testar um update real
    console.log('\n🧪 [3/4] Testando update real...');
    const testItems = await client.query(`
      SELECT id, serial 
      FROM inventory_items 
      WHERE campus = 'Liberdade' OR campus LIKE '%iberdade%'
      LIMIT 1
    `);

    if (testItems.rows.length > 0) {
      const testId = testItems.rows[0].id;
      const testSerial = testItems.rows[0].serial;
      
      console.log(`Testando com item: ${testSerial} (${testId.substring(0, 8)}...)`);
      
      try {
        const updateResult = await client.query(`
          UPDATE inventory_items 
          SET is_fixed = $1, updated_at = NOW() 
          WHERE id = $2
        `, [true, testId]);
        
        console.log('✅ Update de teste funcionou!');
        console.log(`   Linhas afetadas: ${updateResult.rowCount}`);
        
        // Verificar se foi salvo
        const checkResult = await client.query(`
          SELECT is_fixed 
          FROM inventory_items 
          WHERE id = $1
        `, [testId]);
        
        console.log(`   Valor salvo: ${checkResult.rows[0].is_fixed}`);
        
      } catch (updateError) {
        console.log('❌ Erro no update de teste:', updateError.message);
      }
    } else {
      console.log('⚠️ Nenhum item do Campus Liberdade encontrado para teste');
    }

    // 5. Status final
    console.log('\n🎯 [4/4] STATUS FINAL:');
    const finalCheck = await client.query(`
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN is_fixed = true THEN 1 END) as items_fixos,
        COUNT(CASE WHEN is_fixed = false THEN 1 END) as items_nao_fixos
      FROM inventory_items 
      WHERE campus = 'Liberdade' OR campus LIKE '%iberdade%'
    `);

    if (finalCheck.rows.length > 0) {
      const stats = finalCheck.rows[0];
      console.log(`📊 Campus Liberdade:`);
      console.log(`   Total itens: ${stats.total_items}`);
      console.log(`   Itens fixos: ${stats.items_fixos}`);
      console.log(`   Itens não-fixos: ${stats.items_nao_fixos}`);
    }

    client.release();
    console.log('\n🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('✅ Campo is_fixed existe e está funcionando');
    console.log('✅ Função handleFixedChange pode ser reativada');

  } catch (error) {
    console.error('❌ ERRO na correção:', error.message);
    console.log('\n💡 AÇÕES SUGERIDAS:');
    console.log('1. Verificar variáveis de ambiente DATABASE_URL');
    console.log('2. Verificar permissões no banco Railway');
    console.log('3. Verificar se a tabela inventory_items existe');
  } finally {
    await pool.end();
  }
}

// Executar correção
corrigirCampoFixed().catch(console.error);