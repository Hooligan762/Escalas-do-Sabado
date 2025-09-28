# 🏫 Sistema de Inventário - UNA

Sistema de gestão de inventário desenvolvido para a Universidade UNA, permitindo controle de equipamentos por campus com diferentes níveis de acesso.

## 🚀 Tecnologias

- **Next.js 15.5.4** - Framework React com SSR
- **TypeScript** - Tipagem estática
- **PostgreSQL** - Banco de dados relacional
- **Tailwind CSS** - Framework de CSS
- **Lucide Icons** - Biblioteca de ícones
- **bcrypt** - Hash de senhas
- **date-fns** - Manipulação de datas

## 📋 Funcionalidades

### 👥 Níveis de Usuário
- **Super Admin (full)** - Acesso completo ao sistema
- **Admin** - Gestão de usuários e configurações
- **Técnico de Campus** - Gestão do inventário do seu campus

### 📊 Módulos
- **Dashboard** - Visão geral e estatísticas
- **Inventário** - Cadastro e gestão de equipamentos
- **Empréstimos** - Controle de empréstimos de equipamentos
- **Solicitações** - Gerenciamento de solicitações
- **Gerenciamento** - Administração de categorias e setores
- **Relatórios** - Logs de auditoria e relatórios

## 🛠️ Instalação Local

### Pré-requisitos
- Node.js 18+
- PostgreSQL 12+
- npm ou yarn

### Passos

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/sistema-inventario-una.git
   cd sistema-inventario-una
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure o banco de dados**
   ```bash
   # Crie um banco PostgreSQL chamado 'nsi_inventario_db'
   # Execute o script schema.sql para criar as tabelas
   # Execute o script seed.sql para dados iniciais
   ```

4. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env.local
   # Edite .env.local com suas credenciais de banco
   ```

5. **Execute o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

6. **Acesse o sistema**
   ```
   http://localhost:9002
   ```

## 👤 Usuários Padrão

### Super Administrador
- **Usuário:** `full`
- **Senha:** `Full030695@7621`

### Administrador
- **Campus:** Administrador
- **Usuário:** `admin`
- **Senha:** `password`

## 🚀 Deploy

### Railway (Recomendado)
1. Conecte o repositório GitHub ao Railway
2. Railway detectará automaticamente Next.js
3. Adicione um banco PostgreSQL
4. Configure as variáveis de ambiente
5. Deploy automático!

### Variáveis de Ambiente para Produção
```env
DATABASE_URL=postgresql://usuario:senha@host:5432/database
NODE_ENV=production
```

## 📁 Estrutura do Projeto

```
├── src/
│   ├── app/                 # Pages (App Router)
│   ├── components/          # Componentes React
│   │   ├── dashboard/       # Componentes do dashboard
│   │   ├── auth/           # Componentes de autenticação
│   │   └── ui/             # Componentes base
│   ├── lib/                # Utilitários e configurações
│   └── hooks/              # Custom hooks
├── public/                 # Arquivos estáticos
├── prisma/                # Schema do banco (se usando Prisma)
└── docs/                  # Documentação
```

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run start        # Servidor de produção
npm run lint         # Linting do código
npm run fix-encoding # Correção de encoding UTF-8
```

## 📚 Documentação

- [Blueprint do Sistema](./docs/blueprint.md)
- Guias de implementação na pasta `/docs`

## 🤝 Contribuição

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é proprietário da Universidade UNA.

## 👨‍💻 Desenvolvido por

Sistema desenvolvido para o Núcleo de Suporte à Informática (NSI) da UNA.