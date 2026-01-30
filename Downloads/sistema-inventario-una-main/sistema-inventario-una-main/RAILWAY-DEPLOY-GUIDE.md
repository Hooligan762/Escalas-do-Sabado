# 🚀 Guia Completo - Deploy no Railway

## 📋 Passo a Passo Detalhado

### 1. 🔐 Login e Autorização
- [x] Você já está no Railway
- Clique em **"Login"** (canto superior direito)
- Selecione **"Continue with GitHub"**
- Autorize o Railway a acessar seus repositórios

### 2. 🆕 Criar Novo Projeto
- No dashboard, clique em **"New Project"**
- Selecione **"Deploy from GitHub repo"**
- Procure e selecione: **`sistema-inventario-una`**
- Railway detectará Next.js automaticamente

### 3. ⚙️ Configuração Automática
Railway fará automaticamente:
- ✅ Detectar Next.js
- ✅ Instalar dependências (`npm install`)
- ✅ Build do projeto (`npm run build`)
- ✅ Deploy inicial

### 4. 🗄️ Adicionar PostgreSQL
**IMPORTANTE:** Faça isso ANTES do primeiro deploy
- No dashboard do projeto, clique em **"+ Add Service"**
- Selecione **"Database"**
- Escolha **"PostgreSQL"**
- Railway criará automaticamente:
  - Banco de dados
  - Usuário e senha
  - Variável `DATABASE_URL`

### 5. 🔧 Verificar Variáveis de Ambiente
Railway deve configurar automaticamente:
```env
DATABASE_URL=postgresql://postgres:xxx@xxx.railway.app:5432/railway
NODE_ENV=production
PORT=3000
```

### 6. 🚀 Deploy e Teste
- Aguarde o build completar (2-5 minutos)
- Clique no link gerado (algo como: `xxx.railway.app`)
- Teste o login com seus usuários

### 7. 📊 Migrar Dados do Banco
Após deploy bem-sucedido:
1. Conecte-se ao banco Railway usando as credenciais
2. Execute seus scripts `schema.sql` e `seed.sql`
3. Migre dados do PostgreSQL local

## 🆘 Solução de Problemas

### Se der erro no build:
- Verifique se todas as dependências estão no `package.json`
- Confirme que o `DATABASE_URL` está configurado
- Veja os logs de build no Railway

### Se der erro de conexão:
- Verifique se o PostgreSQL foi adicionado
- Confirme que a `DATABASE_URL` está correta
- Aguarde alguns minutos para propagação

## 🎯 Próximos Passos
1. ✅ Deploy funcionando
2. 🔄 Migração de dados
3. 🧪 Testes completos
4. 🌟 Sistema em produção!

---

**💡 Dica:** O primeiro deploy pode demorar 5-10 minutos. Seja paciente!
