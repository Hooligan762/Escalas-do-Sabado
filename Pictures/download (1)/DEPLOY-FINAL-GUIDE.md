# 🚀 Como Conectar ao Banco Railway e Finalizar Deploy

## Passo 1: Verificar Status do App no Railway

1. Vá para seu projeto Railway: https://railway.app/project/[SEU-PROJECT-ID]
2. Verifique se o app `sistema-inventario-una` aparece na lista
3. Clique nele para ver os logs de deploy

## Passo 2: Configurar Variáveis de Ambiente

O Railway deve criar automaticamente a variável `DATABASE_URL`, mas se não estiver aparecendo:

1. Na tela do app, vá em **Variables**
2. Adicione manualmente:
   ```
   DATABASE_URL=postgresql://postgres:[SENHA]@shinkansen.proxy.rlwy.net:5432/railway
   ```

## Passo 3: Migrar Dados para o Banco Railway

### Opção A: Via Interface Web do Railway
1. Clique no serviço **Postgres** no seu projeto
2. Vá em **Data** ou **Query**
3. Cole e execute o conteúdo do arquivo `railway-database-setup.sql`

### Opção B: Via PgAdmin ou Cliente PostgreSQL
```bash
# Conectar ao banco Railway
Host: shinkansen.proxy.rlwy.net
Port: 5432
Database: railway
Username: postgres
Password: [sua senha do banco]
```

## Passo 4: Verificar Deploy

1. Aguarde o build terminar (pode levar 2-5 minutos)
2. O Railway fornecerá uma URL tipo: `https://sistema-inventario-una-production.up.railway.app`
3. Acesse a URL para testar

## Possíveis Problemas e Soluções

### ❌ Build falhando
- Verifique os logs no Railway
- Se der erro de "Cannot find module", pode precisar rodar `npm install` no Railway

### ❌ Banco não conecta
- Certifique-se que a variável `DATABASE_URL` está configurada
- Teste a conexão manualmente

### ❌ App não carrega
- Verifique se o `railway.json` está correto
- Port deve ser a variável `$PORT` que o Railway define

## Testando o Sistema

1. **Login**: 
   - Campus: Barreiro, Login: admin, Senha: 123456
   - Campus: qualquer, Login: full, Senha: [sua senha]

2. **Funcionalidades**:
   - Dashboard principal ✅
   - Inventário ✅
   - Empréstimos ✅
   - Solicitações ✅
   - Gerenciamento (setores/categorias) ✅

## Scripts de Apoio

Se precisar debugar conexões ou dados:

```javascript
// Debug Railway Database Connection
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Conexão OK:', result.rows[0]);
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
testConnection();
```

---

**🎯 O que você deve ver após o deploy completo:**
- URL do app funcionando
- Login com usuários admin/full
- Todas as telas carregando sem erros
- Dados sendo salvos no banco Railway

Me mostre a tela atual do Railway para eu ver o status! 📸