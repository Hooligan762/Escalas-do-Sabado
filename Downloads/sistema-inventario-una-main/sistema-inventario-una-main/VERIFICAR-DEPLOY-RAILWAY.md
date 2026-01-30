# 🚀 GUIA: Verificar Deploy no Railway

## ✅ Commits Enviados para Produção

Os seguintes commits **JÁ ESTÃO** no GitHub (origin/main) e o Railway deve estar fazendo deploy automático:

1. **5a83e35** - `fix: corrige query getUsers para retornar campus_name corretamente`
   - ❗ **CRÍTICO**: Corrige bug onde campus retornava undefined
   - Técnicos agora aparecem com campus correto

2. **dab0dba** - `fix: adiciona normalização em getUserByUsername`
   - Busca de técnicos por campus com normalização de acentos

3. **f57856b** - `fix: normalização de campus para login`
   - Remove acentos em comparações (Aimorés = aimores)

---

## 📋 Como Verificar se Deploy Está Completo no Railway

### Opção 1: Dashboard do Railway (Recomendado)

1. Acesse: https://railway.app/
2. Faça login
3. Selecione seu projeto: **sistema-inventario-una**
4. Clique na aba **"Deployments"**
5. Verifique o status do último deploy:
   - 🟡 **Building** - Aguarde (1-3 minutos)
   - 🟢 **Active** - Deploy completo, pode testar!
   - 🔴 **Failed** - Erro no deploy, verificar logs

### Opção 2: Verificar Logs do Railway

1. No dashboard do Railway, clique no deployment ativo
2. Role para baixo até **"View Logs"**
3. Procure por mensagens como:
   ```
   ✓ Ready in 4.7s
   ▲ Next.js 15.5.4
   - Local: http://0.0.0.0:3000
   ```
4. Se ver essas mensagens, o deploy está completo!

### Opção 3: Testar URL de Produção Diretamente

1. Acesse a URL do seu app Railway (exemplo):
   ```
   https://seu-app.railway.app/login
   ```

2. Verifique se a página carrega sem erros

3. Abra o **Console do Navegador** (F12 → Console)

4. Tente fazer login com:
   - Campus: **Aimorés**
   - Login: **aimores** (deve aparecer automaticamente)
   - Senha: **aimores**

5. No console, procure por logs como:
   ```
   ✅ Usuários carregados: 11
   📋 Usuários mapeados: [...]
   Campus: "Aimorés" -> Login correto do técnico: "aimores"
   ```

---

## 🧪 Teste Completo de Login no Railway

Execute estes testes na **URL de produção do Railway**:

### Teste 1: Admin
- Campus: **Administrador**
- Login: **admin**
- Senha: **admin123**
- ✅ Esperado: Login bem-sucedido

### Teste 2: Técnico Aimorés (com acento)
- Campus: **Aimorés** (selecione no dropdown)
- Login: **aimores** (deve aparecer automaticamente)
- Senha: **aimores**
- ✅ Esperado: Login bem-sucedido

### Teste 3: Técnico Barro Preto (com espaço)
- Campus: **Barro Preto**
- Login: **barropreto**
- Senha: **barropreto**
- ✅ Esperado: Login bem-sucedido

### Teste 4: Técnico Liberdade
- Campus: **Liberdade**
- Login: **liberdade**
- Senha: **liberdade**
- ✅ Esperado: Login bem-sucedido

---

## ⏱️ Tempo Estimado de Deploy

| Etapa | Tempo | Status |
|-------|-------|--------|
| Git push para GitHub | ✅ Completo | 0s |
| Railway detecta mudanças | ✅ Automático | 5-10s |
| Build do Next.js | 🟡 Em andamento | 2-4 min |
| Deploy para produção | ⏳ Aguardando | 30-60s |
| **TOTAL** | ⏳ | **3-5 minutos** |

---

## 🔍 Se o Login Ainda Não Funcionar

### 1. Limpar Cache do Navegador
```
Ctrl + Shift + Delete
→ Marcar "Cache" e "Cookies"
→ Limpar
```

### 2. Forçar Refresh da Página
```
Ctrl + F5 (Windows)
Cmd + Shift + R (Mac)
```

### 3. Verificar Console do Navegador (F12)
Procure por erros em vermelho como:
- ❌ `Failed to fetch`
- ❌ `500 Internal Server Error`
- ❌ `Não foi encontrado técnico para campus`

Se ver esses erros, o deploy pode ter falhado ou está incompleto.

### 4. Verificar Logs do Railway
Se houver erro `500`, veja os logs no Railway:
```
Dashboard → Deployments → View Logs → Procurar por [ERROR]
```

---

## 📞 Informações do Sistema

**Branch ativa**: `main`  
**Último commit**: `5a83e35` (fix: corrige query getUsers)  
**Commits pendentes de deploy**: 0 (todos foram enviados)  
**Status GitHub**: ✅ Sincronizado  

---

## ✅ Checklist de Verificação

- [ ] Acessei o dashboard do Railway
- [ ] Verifiquei que o deployment está **Active** (verde)
- [ ] Acessei a URL de produção: `https://_____.railway.app/login`
- [ ] Limpei o cache do navegador (Ctrl+Shift+Delete)
- [ ] Tentei login com **admin** → ✅ Funcionou
- [ ] Tentei login com **Aimorés** → ⏳ Aguardando teste
- [ ] Tentei login com **Barro Preto** → ⏳ Aguardando teste
- [ ] Verifiquei console do navegador (F12) → sem erros

---

## 🎯 Próximos Passos

1. **AGORA**: Aguarde 3-5 minutos para deploy completar
2. **DEPOIS**: Acesse URL do Railway e teste login
3. **SE FUNCIONAR**: ✅ Sistema pronto para uso!
4. **SE NÃO FUNCIONAR**: Me envie screenshot do erro e logs do Railway

---

**Última atualização**: 2025-11-07 16:30  
**Deploy no Railway**: 🟡 Aguardando confirmação  

---

💡 **DICA**: Abra o Railway em outra aba e monitore o status do deployment em tempo real!
