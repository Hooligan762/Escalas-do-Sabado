# ✅ SCRIPT AUTOMÁTICO CONFIGURADO!

**Data:** 4 de dezembro de 2025  
**Status:** ✅ Script criado e configurado para executar automaticamente

---

## 🎯 O QUE FOI FEITO

### 1. Script Criado: `scripts/limpar-banco-railway.js`

**Localização:** `scripts/limpar-banco-railway.js`

**O que faz:**
- ✅ Verifica se banco já está correto (2 campus)
- ✅ Se não, deleta tudo (inventory, sectors, categories, campus)
- ✅ Cria apenas 2 campus: Aimorés e Liberdade
- ✅ Vincula usuários aos campus corretos
- ✅ Remove usuários desnecessários
- ✅ Mostra logs detalhados no console

**Como funciona:**
```javascript
// Verifica se já tem 2 campus corretos
if (totalCampus === 2 && campus são aimores/liberdade) {
  console.log('✅ Já está correto');
  return; // Não faz nada
}

// Se não, limpa e recria
DELETE FROM tudo;
INSERT campus Aimorés e Liberdade;
UPDATE users vinculando aos campus;
```

### 2. Package.json Atualizado

**Modificação:**
```json
"scripts": {
  "build": "node scripts/limpar-banco-railway.js && next build",
  "limpar-banco": "node scripts/limpar-banco-railway.js"
}
```

**Agora:**
- ✅ Toda vez que Railway fizer **build**, executa o script ANTES
- ✅ Script limpa banco se necessário
- ✅ Depois faz build normal

---

## 🚀 COMO ATIVAR

### Opção 1: Fazer Deploy Agora (Automático)

```bash
git add .
git commit -m "feat: adiciona script automático de limpeza do banco"
git push origin main
```

**Railway vai:**
1. Detectar novo código
2. Iniciar build
3. Executar `npm run build`
4. **Script limpar-banco-railway.js executa AUTOMATICAMENTE**
5. Limpa banco e cria 2 campus
6. Faz build do Next.js
7. Deploy completo

**Tempo:** 3-5 minutos

### Opção 2: Executar Manualmente Agora

```bash
npm run limpar-banco
```

**Isso vai:**
1. Executar o script imediatamente
2. Limpar banco Railway
3. Criar 2 campus
4. Mostrar resultado no console

---

## 📊 LOGS ESPERADOS

Quando o script executar (no Railway ou localmente):

```
🔧 Iniciando limpeza automática do banco Railway...
📊 Campus no banco: 5
🗑️ Limpando banco de dados...
✅ Inventário deletado
✅ Setores deletados
✅ Categorias deletadas
✅ Campus deletados
✅ 2 campus criados: Aimorés e Liberdade
✅ Usuários vinculados aos campus
✅ Usuários desnecessários removidos
📊 Resultado final: { campus: 2, setores: 0, categorias: 0, usuarios: 4 }
✅ Limpeza automática concluída com sucesso!
🎉 Script finalizado!
```

**Se já estiver correto:**
```
🔧 Iniciando limpeza automática do banco Railway...
📊 Campus no banco: 2
✅ Banco já está configurado corretamente (2 campus)
🎉 Script finalizado!
```

---

## 🎯 PRÓXIMOS PASSOS

### 1. Fazer Deploy

```bash
cd sistema-inventario-una
git add .
git commit -m "feat: adiciona script automático de limpeza do banco"
git push origin main
```

### 2. Aguardar Railway Build (3-5 min)

Railway vai executar automaticamente:
```
Railway Build Process:
1. git pull (pegar código novo)
2. npm install (instalar dependências)
3. npm run build
   ↓
   → node scripts/limpar-banco-railway.js  ← EXECUTA AQUI!
   → next build
4. Deploy
```

### 3. Verificar Logs no Railway

```
Railway Dashboard → Deployments → Ver logs
Procurar por: "🔧 Iniciando limpeza automática"
```

### 4. Testar Sistema

```
1. Limpar cache: CTRL + SHIFT + N
2. https://inventarionsiuna.com.br
3. Login: aimores / aimores
4. Gerenciamento
5. ✅ Deve ver apenas campus Aimorés
6. Criar setor: "TI"
7. ✅ Deve aparecer imediatamente
```

---

## ✅ VANTAGENS DESTE MÉTODO

### Antes (Manual):
❌ Você precisava executar SQL manualmente  
❌ Fácil esquecer de executar  
❌ Cada ambiente (dev, prod) precisava executar separado  

### Agora (Automático):
✅ **Executa sozinho a cada deploy**  
✅ **Verifica se já está correto** (não re-executa se desnecessário)  
✅ **Logs detalhados** para debug  
✅ **Idempotente** (pode executar múltiplas vezes sem problemas)  
✅ **Transacional** (usa BEGIN/COMMIT, rollback em caso de erro)  

---

## 🔍 DETALHES TÉCNICOS

### Script É Inteligente:

```javascript
// 1. Verifica antes de fazer qualquer coisa
if (banco já tem 2 campus corretos) {
  return; // Não faz nada
}

// 2. Usa transação (segurança)
BEGIN;
  DELETE...
  INSERT...
  UPDATE...
COMMIT; // ou ROLLBACK se der erro

// 3. Logs detalhados
console.log('✅ Cada etapa');

// 4. Verifica resultado final
SELECT COUNT(*) FROM campus; // Deve ser 2
```

### Quando Executa:

1. **A cada deploy no Railway** (via `npm run build`)
2. **Manualmente** (via `npm run limpar-banco`)
3. **Desenvolvimento local** (opcional, se executar comando)

### Segurança:

- ✅ Usa variável de ambiente `DATABASE_URL`
- ✅ SSL configurado para Railway
- ✅ Transação com rollback automático em erro
- ✅ Não executa se já estiver correto

---

## 📁 ARQUIVOS CRIADOS/MODIFICADOS

### Criados:
1. ✅ `scripts/limpar-banco-railway.js` - Script automático
2. ✅ `prisma/migrations/20251204000000_limpar_campus/migration.sql` - SQL puro (alternativa)

### Modificados:
1. ✅ `package.json` - Adicionado comando build com script

---

## 🧪 TESTE LOCAL (Opcional)

Se quiser testar antes de fazer deploy:

```bash
# 1. Verificar se DATABASE_URL está configurada
echo $env:DATABASE_URL

# 2. Executar script
npm run limpar-banco

# 3. Verificar resultado
# Deve mostrar: ✅ 2 campus, 0 setores, 0 categorias
```

---

## ❓ FAQ

### Q: O script vai deletar tudo SEMPRE que fizer deploy?
**A:** NÃO! Ele verifica primeiro. Se já tiver 2 campus corretos, não faz nada.

### Q: E se eu quiser desabilitar?
**A:** Editar `package.json` e remover `node scripts/limpar-banco-railway.js &&` do comando build.

### Q: Posso executar manualmente?
**A:** SIM! Use `npm run limpar-banco` a qualquer momento.

### Q: E se der erro?
**A:** Script tem rollback automático. Nada muda se der erro.

### Q: Funciona em produção E desenvolvimento?
**A:** SIM! Usa `DATABASE_URL` do ambiente (Railway ou local).

---

## 🎉 RESUMO

**Status:** ✅ Configurado e pronto para usar  
**Próximo:** Fazer `git push` para ativar  
**Resultado:** Banco limpo automaticamente a cada deploy  
**Tempo:** 5 minutos para primeiro deploy  

---

**Criado:** 4/12/2025  
**Arquivos:** 2 criados, 1 modificado  
**Próximo:** git push origin main
