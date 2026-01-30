# 🔍 VERIFICAÇÃO - BANCO RAILWAY LIMPO

**Problema:** Após limpar dados do Railway, setores/categorias não aparecem

**Situação:** 
- ✅ Campus: Aimorés e Liberdade (mantidos)
- ✅ Usuários: administrador, superadm, aimores, liberdade (mantidos)
- ❌ Setores: APAGADOS
- ❌ Categorias: APAGADAS

---

## 🚨 POSSÍVEIS CAUSAS

### 1. Campus sem ID ou com ID incorreto

Após deletar, os IDs dos campus podem estar diferentes:

```sql
-- Verificar IDs atuais:
SELECT id, name FROM campus;

-- Resultado esperado:
-- id              | name
-- --------------- | ----------
-- campus-aimores  | Aimorés
-- campus-liberdade| Liberdade
```

**Problema:** Se IDs mudaram, usuários podem estar vinculados a campus inexistentes!

### 2. Usuários sem campus_id

```sql
-- Verificar relacionamento:
SELECT username, campus_id FROM users WHERE username IN ('aimores', 'liberdade');

-- Resultado esperado:
-- username  | campus_id
-- --------- | ---------------
-- aimores   | campus-aimores
-- liberdade | campus-liberdade
```

**Problema:** Se `campus_id` é NULL → `userCampusId = undefined` → backend retorna vazio!

### 3. Dados salvos com campus_id errado

```sql
-- Verificar setores criados:
SELECT id, name, campus_id FROM sectors ORDER BY created_at DESC LIMIT 10;

-- Verificar se campus_id existe:
SELECT s.name, s.campus_id, c.name as campus_name
FROM sectors s
LEFT JOIN campus c ON s.campus_id = c.id;

-- Se campus_name é NULL → campus_id não existe!
```

---

## 🔧 SCRIPTS DE CORREÇÃO

### Script 1: Recriar Campus com IDs Corretos

```sql
-- 1. Deletar campus existentes (se necessário):
DELETE FROM campus;

-- 2. Inserir campus com IDs conhecidos:
INSERT INTO campus (id, name, created_at, updated_at) VALUES
('campus-aimores', 'Aimorés', NOW(), NOW()),
('campus-liberdade', 'Liberdade', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- 3. Verificar:
SELECT * FROM campus;
```

### Script 2: Vincular Usuários aos Campus

```sql
-- Atualizar usuários técnicos:
UPDATE users SET campus_id = 'campus-aimores' WHERE username = 'aimores';
UPDATE users SET campus_id = 'campus-liberdade' WHERE username = 'liberdade';

-- Verificar:
SELECT username, campus_id FROM users WHERE username IN ('aimores', 'liberdade', 'administrador', 'superadm');
```

### Script 3: Limpar Setores/Categorias Órfãos

```sql
-- Deletar setores com campus_id inválido:
DELETE FROM sectors WHERE campus_id NOT IN (SELECT id FROM campus);

-- Deletar categorias com campus_id inválido:
DELETE FROM categories WHERE campus_id NOT IN (SELECT id FROM campus);

-- Verificar:
SELECT COUNT(*) FROM sectors;
SELECT COUNT(*) FROM categories;
```

---

## 🧪 TESTE PASSO A PASSO

### Passo 1: Executar Scripts de Correção

```sql
-- Railway Dashboard → Data → Query:

-- 1. Recriar campus:
DELETE FROM campus;
INSERT INTO campus (id, name, created_at, updated_at) VALUES
('campus-aimores', 'Aimorés', NOW(), NOW()),
('campus-liberdade', 'Liberdade', NOW(), NOW());

-- 2. Vincular usuários:
UPDATE users SET campus_id = 'campus-aimores' WHERE username = 'aimores';
UPDATE users SET campus_id = 'campus-liberdade' WHERE username = 'liberdade';

-- 3. Limpar dados órfãos:
DELETE FROM sectors WHERE campus_id NOT IN (SELECT id FROM campus);
DELETE FROM categories WHERE campus_id NOT IN (SELECT id FROM campus);

-- 4. Verificar:
SELECT 'CAMPUS' as tipo, id, name FROM campus
UNION ALL
SELECT 'USER', username, campus_id FROM users WHERE username IN ('aimores', 'liberdade')
UNION ALL
SELECT 'SETOR', id, name || ' (' || campus_id || ')' FROM sectors
UNION ALL
SELECT 'CATEGORIA', id, name || ' (' || campus_id || ')' FROM categories;
```

### Passo 2: Limpar Cache do Navegador

```
1. CTRL + SHIFT + DELETE
2. Marcar "Cookies e cache"
3. Limpar "Todo o período"
4. Reabrir navegador
```

### Passo 3: Testar Criação

```
1. Login: aimores / aimores
2. F12 (Console aberto)
3. Gerenciamento
4. Criar Setor: "TI"
5. OBSERVAR LOGS:
```

**Logs Esperados:**

```javascript
// 1. LOAD:
🔍 [page.tsx] Buscando dados para técnico: {
  userName: "aimores",
  userCampusName: "Aimorés",
  userCampusId: "campus-aimores"  ← DEVE TER VALOR ✅
}

📊 [page.tsx] Dados carregados: {
  userCampusId: "campus-aimores",  ← DEVE TER VALOR ✅
  initialSectors: 0  ← ZERO porque apagou tudo ✅
}

// 2. CRIAR SETOR:
🔍 Verificação de setor: {
  name: "TI",
  targetCampusName: "Aimorés"  ← DEVE TER VALOR ✅
}

📝 Criando setor: {
  name: "TI",
  campusId: "campus-aimores"  ← DEVE TER VALOR ✅
}

✅ Setor retornado do banco: {
  id: "sector-xxx",
  name: "TI",
  campusName: "Aimorés"
}

📊 Estado atualizado: {
  antes: 0,
  depois: 1,  ← INCREMENTOU ✅
  novoSetor: "TI"
}
```

**E o setor APARECE na lista! ✅**

### Passo 4: Verificar no Banco

```sql
-- Confirmar que foi salvo:
SELECT id, name, campus_id, created_at 
FROM sectors 
WHERE name = 'TI'
ORDER BY created_at DESC
LIMIT 1;

-- Deve retornar:
-- id         | name | campus_id       | created_at
-- ---------- | ---- | --------------- | ----------
-- sector-xxx | TI   | campus-aimores  | 2025-12-03 ...
```

---

## ❌ SE NÃO FUNCIONAR

### Cenário 1: Console mostra `userCampusId: undefined`

**Problema:** Usuário não está vinculado ao campus

**Solução:**
```sql
-- Verificar:
SELECT username, campus_id FROM users WHERE username = 'aimores';

-- Se campus_id é NULL, corrigir:
UPDATE users SET campus_id = 'campus-aimores' WHERE username = 'aimores';
```

### Cenário 2: Console mostra `campusId: undefined` ao criar

**Problema:** Campus não foi encontrado pelo nome

**Solução:**
```sql
-- Verificar nome exato:
SELECT id, name FROM campus WHERE name LIKE '%Aimor%';

-- Se não encontrar, verificar encoding:
SELECT id, name, LENGTH(name), encode(name::bytea, 'hex') 
FROM campus;

-- Recriar com nome correto:
DELETE FROM campus WHERE id = 'campus-aimores';
INSERT INTO campus (id, name) VALUES ('campus-aimores', 'Aimorés');
```

### Cenário 3: Setor salvo mas não aparece

**Problema:** Campus_id salvo está diferente do userCampusId

**Verificação:**
```sql
-- 1. Ver campus do usuário:
SELECT campus_id FROM users WHERE username = 'aimores';
-- Resultado: campus-aimores

-- 2. Ver campus do setor criado:
SELECT campus_id FROM sectors WHERE name = 'TI' ORDER BY created_at DESC LIMIT 1;
-- Resultado: ???

-- 3. Se forem diferentes, corrigir setor:
UPDATE sectors 
SET campus_id = (SELECT campus_id FROM users WHERE username = 'aimores')
WHERE name = 'TI';
```

---

## 🎯 CHECKLIST COMPLETO

### No Railway (SQL):

- [ ] Campus existem com IDs corretos
  ```sql
  SELECT * FROM campus;
  ```

- [ ] Usuários vinculados aos campus
  ```sql
  SELECT username, campus_id FROM users WHERE username IN ('aimores', 'liberdade');
  ```

- [ ] Sem setores/categorias órfãos
  ```sql
  SELECT COUNT(*) FROM sectors WHERE campus_id NOT IN (SELECT id FROM campus);
  ```

### No Navegador:

- [ ] Cache limpo (CTRL + SHIFT + DELETE)
- [ ] Console aberto (F12)
- [ ] Login como aimores
- [ ] Console mostra `userCampusId: "campus-aimores"`
- [ ] Criar setor mostra `campusId: "campus-aimores"`
- [ ] Setor aparece na lista

---

## 📝 SCRIPT COMPLETO DE CORREÇÃO

Execute este script no Railway (Data → Query):

```sql
-- ========================================
-- SCRIPT COMPLETO DE CORREÇÃO
-- ========================================

-- 1. RECRIAR CAMPUS COM IDS CONHECIDOS
-- ========================================
DELETE FROM campus WHERE id IN ('campus-aimores', 'campus-liberdade');

INSERT INTO campus (id, name, created_at, updated_at) VALUES
('campus-aimores', 'Aimorés', NOW(), NOW()),
('campus-liberdade', 'Liberdade', NOW(), NOW());

-- 2. VINCULAR USUÁRIOS AOS CAMPUS
-- ========================================
UPDATE users SET campus_id = 'campus-aimores', updated_at = NOW() 
WHERE username = 'aimores';

UPDATE users SET campus_id = 'campus-liberdade', updated_at = NOW() 
WHERE username = 'liberdade';

-- Admins sem campus específico (podem acessar todos):
UPDATE users SET campus_id = NULL, updated_at = NOW() 
WHERE username IN ('administrador', 'superadm');

-- 3. LIMPAR DADOS ÓRFÃOS
-- ========================================
DELETE FROM inventory WHERE campus_id NOT IN (SELECT id FROM campus);
DELETE FROM sectors WHERE campus_id NOT IN (SELECT id FROM campus);
DELETE FROM categories WHERE campus_id NOT IN (SELECT id FROM campus);

-- 4. VERIFICAÇÃO FINAL
-- ========================================
SELECT 
  'CAMPUS' as tipo, 
  id as identificador, 
  name as nome,
  NULL as campus_vinculado
FROM campus

UNION ALL

SELECT 
  'USUARIO' as tipo,
  id as identificador,
  username as nome,
  campus_id as campus_vinculado
FROM users
WHERE username IN ('aimores', 'liberdade', 'administrador', 'superadm')

ORDER BY tipo, nome;

-- Resultado esperado:
-- tipo    | identificador      | nome          | campus_vinculado
-- ------- | ------------------ | ------------- | ----------------
-- CAMPUS  | campus-aimores     | Aimorés       | NULL
-- CAMPUS  | campus-liberdade   | Liberdade     | NULL
-- USUARIO | user-xxx           | administrador | NULL
-- USUARIO | user-xxx           | aimores       | campus-aimores
-- USUARIO | user-xxx           | liberdade     | campus-liberdade
-- USUARIO | user-xxx           | superadm      | NULL
```

---

## 🎉 APÓS EXECUTAR O SCRIPT

1. **Fechar todas as abas do site**
2. **Limpar cache: CTRL + SHIFT + DELETE**
3. **Reabrir navegador**
4. **Login: aimores / aimores**
5. **F12 → Console**
6. **Gerenciamento → Criar Setor: "TI"**
7. **✅ DEVE APARECER na lista!**

---

**Status:** Script de correção pronto  
**Próximo:** Executar SQL no Railway  
**Tempo:** 2 minutos
