# 🔍 DIAGNÓSTICO: Por Que Técnicos Não Veem Dados

**Data:** 12 de novembro de 2025, 02:15  
**Problema:** Admin vê dados, técnicos (aimores, liberdade) NÃO veem  
**Status:** 🔄 INVESTIGANDO

---

## 🧪 TESTE URGENTE (5 minutos)

### Aguardar Deploy (commit 8c67da5):
- Railway está fazendo deploy dos logs de debug
- Aguardar 3-5 minutos

### Teste 1: Admin (Deve Funcionar)

```
1. Abrir: https://inventarionsiuna.com.br
2. Login: admin / [senha_admin]
3. Console (F12) - Ver logs:
   👑 [page.tsx] Buscando dados para admin (sem filtro)
   📊 [page.tsx] Dados carregados: {
     userCampusId: undefined,
     initialSectors: X,  ← Deve ter setores
     initialCategories: Y  ← Deve ter categorias
   }
4. Ir: Gerenciamento
5. ✅ Deve ver setores/categorias
```

### Teste 2: Técnico Aimorés (NÃO Funciona - INVESTIGAR)

```
1. Abrir aba anônima: CTRL + SHIFT + N
2. Abrir: https://inventarionsiuna.com.br
3. Login: aimores / aimores
4. Console (F12) - Ver logs:
   🔍 [page.tsx] Buscando dados para técnico: {
     userName: "aimores",
     userRole: "tecnico",
     userCampusOriginal: ???,  ← O QUE APARECE AQUI?
     userCampusName: ???,      ← O QUE APARECE AQUI?
     userCampus: ???,          ← O QUE APARECE AQUI?
     userCampusId: ???,        ← O QUE APARECE AQUI?
     campusList: [...]
   }
   📊 [page.tsx] Dados carregados: {
     userCampusId: ???,        ← O QUE APARECE AQUI?
     initialSectors: ???,      ← Deve ser 0 se userCampusId está errado
     initialCategories: ???
   }
5. Ir: Gerenciamento
6. ❌ Lista vazia
```

---

## 🔍 CENÁRIOS POSSÍVEIS

### Cenário 1: userCampusId = undefined

```javascript
🔍 Buscando dados para técnico: {
  userCampusOriginal: "Aimorés",  // ou {id, name}
  userCampusName: "Aimorés",
  userCampus: undefined,  ← PROBLEMA AQUI!
  userCampusId: undefined  ← RESULTADO: FILTRO NÃO FUNCIONA
}
```

**Causa:** Campus "Aimorés" não existe na tabela `campus`  
**Solução:** Criar campus no banco

### Cenário 2: userCampusName não bate com nome no banco

```javascript
🔍 Buscando dados para técnico: {
  userCampusName: "Aimorés",  ← Com acento
  campusList: [
    {id: "1", name: "Aimores"},  ← Sem acento!
    {id: "2", name: "Liberdade"}
  ],
  userCampus: undefined,  ← NÃO ENCONTROU
  userCampusId: undefined
}
```

**Causa:** Nome do campus do usuário != nome na tabela campus  
**Solução:** Padronizar nomes

### Cenário 3: user.campus está como objeto mas deveria ser string

```javascript
🔍 Buscando dados para técnico: {
  userCampusOriginal: {id: "1", name: "Aimorés"},  ← OBJETO
  userCampusName: "Aimorés",  ← Extraiu corretamente
  userCampus: {id: "campus-aimores", name: "Aimorés"},  ← Encontrou!
  userCampusId: "campus-aimores"  ← CORRETO!
}
```

**Neste caso deveria funcionar!**

### Cenário 4: Backend retorna lista vazia

```javascript
📊 Dados carregados: {
  userCampusId: "campus-aimores",  ← TEM ID
  initialSectors: 0,  ← MAS RETORNA 0!
  initialCategories: 0
}
```

**Causa:** Não há setores/categorias criados para esse campus ainda  
**Ou:** campus_id dos setores não bate com userCampusId

---

## 🛠️ SOLUÇÕES BASEADAS NO LOG

### Se userCampusId = undefined:

**Problema:** Campus não encontrado em `campusList`

**Solução 1:** Verificar nome do campus no banco Railway
```sql
SELECT id, name FROM campus ORDER BY name;
```

**Solução 2:** Criar campus se não existe
```sql
INSERT INTO campus (id, name) 
VALUES ('campus-aimores', 'Aimorés');
```

**Solução 3:** Atualizar usuário para apontar para campus correto
```sql
UPDATE users 
SET campus_id = 'campus-aimores' 
WHERE username = 'aimores';
```

### Se userCampusId está correto MAS initialSectors = 0:

**Problema:** Não há setores criados para esse campus

**Solução:** Criar setores como admin primeiro
```
1. Login como admin
2. Gerenciamento
3. Criar setores para diferentes campus
4. Verificar que campus_id está sendo salvo corretamente
```

**Ou verificar:**
```sql
SELECT s.id, s.name, s.campus_id, c.name as campus_name
FROM sectors s
LEFT JOIN campus c ON s.campus_id = c.id
WHERE s.campus_id = 'campus-aimores';
```

---

## 📋 CHECKLIST DE DIAGNÓSTICO

Após deploy (3-5 min):

- [ ] Limpar cache (CTRL + SHIFT + DELETE)
- [ ] Abrir aba anônima
- [ ] Login como `aimores` / `aimores`
- [ ] Abrir Console (F12)
- [ ] Copiar logs de `[page.tsx]`
- [ ] Anotar valores de:
  - `userCampusOriginal`
  - `userCampusName`
  - `userCampus`
  - `userCampusId`
  - `initialSectors`
  - `initialCategories`
- [ ] Compartilhar logs aqui

---

## 🎯 AÇÕES IMEDIATAS

### Opção 1: Esperar Logs do Deploy

```
1. Aguardar 3-5 minutos (Railway deploy)
2. Limpar cache e testar
3. Copiar logs do console
4. Analisar qual cenário acima se aplica
5. Aplicar solução específica
```

### Opção 2: Verificar Banco Direto (Railway Dashboard)

```
1. Abrir: https://railway.app
2. Login na conta
3. Projeto: sistema-inventario-una
4. Database → Query
5. Executar queries de diagnóstico (abaixo)
```

#### Queries de Diagnóstico:

```sql
-- 1. Ver todos os campus
SELECT id, name FROM campus ORDER BY name;

-- 2. Ver usuário aimores
SELECT u.id, u.username, u.role, u.campus_id, c.name as campus_name
FROM users u
LEFT JOIN campus c ON u.campus_id = c.id
WHERE u.username = 'aimores';

-- 3. Ver setores do campus Aimorés
SELECT s.id, s.name, s.campus_id, c.name as campus_name
FROM sectors s
LEFT JOIN campus c ON s.campus_id = c.id
WHERE c.name LIKE '%Aimor%'
ORDER BY s.name;

-- 4. Ver TODOS os setores (para comparar)
SELECT s.id, s.name, s.campus_id, c.name as campus_name
FROM sectors s
LEFT JOIN campus c ON s.campus_id = c.id
ORDER BY c.name, s.name
LIMIT 20;
```

---

## 🔍 RESULTADOS ESPERADOS

### Se Campus NÃO Existe:

```sql
-- Query 1:
┌────────────────────┬────────────────┐
│ id                 │ name           │
├────────────────────┼────────────────┤
│ campus-admin       │ Administrador  │
│ campus-liberdade   │ Liberdade      │
└────────────────────┴────────────────┘
-- ❌ "Aimorés" NÃO aparece!
```

**Solução:**
```sql
INSERT INTO campus (id, name) VALUES ('campus-aimores', 'Aimorés');
```

### Se Usuário Não Tem campus_id:

```sql
-- Query 2:
┌─────┬──────────┬────────┬───────────┬─────────────┐
│ id  │ username │ role   │ campus_id │ campus_name │
├─────┼──────────┼────────┼───────────┼─────────────┤
│ ... │ aimores  │ tecnico│ NULL      │ NULL        │
└─────┴──────────┴────────┴───────────┴─────────────┘
-- ❌ campus_id = NULL!
```

**Solução:**
```sql
UPDATE users 
SET campus_id = 'campus-aimores' 
WHERE username = 'aimores';
```

### Se Setores Não Existem para Campus:

```sql
-- Query 3:
-- (nenhum resultado)
-- ❌ Não há setores criados ainda!
```

**Solução:** Criar setores via interface como admin primeiro

---

## 📝 PRÓXIMOS PASSOS

1. **URGENTE:** Testar após deploy e copiar logs do console
2. **Identificar:** Qual dos 4 cenários acima se aplica
3. **Aplicar:** Solução específica para o cenário
4. **Validar:** Testar novamente após correção

---

**Criado por:** GitHub Copilot  
**Problema:** Técnicos não veem dados (admin vê)  
**Status:** Aguardando logs do deploy para diagnóstico  
**Commit:** 8c67da5 (logs de debug adicionados)
