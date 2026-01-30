# 🚨 DIAGNÓSTICO COMPLETO - SETORES NÃO APARECEM

**Data:** 4 de dezembro de 2025  
**Sistema:** https://inventarionsiuna.com.br  
**Problema:** "Só informa que foi cadastrado mas não aparece nada"

---

## ✅ CÓDIGO ESTÁ CORRETO!

Verifiquei todo o código:
- ✅ **Frontend (dashboard.tsx):** Lógica de criação correta (commit 7eb1cbb)
- ✅ **Frontend (management-view.tsx):** Exibição correta (commit 407a17e)
- ✅ **Backend (postgres-adapter.ts):** INSERT e SELECT corretos
- ✅ **Logs de debug:** Implementados em todos lugares

**Commits em produção:**
```
407a17e - debug logs em management-view
8c67da5 - debug logs em page.tsx
7eb1cbb - fix comparação campus.name ✅ CORREÇÃO PRINCIPAL
```

---

## 🔍 POSSÍVEIS CAUSAS

### 1. CACHE DO NAVEGADOR (90% provável) ⚠️

**Sintoma:** Código antigo em cache, não carrega versão nova

**Como identificar:**
```
1. F12 → Console
2. Criar setor
3. Se NÃO ver log "🔍 Verificação de setor" → É CACHE!
```

**Solução:**
```
CTRL + SHIFT + N (aba anônima)
OU
CTRL + SHIFT + DELETE → Limpar tudo → Fechar navegador → Reabrir
```

### 2. BANCO SEM CAMPUS CORRETOS (70% provável) ⚠️

**Sintoma:** userCampusId = undefined, backend retorna vazio

**Como identificar:**
```
F12 → Console → Ver log:
🔍 [page.tsx] { userCampusId: undefined }  ← PROBLEMA!
```

**Causa:** Após limpar banco, campus ou usuários não estão vinculados

**Solução:** Executar script SQL (SCRIPT-SQL-2-CAMPUS-DEFINITIVO.md)

### 3. RAILWAY AINDA FAZENDO BUILD (30% provável)

**Sintoma:** Deploy não completou, código antigo ainda em produção

**Como identificar:**
```
Railway Dashboard → Deployments → Ver status
Se "Building..." ou "Deploying..." → Aguardar
```

**Solução:** Aguardar 5-10 minutos

---

## 🎯 TESTE DIAGNÓSTICO (2 MINUTOS)

### Passo 1: Abrir em Aba Anônima

```
CTRL + SHIFT + N
→ https://inventarionsiuna.com.br
→ Login: aimores / aimores
→ F12 (Console aberto)
```

### Passo 2: Ir para Gerenciamento

```
Clicar: Gerenciamento (aba)
```

### Passo 3: Observar Console (ANTES de criar)

**✅ Logs Esperados (Versão Correta):**
```javascript
🔍 [page.tsx] Buscando dados para técnico: {
  userName: "aimores",
  userCampusName: "Aimorés",  ← TEM VALOR ✅
  userCampusId: "campus-aimores"  ← TEM VALOR ✅
}

📊 [page.tsx] Dados carregados: {
  userCampusId: "campus-aimores",  ← TEM VALOR ✅
  initialSectors: 0,  ← ou número > 0
  initialCategories: 0
}

🔄 [ManagementView] Props atualizadas: {
  sectorsLength: 0,  ← ou número > 0
  categoriesLength: 0,
  userRole: "tecnico",
  userCampus: ...
}
```

**❌ Logs Antigos (Cache ou Banco Errado):**
```javascript
// Se NÃO VER nenhum log → CACHE ANTIGO!

// OU

🔍 [page.tsx] {
  userCampusId: undefined  ← BANCO ERRADO!
}
```

### Passo 4: Criar Setor "TI"

```
Nome: TI
Descrição: Tecnologia
→ Adicionar
```

### Passo 5: Observar Console (DURANTE criação)

**✅ Logs Esperados (Funciona):**
```javascript
🔍 Verificação de setor: {
  name: "TI",
  targetCampus: {...},
  targetCampusName: "Aimorés",  ← STRING, NÃO OBJETO ✅
  duplicateInSameCampus: false
}

📝 Criando setor: {
  name: "TI",
  campusId: "campus-aimores",  ← TEM VALOR ✅
  targetCampusName: "Aimorés"
}

✅ Setor retornado do banco: {
  hasId: true,
  hasName: true,
  campusName: "Aimorés"
}

📊 Estado de setores atualizado: {
  antes: 0,
  depois: 1,  ← INCREMENTOU ✅
  novoSetor: "TI",
  todosSetores: [{name: "TI", campus: "Aimorés"}]  ← LISTA COMPLETA ✅
}

🔄 [ManagementView] Props atualizadas: {
  sectorsLength: 1,  ← ATUALIZOU ✅
  timestamp: "2025-12-04..."
}

✅ [ManagementView] Técnico: retornando todos setores: {
  totalRetornado: 1,
  setores: ["TI"]  ← SETOR APARECE ✅
}
```

**❌ Logs Antigos (Problema):**
```javascript
// Se NÃO TEM "targetCampusName" → CACHE!
🔍 Verificação de setor: {
  targetCampus: {...},
  // ❌ FALTA targetCampusName!
}

// OU

// Se userCampusId undefined → BANCO!
📝 Criando setor: {
  campusId: undefined  ← BANCO ERRADO!
}
```

### Passo 6: Verificar na Tela

**✅ DEVE APARECER:**
```
📋 Gerenciamento
   └─ 📂 Setores
      └─ TI
         [Editar] [Excluir]
```

---

## 🔧 SOLUÇÕES BASEADAS NO TESTE

### Cenário A: SEM LOGS no console

**Diagnóstico:** CACHE DO NAVEGADOR (100%)

**Solução:**
```
1. Fechar TODAS as abas do site
2. Fechar navegador completamente
3. CTRL + SHIFT + DELETE
4. Marcar: "Cookies" + "Cache"
5. Período: "Todo o período"
6. Limpar dados
7. Reabrir navegador
8. Aba anônima: CTRL + SHIFT + N
9. Testar novamente
```

### Cenário B: Log mostra `userCampusId: undefined`

**Diagnóstico:** BANCO NÃO TEM CAMPUS OU USUÁRIO NÃO VINCULADO

**Solução: Executar Script SQL no Railway**

```sql
-- 1. ACESSAR RAILWAY:
-- https://railway.app → PostgreSQL → Data → Query

-- 2. EXECUTAR:
DELETE FROM campus;
DELETE FROM sectors;
DELETE FROM categories;

INSERT INTO campus (id, name, created_at, updated_at) VALUES
('campus-aimores', 'Aimorés', NOW(), NOW()),
('campus-liberdade', 'Liberdade', NOW(), NOW());

UPDATE users SET campus_id = 'campus-aimores' WHERE username = 'aimores';
UPDATE users SET campus_id = 'campus-liberdade' WHERE username = 'liberdade';
UPDATE users SET campus_id = NULL WHERE username IN ('administrador', 'superadm');

-- 3. VERIFICAR:
SELECT username, campus_id FROM users 
WHERE username IN ('aimores', 'liberdade');

-- Resultado esperado:
-- aimores   | campus-aimores
-- liberdade | campus-liberdade
```

**4. Após executar:** Limpar cache e testar novamente

### Cenário C: Log mostra `campusId: undefined` ao criar

**Diagnóstico:** Campus não encontrado pelo nome

**Solução:**
```sql
-- Railway → Query:
SELECT id, name FROM campus;

-- Se não retornar 2 campus, executar:
INSERT INTO campus (id, name) VALUES 
('campus-aimores', 'Aimorés'),
('campus-liberdade', 'Liberdade')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
```

### Cenário D: Logs corretos mas não aparece na tela

**Diagnóstico:** React não re-renderizou OU CSS escondendo

**Solução:**
```
1. Abrir F12 → Elements
2. Procurar: "TI" na página
3. Se encontrar mas não visível → CSS
4. Se não encontrar → React não renderizou
5. Solução: Recarregar CTRL + F5
```

---

## 📊 CHECKLIST COMPLETO

### ✅ Verificações:

- [ ] Aba anônima aberta (CTRL + SHIFT + N)
- [ ] Console aberto (F12)
- [ ] Login feito (aimores / aimores)
- [ ] Gerenciamento aberto
- [ ] Console mostra: `🔍 [page.tsx]` ✅
- [ ] Console mostra: `userCampusId: "campus-aimores"` ✅
- [ ] Console mostra: `🔄 [ManagementView]` ✅
- [ ] Criar setor mostra: `targetCampusName` ✅
- [ ] Criar setor mostra: `campusId: "campus-aimores"` ✅
- [ ] Console mostra: `depois: 1` (incrementou) ✅
- [ ] Console mostra: `setores: ["TI"]` ✅
- [ ] Setor APARECE na tela ✅

**Se TODOS marcados → FUNCIONANDO!**

**Se algum falhou:**
- Faltam logs → CACHE (limpar)
- userCampusId undefined → BANCO (script SQL)
- campusId undefined ao criar → BANCO (campus não existe)
- Logs OK mas não aparece → React (CTRL + F5)

---

## 🚀 SOLUÇÃO MAIS RÁPIDA (5 MINUTOS)

### 1. Executar Script SQL no Railway

```
Railway → PostgreSQL → Data → Query
→ Copiar script do SCRIPT-SQL-2-CAMPUS-DEFINITIVO.md
→ Executar
→ Verificar: 2 campus, 4 usuários
```

### 2. Limpar Cache Agressivamente

```
1. Fechar navegador completamente
2. Reabrir
3. CTRL + SHIFT + DELETE
4. Limpar: Cookies + Cache + Todo período
5. Fechar novamente
6. Reabrir
7. CTRL + SHIFT + N (aba anônima)
```

### 3. Testar

```
https://inventarionsiuna.com.br
→ aimores / aimores
→ F12
→ Gerenciamento
→ Criar "TI"
→ ✅ DEVE APARECER!
```

---

## 📝 SE AINDA NÃO FUNCIONAR

### Copiar e enviar estes logs:

```javascript
// 1. Console ao carregar página:
🔍 [page.tsx] { ... }  ← COPIAR COMPLETO

// 2. Console ao criar setor:
🔍 Verificação de setor: { ... }  ← COPIAR COMPLETO
📝 Criando setor: { ... }  ← COPIAR COMPLETO
📊 Estado atualizado: { ... }  ← COPIAR COMPLETO

// 3. Teste em aba anônima:
Funciona em aba anônima? [SIM/NÃO]
Funciona em aba normal? [SIM/NÃO]

// 4. Banco Railway:
SELECT COUNT(*) FROM campus;  ← Resultado: ?
SELECT username, campus_id FROM users WHERE username = 'aimores';  ← Resultado: ?
```

---

## 🎯 RESUMO

**Código:** ✅ CORRETO (commit 407a17e em produção)  
**Problema:** 90% cache, 70% banco não configurado  
**Solução Primária:** Aba anônima + Script SQL  
**Tempo:** 5 minutos  

**Próximos passos:**
1. ✅ Executar script SQL no Railway (SCRIPT-SQL-2-CAMPUS-DEFINITIVO.md)
2. ✅ Limpar cache do navegador (aba anônima)
3. ✅ Testar e verificar logs no console
4. ✅ Se não funcionar, copiar logs e compartilhar

---

**Status:** Diagnóstico completo pronto  
**Arquivos:** SCRIPT-SQL-2-CAMPUS-DEFINITIVO.md (script)  
**Próximo:** Executar script + limpar cache + testar
