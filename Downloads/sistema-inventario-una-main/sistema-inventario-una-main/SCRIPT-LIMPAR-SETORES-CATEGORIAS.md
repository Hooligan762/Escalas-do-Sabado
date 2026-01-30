# 🗑️ SCRIPT SQL - LIMPAR SETORES E CATEGORIAS

**Objetivo:** Manter apenas 2 campus (Aimorés e Liberdade) e limpar setores/categorias  
**Resultado:** Banco limpo para você adicionar dados pelo sistema  

---

## ⚠️ EXECUTAR NO RAILWAY

```
1. https://railway.app
2. Login
3. Projeto: inventarionsiuna
4. PostgreSQL
5. Data
6. Query
```

---

## 📝 SCRIPT SQL COMPLETO

**Copiar e colar no Railway Query:**

```sql
-- ============================================================
-- LIMPEZA COMPLETA - MANTER APENAS 2 CAMPUS
-- Deletar: setores, categorias, inventário
-- Manter: campus Aimorés e Liberdade, usuários
-- ============================================================

-- 🔴 PASSO 1: VERIFICAR ANTES DE LIMPAR
-- ============================================================
SELECT 
  'ANTES DA LIMPEZA' as status,
  (SELECT COUNT(*) FROM campus) as total_campus,
  (SELECT COUNT(*) FROM users) as total_usuarios,
  (SELECT COUNT(*) FROM sectors) as total_setores,
  (SELECT COUNT(*) FROM categories) as total_categorias,
  (SELECT COUNT(*) FROM inventory) as total_inventario;

-- ============================================================
-- 🗑️ PASSO 2: DELETAR TUDO (SETORES, CATEGORIAS, INVENTÁRIO)
-- ============================================================

-- 2.1: Deletar TODO inventário
DELETE FROM inventory;

-- 2.2: Deletar TODOS setores
DELETE FROM sectors;

-- 2.3: Deletar TODAS categorias
DELETE FROM categories;

-- 2.4: Deletar TODOS campus (vamos recriar apenas 2)
DELETE FROM campus;

-- ============================================================
-- 🏫 PASSO 3: CRIAR APENAS 2 CAMPUS
-- ============================================================

INSERT INTO campus (id, name, created_at, updated_at) VALUES
('campus-aimores', 'Aimorés', NOW(), NOW()),
('campus-liberdade', 'Liberdade', NOW(), NOW());

-- ============================================================
-- 👥 PASSO 4: VINCULAR USUÁRIOS AOS CAMPUS
-- ============================================================

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

-- Deletar outros usuários (se existirem):
DELETE FROM users 
WHERE username NOT IN ('aimores', 'liberdade', 'administrador', 'superadm');

-- ============================================================
-- ✅ PASSO 5: VERIFICAÇÃO FINAL
-- ============================================================

-- 5.1: Contadores após limpeza
SELECT 
  'DEPOIS DA LIMPEZA' as status,
  (SELECT COUNT(*) FROM campus) as total_campus,
  (SELECT COUNT(*) FROM users WHERE username IN ('aimores', 'liberdade', 'administrador', 'superadm')) as total_usuarios,
  (SELECT COUNT(*) FROM sectors) as total_setores,
  (SELECT COUNT(*) FROM categories) as total_categorias,
  (SELECT COUNT(*) FROM inventory) as total_inventario;

-- 5.2: Estrutura completa
SELECT 
  '🏫 CAMPUS' as tipo,
  id as id_completo,
  name as nome,
  created_at
FROM campus
ORDER BY name;

-- 5.3: Usuários e seus campus
SELECT 
  '👤 USUÁRIO' as tipo,
  username as nome,
  role as funcao,
  COALESCE(campus_id, '(admin - acesso total)') as campus_vinculado,
  created_at
FROM users
WHERE username IN ('aimores', 'liberdade', 'administrador', 'superadm')
ORDER BY 
  CASE role
    WHEN 'superadmin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'tecnico' THEN 3
  END,
  username;

-- 5.4: Confirmação de limpeza
SELECT 
  '✅ CONFIRMAÇÃO' as status,
  CASE 
    WHEN (SELECT COUNT(*) FROM campus) = 2 THEN '✅ 2 campus'
    ELSE '❌ Erro: ' || (SELECT COUNT(*) FROM campus) || ' campus'
  END as campus_ok,
  CASE 
    WHEN (SELECT COUNT(*) FROM sectors) = 0 THEN '✅ Setores limpos'
    ELSE '❌ Ainda há ' || (SELECT COUNT(*) FROM sectors) || ' setores'
  END as setores_ok,
  CASE 
    WHEN (SELECT COUNT(*) FROM categories) = 0 THEN '✅ Categorias limpas'
    ELSE '❌ Ainda há ' || (SELECT COUNT(*) FROM categories) || ' categorias'
  END as categorias_ok,
  CASE 
    WHEN (SELECT COUNT(*) FROM inventory) = 0 THEN '✅ Inventário limpo'
    ELSE '❌ Ainda há ' || (SELECT COUNT(*) FROM inventory) || ' itens'
  END as inventario_ok;
```

---

## ✅ RESULTADO ESPERADO

### Tabela 1: ANTES DA LIMPEZA
```
status              | total_campus | total_usuarios | total_setores | total_categorias | total_inventario
------------------- | ------------ | -------------- | ------------- | ---------------- | ----------------
ANTES DA LIMPEZA    | X            | Y              | Z             | W                | K
```

### Tabela 2: DEPOIS DA LIMPEZA
```
status              | total_campus | total_usuarios | total_setores | total_categorias | total_inventario
------------------- | ------------ | -------------- | ------------- | ---------------- | ----------------
DEPOIS DA LIMPEZA   | 2            | 4              | 0             | 0                | 0
```

### Tabela 3: CAMPUS
```
tipo      | id_completo        | nome      | created_at
--------- | ------------------ | --------- | ----------
🏫 CAMPUS | campus-aimores     | Aimorés   | 2025-12-04...
🏫 CAMPUS | campus-liberdade   | Liberdade | 2025-12-04...
```

### Tabela 4: USUÁRIOS
```
tipo       | nome          | funcao     | campus_vinculado         | created_at
---------- | ------------- | ---------- | ------------------------ | ----------
👤 USUÁRIO | superadm      | superadmin | (admin - acesso total)   | ...
👤 USUÁRIO | administrador | admin      | (admin - acesso total)   | ...
👤 USUÁRIO | aimores       | tecnico    | campus-aimores           | ...
👤 USUÁRIO | liberdade     | tecnico    | campus-liberdade         | ...
```

### Tabela 5: CONFIRMAÇÃO
```
status        | campus_ok    | setores_ok           | categorias_ok         | inventario_ok
------------- | ------------ | -------------------- | --------------------- | ------------------
✅ CONFIRMAÇÃO| ✅ 2 campus  | ✅ Setores limpos    | ✅ Categorias limpas  | ✅ Inventário limpo
```

**✅ Se todas confirmações mostrarem "✅" → LIMPEZA CONCLUÍDA COM SUCESSO!**

---

## 🧪 TESTAR APÓS EXECUTAR SCRIPT

### 1. Limpar Cache do Navegador

```
CTRL + SHIFT + N (aba anônima)
```

### 2. Testar Criação de Setor (Campus Aimorés)

```
1. https://inventarionsiuna.com.br
2. Login: aimores / aimores
3. F12 (Console aberto)
4. Gerenciamento
5. Criar Setor: "TI"
6. OBSERVAR:
```

**✅ Console DEVE mostrar:**
```javascript
🔍 [page.tsx] Buscando dados para técnico: {
  userName: "aimores",
  userCampusName: "Aimorés",
  userCampusId: "campus-aimores"  ← TEM VALOR ✅
}

📊 [page.tsx] Dados carregados: {
  userCampusId: "campus-aimores",
  initialSectors: 0,  ← ZERO (banco limpo) ✅
  initialCategories: 0  ← ZERO (banco limpo) ✅
}

🔍 Verificação de setor: {
  name: "TI",
  targetCampusName: "Aimorés",  ← STRING ✅
  duplicateInSameCampus: false  ← Nenhum setor ainda ✅
}

📝 Criando setor: {
  name: "TI",
  campusId: "campus-aimores"  ← VALOR CORRETO ✅
}

📊 Estado atualizado: {
  antes: 0,
  depois: 1  ← INCREMENTOU ✅
}
```

**✅ Na tela:**
```
📋 Gerenciamento
   └─ 📂 Setores
      └─ ✅ TI
```

**✅ SETOR APARECE IMEDIATAMENTE!**

### 3. Verificar no Banco Railway

```sql
-- Railway → Query:
SELECT 
  s.id,
  s.name as setor,
  c.name as campus,
  s.created_at
FROM sectors s
JOIN campus c ON s.campus_id = c.id
ORDER BY s.created_at DESC;

-- Resultado esperado:
-- id         | setor | campus   | created_at
-- ---------- | ----- | -------- | ----------
-- sector-xxx | TI    | Aimorés  | 2025-12-04...
```

**✅ Se aparecer na tabela → SALVOU NO BANCO EM TEMPO REAL!**

### 4. Testar Isolamento (Campus Liberdade)

```
1. Logout (ou nova aba anônima)
2. Login: liberdade / liberdade
3. Gerenciamento
4. ✅ Lista de setores VAZIA (não vê "TI" do Aimorés)
5. Criar Setor: "Administrativo"
6. ✅ Aparece "Administrativo"
7. ❌ NÃO aparece "TI" (isolamento funcionando)
```

**Resultado:**
- Campus **Aimorés**: só vê "TI"
- Campus **Liberdade**: só vê "Administrativo"
- **Administrador**: vê ambos

---

## 📊 RESUMO DO QUE O SCRIPT FAZ

### ✅ Deleta:
- ❌ TODO inventário
- ❌ TODOS setores (todas tabelas)
- ❌ TODAS categorias (todas tabelas)
- ❌ TODOS campus antigos

### ✅ Cria:
- ✅ Campus "Aimorés" (ID: campus-aimores)
- ✅ Campus "Liberdade" (ID: campus-liberdade)

### ✅ Mantém:
- ✅ 4 usuários: aimores, liberdade, administrador, superadm
- ✅ Vínculos corretos (aimores → Aimorés, liberdade → Liberdade)
- ✅ Admins sem campus (veem todos os dados)

### ✅ Resultado:
- 🏫 2 campus
- 👥 4 usuários
- 📂 0 setores (pronto para adicionar pelo sistema)
- 🏷️ 0 categorias (pronto para adicionar pelo sistema)
- 📦 0 inventário (pronto para adicionar pelo sistema)

---

## 🎯 CHECKLIST COMPLETO

### No Railway:

- [ ] Abrir Railway → PostgreSQL → Data → Query
- [ ] Copiar script SQL completo
- [ ] Executar script
- [ ] Ver tabela "DEPOIS DA LIMPEZA": 2 campus, 0 setores, 0 categorias
- [ ] Ver tabela "CONFIRMAÇÃO": todas marcadas com ✅

### No Sistema:

- [ ] Limpar cache (CTRL + SHIFT + N - aba anônima)
- [ ] Login: aimores / aimores
- [ ] F12 (Console aberto)
- [ ] Console mostra: userCampusId: "campus-aimores"
- [ ] Console mostra: initialSectors: 0 (banco limpo)
- [ ] Criar setor "TI"
- [ ] Console mostra: campusId: "campus-aimores"
- [ ] Console mostra: depois: 1 (incrementou)
- [ ] Setor "TI" APARECE na tela
- [ ] Recarregar página → Setor continua aparecendo
- [ ] Login liberdade → NÃO vê setor "TI"

---

## ⚠️ IMPORTANTE

### Após executar o script:

1. ✅ **Banco LIMPO** - Pode adicionar dados pelo sistema
2. ✅ **2 Campus** - Apenas Aimorés e Liberdade
3. ✅ **4 Usuários** - aimores, liberdade, administrador, superadm
4. ✅ **Isolamento** - Cada campus vê só seus dados
5. ✅ **Tempo Real** - Dados salvam imediatamente no Railway

### O que você vai fazer depois:

```
1. Login como aimores
2. Gerenciamento → Adicionar setores/categorias
3. Dados salvam no banco Railway
4. Aparecem imediatamente na tela
5. Campus Liberdade NÃO vê dados do Aimorés
```

---

## 🚀 RESUMO

**Script:** Limpa setores/categorias, mantém 2 campus  
**Tempo:** 2 minutos para executar  
**Resultado:** Banco limpo para você adicionar dados  
**Próximo:** Executar script → Limpar cache → Testar!

---

**Status:** ✅ Script pronto para execução  
**Arquivo:** SCRIPT-LIMPAR-SETORES-CATEGORIAS.md  
**Ação:** Copiar e executar no Railway agora!
