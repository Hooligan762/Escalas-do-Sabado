# 🌐 SISTEMA EM NUVEM - CONFIGURAÇÃO RAILWAY

**Situação:** Sistema rodando em https://inventarionsiuna.com.br  
**Banco:** PostgreSQL Railway (conexão em tempo real)  
**Campus Ativos:** Aimorés e Liberdade  
**Objetivo:** Cadastrar setores/categorias funcionando 100%

---

## ✅ PASSO 1: CORRIGIR BANCO RAILWAY

### 🔗 Acessar Railway:

```
1. https://railway.app
2. Login
3. Selecionar projeto: inventarionsiuna
4. Clicar em "PostgreSQL"
5. Clicar em "Data"
6. Abrir "Query"
```

### 📝 Executar Script de Correção:

**Copiar e colar este script completo:**

```sql
-- ========================================
-- CONFIGURAÇÃO RAILWAY - AIMORÉS E LIBERDADE
-- Sistema em nuvem - Tempo real
-- ========================================

-- 1️⃣ GARANTIR CAMPUS CORRETOS
-- ========================================
-- Deletar todos campus e recriar apenas Aimorés e Liberdade
DELETE FROM campus;

INSERT INTO campus (id, name, created_at, updated_at) VALUES
('campus-aimores', 'Aimorés', NOW(), NOW()),
('campus-liberdade', 'Liberdade', NOW(), NOW());

-- 2️⃣ CONFIGURAR USUÁRIOS
-- ========================================
-- Técnicos vinculados aos campus:
UPDATE users 
SET campus_id = 'campus-aimores', updated_at = NOW() 
WHERE username = 'aimores';

UPDATE users 
SET campus_id = 'campus-liberdade', updated_at = NOW() 
WHERE username = 'liberdade';

-- Administradores SEM campus (veem todos):
UPDATE users 
SET campus_id = NULL, updated_at = NOW() 
WHERE username IN ('administrador', 'superadm');

-- 3️⃣ LIMPAR DADOS ÓRFÃOS
-- ========================================
-- Deletar inventário de campus que não existe mais:
DELETE FROM inventory 
WHERE campus_id IS NOT NULL 
AND campus_id NOT IN ('campus-aimores', 'campus-liberdade');

-- Deletar setores de campus que não existe mais:
DELETE FROM sectors 
WHERE campus_id NOT IN ('campus-aimores', 'campus-liberdade');

-- Deletar categorias de campus que não existe mais:
DELETE FROM categories 
WHERE campus_id NOT IN ('campus-aimores', 'campus-liberdade');

-- 4️⃣ VERIFICAÇÃO FINAL
-- ========================================
-- Ver estrutura completa:
SELECT 
  '🏫 CAMPUS' as tipo,
  id as id_completo,
  name as nome,
  NULL as vinculo,
  created_at as criado_em
FROM campus

UNION ALL

SELECT 
  '👤 USUÁRIO' as tipo,
  id as id_completo,
  username as nome,
  COALESCE(campus_id, '(admin - sem campus)') as vinculo,
  created_at as criado_em
FROM users
WHERE username IN ('aimores', 'liberdade', 'administrador', 'superadm')

UNION ALL

SELECT 
  '📂 SETOR' as tipo,
  id as id_completo,
  name as nome,
  campus_id as vinculo,
  created_at as criado_em
FROM sectors

UNION ALL

SELECT 
  '🏷️ CATEGORIA' as tipo,
  id as id_completo,
  name as nome,
  campus_id as vinculo,
  created_at as criado_em
FROM categories

ORDER BY tipo, nome;

-- 5️⃣ CONTADORES
-- ========================================
SELECT 
  'Campus' as tabela,
  COUNT(*) as total,
  STRING_AGG(name, ', ') as nomes
FROM campus

UNION ALL

SELECT 
  'Usuários Ativos' as tabela,
  COUNT(*) as total,
  STRING_AGG(username, ', ') as nomes
FROM users
WHERE username IN ('aimores', 'liberdade', 'administrador', 'superadm')

UNION ALL

SELECT 
  'Setores' as tabela,
  COUNT(*) as total,
  CASE WHEN COUNT(*) = 0 THEN '(vazio)' ELSE 'Ver tabela acima' END as nomes
FROM sectors

UNION ALL

SELECT 
  'Categorias' as tabela,
  COUNT(*) as total,
  CASE WHEN COUNT(*) = 0 THEN '(vazio)' ELSE 'Ver tabela acima' END as nomes
FROM categories;
```

### ✅ Resultado Esperado:

```
tipo        | id_completo        | nome          | vinculo              | criado_em
----------- | ------------------ | ------------- | -------------------- | ----------
🏫 CAMPUS   | campus-aimores     | Aimorés       | NULL                 | 2025-12-03 ...
🏫 CAMPUS   | campus-liberdade   | Liberdade     | NULL                 | 2025-12-03 ...
👤 USUÁRIO  | user-xxx           | administrador | (admin - sem campus) | ...
👤 USUÁRIO  | user-yyy           | aimores       | campus-aimores       | ...
👤 USUÁRIO  | user-zzz           | liberdade     | campus-liberdade     | ...
👤 USUÁRIO  | user-www           | superadm      | (admin - sem campus) | ...

tabela           | total | nomes
---------------- | ----- | ---------------------
Campus           | 2     | Aimorés, Liberdade
Usuários Ativos  | 4     | administrador, aimores, liberdade, superadm
Setores          | 0     | (vazio)
Categorias       | 0     | (vazio)
```

---

## ✅ PASSO 2: VERIFICAR SISTEMA EM NUVEM

### 🌐 Site em Produção:

```
URL: https://inventarionsiuna.com.br
Status: ✅ Rodando em Railway
Banco: ✅ PostgreSQL Railway (tempo real)
Deploy: ✅ Automático via GitHub
```

### 🔄 Confirmar Deploy Atual:

1. **Verificar último commit:**
   ```
   Commit: 407a17e (debug logs em management-view)
   Status: Deve estar em produção
   ```

2. **Confirmar versão em produção:**
   ```
   1. Abrir: https://inventarionsiuna.com.br
   2. F12 → Console
   3. Procurar: "🔍 [page.tsx]" ou "🔄 [ManagementView]"
   4. Se aparecer → Versão CORRETA ✅
   5. Se não aparecer → Cache ou deploy não completou
   ```

---

## ✅ PASSO 3: LIMPAR CACHE DO NAVEGADOR

**IMPORTANTE:** Sistema em nuvem pode ter cache no navegador!

### Opção A: Aba Anônima (Mais Rápido)

```
1. CTRL + SHIFT + N (Chrome/Edge)
2. CTRL + SHIFT + P (Firefox)
3. Acessar: https://inventarionsiuna.com.br
4. Login: aimores / aimores
```

### Opção B: Limpar Cache (Definitivo)

```
1. CTRL + SHIFT + DELETE
2. Selecionar:
   ✅ Cookies e outros dados do site
   ✅ Imagens e arquivos em cache
3. Período: "Todo o período"
4. Limpar dados
5. FECHAR navegador completamente
6. Reabrir e acessar o site
```

---

## ✅ PASSO 4: TESTE EM TEMPO REAL

### 🧪 Teste Completo - Campus Aimorés:

```
1. 🌐 Abrir: https://inventarionsiuna.com.br
2. 🧹 Se já estava aberto: CTRL + SHIFT + R (recarregar forçado)
3. 🔑 Login: aimores / aimores
4. 🔍 F12 (abrir Console)
5. 📋 Clicar: Gerenciamento
6. ➕ Criar Setor:
   Nome: "TI"
   Descrição: "Tecnologia da Informação"
7. 👀 OBSERVAR:
```

#### ✅ Console Logs Esperados (Tempo Real):

```javascript
// AO CARREGAR PÁGINA:
🔍 [page.tsx] Buscando dados para técnico: {
  userName: "aimores",
  userRole: "tecnico",
  userCampusOriginal: {id: "campus-aimores", name: "Aimorés"},
  userCampusName: "Aimorés",
  userCampus: {id: "campus-aimores", name: "Aimorés"},
  userCampusId: "campus-aimores"  ← DEVE TER VALOR ✅
}

📊 [page.tsx] Dados carregados: {
  userCampusId: "campus-aimores",
  initialInventory: 0,  ← Vazio (apagou tudo)
  initialCategories: 0,  ← Vazio (apagou tudo)
  initialSectors: 0,  ← Vazio (apagou tudo)
  primeirosSetores: []
}

🔄 [ManagementView] Props atualizadas: {
  categoriesLength: 0,
  sectorsLength: 0,  ← Vazio porque ainda não criou
  userRole: "tecnico",
  userCampus: "Aimorés",
  timestamp: "2025-12-03T..."
}

// AO CRIAR SETOR:
🔍 Verificação de setor: {
  name: "TI",
  targetCampus: {id: "campus-aimores", name: "Aimorés"},
  targetCampusName: "Aimorés",  ← STRING (não objeto) ✅
  duplicateInSameCampus: false,
  allSectors: []
}

📝 Criando setor: {
  name: "TI",
  campusId: "campus-aimores",  ← VALOR CORRETO ✅
  targetCampusName: "Aimorés"
}

✅ Setor retornado do banco: {
  id: "sector-xxx",
  name: "TI",
  hasId: true,
  hasName: true,
  hasCampus: true,
  campusName: "Aimorés"
}

📊 Estado de setores atualizado: {
  antes: 0,
  depois: 1,  ← INCREMENTOU EM TEMPO REAL ✅
  novoSetor: "TI",
  todosSetores: [{
    id: "sector-xxx",
    name: "TI",
    description: "Tecnologia da Informação",
    campus: {id: "campus-aimores", name: "Aimorés"}
  }]
}

🔄 [ManagementView] Props atualizadas: {
  categoriesLength: 0,
  sectorsLength: 1,  ← ATUALIZOU EM TEMPO REAL ✅
  userRole: "tecnico",
  timestamp: "2025-12-03T..."
}

✅ [ManagementView] Técnico: retornando todos setores: {
  totalRetornado: 1,
  setores: ["TI"]  ← APARECE NA LISTA ✅
}
```

#### ✅ Interface (Visualmente):

```
📋 Gerenciamento
   └─ 📂 Setores
      └─ ✅ TI - Tecnologia da Informação
            [Editar] [Excluir]
```

**O setor APARECE IMEDIATAMENTE na tela! 🎉**

---

### 🧪 Teste Completo - Campus Liberdade:

```
1. 🚪 Fazer logout (ou abrir outra aba anônima)
2. 🔑 Login: liberdade / liberdade
3. 🔍 F12 (Console)
4. 📋 Gerenciamento
5. ➕ Criar Setor: "Administrativo"
6. ✅ DEVE APARECER apenas no campus Liberdade
7. ❌ NÃO DEVE aparecer o setor "TI" do Aimorés
```

#### ✅ Isolamento Funcionando:

```
USUÁRIO AIMORES:
📂 Setores:
   ✅ TI (criado por aimores)
   ❌ Administrativo (NÃO APARECE - é de outro campus)

USUÁRIO LIBERDADE:
📂 Setores:
   ❌ TI (NÃO APARECE - é de outro campus)
   ✅ Administrativo (criado por liberdade)

USUÁRIO ADMINISTRADOR:
📂 Setores:
   ✅ TI (Aimorés)
   ✅ Administrativo (Liberdade)
   (Admin vê TODOS)
```

---

## ✅ PASSO 5: VERIFICAR NO BANCO RAILWAY (Tempo Real)

### 🔍 Confirmar que salvou no banco:

**Executar no Railway → PostgreSQL → Query:**

```sql
-- VER TODOS SETORES CRIADOS:
SELECT 
  s.id,
  s.name as setor,
  s.description,
  c.name as campus,
  s.created_at,
  u.username as criado_por
FROM sectors s
LEFT JOIN campus c ON s.campus_id = c.id
LEFT JOIN users u ON s.created_by = u.id
ORDER BY s.created_at DESC;

-- RESULTADO ESPERADO:
-- id         | setor          | description      | campus     | created_at          | criado_por
-- ---------- | -------------- | ---------------- | ---------- | ------------------- | -----------
-- sector-xxx | TI             | Tecnologia...    | Aimorés    | 2025-12-03 02:45:00 | aimores
-- sector-yyy | Administrativo | Admin...         | Liberdade  | 2025-12-03 02:46:00 | liberdade
```

**Se aparecer na tabela → SALVOU NO BANCO EM TEMPO REAL! ✅**

---

## ❌ PROBLEMAS E SOLUÇÕES

### Problema 1: Console mostra `userCampusId: undefined`

**❌ Erro:**
```javascript
🔍 [page.tsx] {
  userCampusId: undefined  ← SEM VALOR!
}
```

**Causa:** Usuário não está vinculado ao campus no banco Railway

**Solução:** Executar no Railway:
```sql
-- Verificar:
SELECT username, campus_id FROM users WHERE username = 'aimores';

-- Se campus_id é NULL, corrigir:
UPDATE users SET campus_id = 'campus-aimores' WHERE username = 'aimores';
UPDATE users SET campus_id = 'campus-liberdade' WHERE username = 'liberdade';
```

### Problema 2: Console mostra `campusId: undefined` ao criar

**❌ Erro:**
```javascript
📝 Criando setor: {
  name: "TI",
  campusId: undefined  ← SEM VALOR!
}
```

**Causa:** Campus não foi encontrado pelo nome

**Solução:** Executar no Railway:
```sql
-- Verificar se campus existe:
SELECT id, name FROM campus WHERE name = 'Aimorés';

-- Se não existir, criar:
INSERT INTO campus (id, name) VALUES ('campus-aimores', 'Aimorés');
```

### Problema 3: Setor não aparece na lista

**❌ Sintoma:**
- Console mostra: `depois: 1` (incrementou)
- Console mostra: `todosSetores: [{...}]` (tem o setor)
- Mas NÃO aparece na tela

**Causa:** Cache do management-view.tsx

**Solução:**
```
1. CTRL + SHIFT + DELETE (limpar cache)
2. Fechar navegador completamente
3. Reabrir em aba anônima
4. Testar novamente
```

### Problema 4: Logs antigos (sem targetCampusName)

**❌ Sintoma:**
```javascript
🔍 Verificação de setor: {
  targetCampus: {...},
  // NÃO TEM targetCampusName!
}
```

**Causa:** Cache do navegador com código antigo

**Solução:**
```
1. Aba anônima: CTRL + SHIFT + N
2. Ou aguardar 5 minutos (Railway CDN propagação)
3. Ou CTRL + F5 (recarregar forçado)
```

---

## 📊 CHECKLIST COMPLETO

### No Railway (Banco):

- [ ] Script de correção executado
- [ ] Campus: Aimorés e Liberdade existem
- [ ] Usuários: aimores → campus-aimores
- [ ] Usuários: liberdade → campus-liberdade
- [ ] Usuários: admin/superadm → sem campus (NULL)
- [ ] Setores/categorias órfãos deletados

### No Navegador:

- [ ] Cache limpo (ou aba anônima)
- [ ] Console aberto (F12)
- [ ] Login como aimores
- [ ] Console mostra `userCampusId: "campus-aimores"`
- [ ] Criar setor mostra `campusId: "campus-aimores"`
- [ ] Console mostra `depois: 1` (incrementou)
- [ ] Setor APARECE na lista visualmente

### Tempo Real:

- [ ] Criar setor → Aparece imediatamente
- [ ] Recarregar página → Setor continua lá
- [ ] Login outro campus → NÃO vê setor do primeiro
- [ ] Banco Railway mostra setor com campus correto

---

## 🎯 RESUMO FINAL

**Sistema:** ✅ Rodando em nuvem (Railway)  
**URL:** https://inventarionsiuna.com.br  
**Banco:** PostgreSQL Railway (tempo real)  
**Campus:** Aimorés e Liberdade  

**Ações:**
1. ✅ Executar script SQL no Railway
2. ✅ Limpar cache do navegador
3. ✅ Testar criação de setor
4. ✅ Verificar que aparece em tempo real
5. ✅ Confirmar isolamento entre campus

**Tempo:** 5-10 minutos

---

**Status:** Guia completo para sistema em nuvem  
**Próximo:** Executar script SQL no Railway e testar
