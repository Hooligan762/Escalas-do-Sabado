## 🚀 Comandos para conectar ao GitHub

Após criar o repositório no GitHub, execute estes comandos:

```bash
# Adicionar o repositório remoto (substitua SEU_USUARIO pelo seu username do GitHub)
git remote add origin https://github.com/SEU_USUARIO/sistema-inventario-una.git

# Configurar a branch principal
git branch -M main

# Fazer o primeiro push
git push -u origin main
```

## ✅ Verificar se funcionou:
```bash
# Ver se o remote foi adicionado
git remote -v

# Ver status do repositório
git status
```

## 🎯 Próximo passo: Railway
Após subir para o GitHub:
1. Acesse https://railway.app
2. Faça login com sua conta GitHub
3. Clique em "Deploy from GitHub repo"
4. Selecione o repositório "sistema-inventario-una"
5. Railway detectará Next.js automaticamente
6. Adicione um banco PostgreSQL
7. Deploy automático!
