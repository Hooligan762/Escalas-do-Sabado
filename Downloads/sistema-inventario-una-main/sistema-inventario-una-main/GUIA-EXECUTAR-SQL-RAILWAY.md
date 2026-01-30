# 🔴 GUIA URGENTE - LIMPAR BANCO RAILWAY AGORA

**Problema:** Ainda aparecem outros campus e dados antigos no sistema  
**Causa:** O script SQL ainda NÃO foi executado no Railway  
**Solução:** Você precisa executar manualmente (eu não tenho acesso ao Railway)

---

## ⚠️ IMPORTANTE: EU NÃO POSSO FAZER ISSO POR VOCÊ!

O código do sistema está correto e atualizado no GitHub.  
Mas o **BANCO DE DADOS** está no Railway e **só você tem acesso**.

**Eu posso:** Criar scripts SQL para você executar  
**Eu NÃO posso:** Acessar seu Railway e executar comandos

---

## 🎯 PASSO A PASSO (5 MINUTOS):

### 1️⃣ ABRIR RAILWAY

```
1. Abrir navegador
2. Ir para: https://railway.app
3. Fazer login
4. Clicar no projeto: inventarionsiuna
```

### 2️⃣ ABRIR POSTGRESQL

```
1. Na lista de serviços, clicar em: PostgreSQL
2. Clicar na aba: Data
3. Clicar em: Query (ícone </> ou "Query")
```

Você verá uma caixa de texto para escrever SQL.

### 3️⃣ COPIAR SCRIPT ABAIXO

**SCRIPT COMPLETO - COPIAR TUDO:**

```sql
-- ============================================================
-- LIMPEZA TOTAL - REMOVER TUDO E DEIXAR APENAS 2 CAMPUS
-- ============================================================

-- VER O QUE TEM ANTES:
SELECT 'CAMPUS ANTES' as info, id, name FROM campus;
SELECT 'SETORES ANTES' as info, COUNT(*) as total FROM sectors;
SELECT 'CATEGORIAS ANTES' as info, COUNT(*) as total FROM categories;

-- DELETAR TUDO:
DELETE FROM inventory;
DELETE FROM sectors;
DELETE FROM categories;
DELETE FROM campus;

-- CONFIRMAR QUE DELETOU:
SELECT 'DEPOIS DE DELETAR' as info, 
  (SELECT COUNT(*) FROM campus) as campus,
  (SELECT COUNT(*) FROM sectors) as setores,
  (SELECT COUNT(*) FROM categories) as categorias,
  (SELECT COUNT(*) FROM inventory) as inventario;

-- CRIAR APENAS 2 CAMPUS:
INSERT INTO campus (id, name, created_at, updated_at) VALUES
('campus-aimores', 'Aimorés', NOW(), NOW()),
('campus-liberdade', 'Liberdade', NOW(), NOW());

-- VINCULAR USUÁRIOS:
UPDATE users SET campus_id = 'campus-aimores', updated_at = NOW() WHERE username = 'aimores';
UPDATE users SET campus_id = 'campus-liberdade', updated_at = NOW() WHERE username = 'liberdade';
UPDATE users SET campus_id = NULL, updated_at = NOW() WHERE username IN ('administrador', 'superadm');

-- DELETAR USUÁRIOS QUE NÃO SÃO NECESSÁRIOS:
DELETE FROM users WHERE username NOT IN ('aimores', 'liberdade', 'administrador', 'superadm');

-- VERIFICAR RESULTADO FINAL:
SELECT 'CAMPUS FINAL' as tipo, id, name, created_at FROM campus ORDER BY name;

SELECT 'USUÁRIOS FINAL' as tipo, 
  username as nome, 
  role as funcao, 
  COALESCE(campus_id, '(sem campus - admin)') as campus
FROM users 
WHERE username IN ('aimores', 'liberdade', 'administrador', 'superadm')
ORDER BY role, username;

SELECT 'TOTAIS FINAL' as info,
  (SELECT COUNT(*) FROM campus) as campus,
  (SELECT COUNT(*) FROM users WHERE username IN ('aimores', 'liberdade', 'administrador', 'superadm')) as usuarios,
  (SELECT COUNT(*) FROM sectors) as setores,
  (SELECT COUNT(*) FROM categories) as categorias,
  (SELECT COUNT(*) FROM inventory) as inventario;
```

### 4️⃣ COLAR NO RAILWAY

```
1. Selecionar TODO o script acima (arrastar mouse)
2. CTRL + C (copiar)
3. Voltar para Railway → Query
4. CTRL + V (colar na caixa de texto)
5. Clicar em: "Run" ou pressionar CTRL + ENTER
```

### 5️⃣ VERIFICAR RESULTADO

Você deve ver várias tabelas de resultado. A última deve mostrar:

```
info         | campus | usuarios | setores | categorias | inventario
------------ | ------ | -------- | ------- | ---------- | ----------
TOTAIS FINAL | 2      | 4        | 0       | 0          | 0
```

**✅ Se mostrar isso → LIMPEZA CONCLUÍDA!**

---

## 🧪 TESTAR NO SISTEMA

### 1. Limpar Cache do Navegador

```
1. CTRL + SHIFT + N (aba anônima)
2. Ou CTRL + SHIFT + DELETE (limpar cache)
```

### 2. Acessar Sistema

```
1. https://inventarionsiuna.com.br
2. Login: aimores / aimores
3. F12 (Console aberto)
```

### 3. Verificar Campus

```
1. Ir em: Gerenciamento
2. Você NÃO deve ver outros campus
3. Deve ver apenas: Aimorés (se logado como aimores)
```

### 4. Criar Setor Teste

```
1. Gerenciamento → Adicionar Setor
2. Nome: "TI"
3. Descrição: "Tecnologia"
4. Adicionar
```

**✅ Console DEVE mostrar:**
```javascript
🔍 [page.tsx] { userCampusId: "campus-aimores" }
📊 [page.tsx] { initialSectors: 0 }  ← Banco limpo
📝 Criando setor: { campusId: "campus-aimores" }
📊 Estado: { antes: 0, depois: 1 }  ← Criou!
```

**✅ Na tela:**
```
📋 Gerenciamento
   └─ 📂 Setores
      └─ TI
```

**SETOR APARECE!** 🎉

---

## ❓ POR QUE EU NÃO POSSO FAZER ISSO POR VOCÊ?

### O que eu fiz:
✅ Corrigi o código do sistema (commits 7eb1cbb, 8c67da5, 407a17e)  
✅ Enviei para GitHub (git push)  
✅ Railway fez deploy automático  
✅ Criei scripts SQL para você executar  

### O que eu NÃO posso fazer:
❌ Acessar seu banco Railway (não tenho login/senha)  
❌ Executar comandos SQL remotamente  
❌ Ver ou modificar seus dados  

### Analogia:
Imagine que:
- Eu consertei o carro (código)
- O carro está na garagem (Railway)
- Mas só você tem a chave da garagem
- Eu posso te dar o manual de como dirigir, mas não posso dirigir por você

---

## 📊 O QUE ESTÁ ACONTECENDO AGORA

### No GitHub (Código):
✅ **CORRETO** - Todos os commits feitos  
✅ **ATUALIZADO** - Railway já fez deploy  
✅ **FUNCIONANDO** - Sistema funcionando perfeitamente  

### No Railway (Banco de Dados):
❌ **DESATUALIZADO** - Ainda tem campus antigos  
❌ **DADOS VELHOS** - Setores/categorias antigas  
❌ **PRECISA LIMPAR** - Você precisa executar SQL  

### Resultado:
O sistema está **TENTANDO** buscar dados do banco antigo, por isso ainda aparecem outros campus.

---

## 🔴 RESUMO VISUAL

```
VOCÊ → [Railway.app] → [PostgreSQL] → [Query] → [Colar Script] → [Run]
                                                                      ↓
                                                            BANCO LIMPO ✅
                                                                      ↓
VOCÊ → [inventarionsiuna.com.br] → [Login] → [Gerenciamento] → FUNCIONA ✅
```

---

## ✅ CHECKLIST

- [ ] Abri Railway.app
- [ ] Cliquei em PostgreSQL
- [ ] Cliquei em Data → Query
- [ ] Copiei o script SQL completo
- [ ] Colei na caixa Query
- [ ] Cliquei em "Run"
- [ ] Vi resultado: 2 campus, 0 setores, 0 categorias
- [ ] Limpei cache do navegador (CTRL + SHIFT + N)
- [ ] Testei no sistema
- [ ] Setor aparece quando crio

**Se TODOS marcados → PRONTO!** 🎉

---

## 🆘 SE TIVER DÚVIDA

**Não consegue achar Railway Query?**
1. Railway.app → Login
2. Projeto "inventarionsiuna" (ou nome do seu projeto)
3. Na lista lateral, clicar "PostgreSQL" (ícone de cilindro)
4. No topo, clicar aba "Data"
5. Botão "Query" ou ícone </> 

**Script deu erro?**
- Copiar mensagem de erro completa
- Me enviar aqui
- Vou corrigir o script

**Não tem acesso ao Railway?**
- Verificar login/senha
- Perguntar ao administrador do projeto
- Sem acesso = não consegue limpar banco

---

**Status:** ⚠️ Script pronto mas NÃO EXECUTADO  
**Ação:** VOCÊ precisa executar no Railway  
**Tempo:** 5 minutos  
**Resultado:** Banco limpo com apenas 2 campus
