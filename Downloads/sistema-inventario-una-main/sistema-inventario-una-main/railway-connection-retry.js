// railway-connection-retry.js
const { Pool } = require('pg');
const path = require('path');

console.log('🔄 Iniciando script de retry de conexão PostgreSQL...');

// Função para esperar um tempo específico
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para tentar conexão várias vezes
async function tryConnection() {
  // Configuração do banco de dados a partir da variável de ambiente
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ [Retry] DATABASE_URL não está definida! Verifique as variáveis de ambiente.');
    process.exit(1);
  }

  console.log('🔄 [Retry] Tentando conectar ao PostgreSQL...');
  
  // Número máximo de tentativas
  const MAX_ATTEMPTS = 20;
  // Tempo de espera entre tentativas (aumenta progressivamente)
  let waitTime = 3000; // começa com 3 segundos
  
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`🔄 [Retry] Tentativa ${attempt} de ${MAX_ATTEMPTS}...`);
      
      // Criar pool de conexão
      const pool = new Pool({ 
        connectionString,
        connectionTimeoutMillis: 5000, // 5 segundos timeout
        ssl: process.env.NODE_ENV === 'production' ? {
          rejectUnauthorized: false
        } : false
      });
      
      // Tentar uma consulta simples
      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as current_time');
      const currentTime = result.rows[0].current_time;
      client.release();
      
      console.log(`✅ [Retry] Conexão PostgreSQL bem-sucedida na tentativa ${attempt}!`);
      console.log(`✅ [Retry] Hora no servidor: ${currentTime}`);
      
      // Se chegou aqui, a conexão foi bem-sucedida
      return pool;
    } catch (error) {
      console.error(`❌ [Retry] Tentativa ${attempt} falhou:`, error.message);
      
      // Se atingiu o número máximo de tentativas, encerra
      if (attempt === MAX_ATTEMPTS) {
        console.error('❌ [Retry] Número máximo de tentativas atingido. Desistindo.');
        throw error;
      }
      
      // Aguarda antes da próxima tentativa (com backoff exponencial)
      console.log(`⏳ [Retry] Aguardando ${waitTime/1000} segundos antes da próxima tentativa...`);
      await sleep(waitTime);
      waitTime = Math.min(waitTime * 1.5, 30000); // aumenta o tempo de espera, mas no máximo 30 segundos
    }
  }
}

// Exporta a função para uso em outros scripts
module.exports = {
  tryConnection
};

// Se este script for executado diretamente, tenta a conexão
if (require.main === module) {
  tryConnection()
    .then(() => {
      console.log('✅ Script de retry concluído com sucesso!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script de retry falhou:', error);
      process.exit(1);
    });
}