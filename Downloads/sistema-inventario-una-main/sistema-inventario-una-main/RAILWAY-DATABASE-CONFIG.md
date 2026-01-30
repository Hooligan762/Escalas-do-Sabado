# 🔧 Configuração do Banco de Dados Railway

## ✅ Passo 1: Configurar Variável de Ambiente no Railway

No painel do Railway:
1. Vá para seu projeto
2. Clique na aba **"Variables"**
3. Adicione a variável:
   - **Nome:** `DATABASE_URL`
   - **Valor:** `postgresql://postgres:VtOVxujBWMEhnxDDBPYqaBRWNdMWVchd@postgres.railway.internal:5432/railway`

## ✅ Passo 2: Executar Script de Configuração do Banco

1. No Railway, clique no serviço **PostgreSQL**
2. Vá na aba **"Data"**
3. Clique em **"Query"**
4. Copie e cole todo o conteúdo do arquivo `railway-database-setup.sql`
5. Execute o script

## ✅ Passo 3: Verificar Configuração

Após executar o script, você deve ter:
- ✅ 9 campus criados (Aimorés, Barro Preto, etc.)
- ✅ 11 usuários (2 admins + 9 técnicos)
- ✅ Categorias e setores básicos
- ✅ Estrutura completa das tabelas

## 🧪 Passo 4: Testar Conexão

Após deploy, teste:
- **Super Admin:** `full` / `Full030695@7621`
- **Admin:** `admin` / `password`
- **Técnicos:** `aimores`, `barropreto`, etc. / `una2024`

## 🔧 Sistema Configurado Para:

- **Conexão SSL** em produção (Railway)
- **Pool de conexões** otimizado
- **Queries preparadas** para segurança
- **Estrutura normalizada** com chaves estrangeiras

---

**🎯 Importante:** A variável `DATABASE_URL` no Railway será automaticamente configurada quando você adicionar o serviço PostgreSQL, mas você pode verificar/editar se necessário.