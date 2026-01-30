#!/usr/bin/env node

/**
 * Script de limpeza automática do banco Railway
 * Executa automatica  } catch (error) {
    console.error('❌ Erro na limpeza automática:', error.message);
    
    // Se for erro de conexão, não é crítico (build pode continuar)
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.log('⚠️ Não foi possível conectar ao banco - pulando limpeza');
      console.log('⚠️ Isso é normal durante build - banco será limpo no próximo deploy');
      await pool.end().catch(() => {});
      return; // Não falhar o build
    }
    
    // Outros erros: fazer rollback e falhar
    await pool.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await pool.end().catch(() => {});
  }
} iniciar a aplicação
 */

const { Pool } = require('pg');

async function limparBanco() {
  console.log('🔧 Iniciando limpeza automática do banco Railway...');
  
  // Verificar se DATABASE_URL está disponível
  if (!process.env.DATABASE_URL) {
    console.log('⚠️ DATABASE_URL não encontrada - pulando limpeza (build local ou CI)');
    return;
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Testar conexão primeiro
    await pool.query('SELECT 1');
    console.log('✅ Conexão com banco estabelecida');
    
    // Verificar se já tem apenas 2 campus
    const campusCheck = await pool.query('SELECT COUNT(*) as total FROM campus');
    const totalCampus = parseInt(campusCheck.rows[0].total);
    
    console.log(`📊 Campus no banco: ${totalCampus}`);
    
    // Se já tem exatamente 2 campus, verificar se são os corretos
    if (totalCampus === 2) {
      const correctCampus = await pool.query(
        "SELECT COUNT(*) as total FROM campus WHERE id IN ('campus-aimores', 'campus-liberdade')"
      );
      
      if (parseInt(correctCampus.rows[0].total) === 2) {
        console.log('✅ Banco já está configurado corretamente (2 campus)');
        await pool.end();
        return;
      }
    }
    
    // Banco precisa ser limpo
    console.log('🗑️ Limpando banco de dados...');
    
    await pool.query('BEGIN');
    
    // Deletar tudo
    await pool.query('DELETE FROM inventory');
    console.log('✅ Inventário deletado');
    
    await pool.query('DELETE FROM sectors');
    console.log('✅ Setores deletados');
    
    await pool.query('DELETE FROM categories');
    console.log('✅ Categorias deletadas');
    
    await pool.query('DELETE FROM campus');
    console.log('✅ Campus deletados');
    
    // Criar 2 campus
    await pool.query(`
      INSERT INTO campus (id, name, created_at, updated_at) VALUES
      ('campus-aimores', 'Aimorés', NOW(), NOW()),
      ('campus-liberdade', 'Liberdade', NOW(), NOW())
    `);
    console.log('✅ 2 campus criados: Aimorés e Liberdade');
    
    // Vincular usuários
    await pool.query("UPDATE users SET campus_id = 'campus-aimores', updated_at = NOW() WHERE username = 'aimores'");
    await pool.query("UPDATE users SET campus_id = 'campus-liberdade', updated_at = NOW() WHERE username = 'liberdade'");
    await pool.query("UPDATE users SET campus_id = NULL, updated_at = NOW() WHERE username IN ('administrador', 'superadm')");
    console.log('✅ Usuários vinculados aos campus');
    
    // Deletar outros usuários
    await pool.query("DELETE FROM users WHERE username NOT IN ('aimores', 'liberdade', 'administrador', 'superadm')");
    console.log('✅ Usuários desnecessários removidos');
    
    await pool.query('COMMIT');
    
    // Verificar resultado
    const finalCheck = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM campus) as campus,
        (SELECT COUNT(*) FROM sectors) as setores,
        (SELECT COUNT(*) FROM categories) as categorias,
        (SELECT COUNT(*) FROM users WHERE username IN ('aimores', 'liberdade', 'administrador', 'superadm')) as usuarios
    `);
    
    console.log('📊 Resultado final:', finalCheck.rows[0]);
    console.log('✅ Limpeza automática concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na limpeza automática:', error.message);
    await pool.query('ROLLBACK');
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  limparBanco()
    .then(() => {
      console.log('🎉 Script finalizado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      // Não falhar o build se for erro de conexão
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.log('⚠️ Build continuará sem limpeza do banco');
        process.exit(0);
      }
      process.exit(1);
    });
}

module.exports = { limparBanco };
