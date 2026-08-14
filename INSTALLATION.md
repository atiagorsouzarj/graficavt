# GrafCenter - Instrução de Instalação

Sistema de Gerenciamento de Impressoras e Precificação para Gráfica.

## Stack Tecnológico

- **Frontend:** Next.js 16.2.6
- **ORM:** Drizzle ORM
- **Database:** PostgreSQL
- **Process Manager:** PM2
- **Node.js:** v20+

## Pré-requisitos

- PostgreSQL 12+ rodando
- Node.js 20+
- npm ou yarn
- PM2 instalado globalmente (`npm install -g pm2`)

## Instalação

### 1. Dependências

```bash
npm install
```

### 2. Variáveis de Ambiente

Criar `.env.local`:

```
DATABASE_URL=postgresql://usuario:senha@host:5432/database?schema=public
```

### 3. Schema do Banco de Dados

```bash
# Gerar migração SQL
npm run db:generate

# Aplicar schema ao banco (alternativa não-interativa)
psql -U usuario -d database -h host -f drizzle/0000_powerful_echo.sql
```

### 4. Seed de Dados Iniciais

```bash
node seed.mjs
```

Popula o banco com:
- 5 categorias de impressoras (Laser, Jato de Tinta, Térmica, 3D, Sublimação)
- 9 impressoras pré-configuradas
- Categorias de produtos, materiais, serviços e acabamentos
- Formatos de impressão (A4, A3, A3+, fotos, etiquetas, 3D)
- Tabelas de preços DTF e Comunicação Visual

### 5. Build

```bash
npm run build
```

### 6. Iniciar com PM2

```bash
pm2 start npm --name grafcenter -- start
pm2 save
```

Ou manualmente:

```bash
npm start
```

A aplicação estará disponível em `http://localhost:3000`

## Estrutura do Projeto

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── impressoras/    # Printer management
│   ├── produtos/       # Product catalog
│   ├── materiais/      # Material inventory
│   ├── orcamentos/     # Quotes management
│   └── ...
├── db/
│   ├── schema.ts       # Drizzle schema definition
│   ├── index.ts        # Database connection
│   └── queries.ts      # Database queries
├── components/         # React components
└── styles/            # Global styles

drizzle/
├── 0000_powerful_echo.sql  # Database schema migration
└── meta/                   # Migration metadata

seed.mjs               # Initial data seeding
```

## Scripts Disponíveis

- `npm run dev` - Desenvolvimento (modo watch)
- `npm run build` - Build para produção
- `npm start` - Inicia servidor Next.js
- `npm run db:generate` - Gera migração Drizzle
- `npm run db:push` - Aplica migração ao banco (requer TTY)
- `npm run lint` - Lint do código

## Notas de Segurança

- Nunca commitar `.env.local` com credenciais reais
- Usar variáveis de ambiente em produção
- Mudar credenciais padrão do banco de dados
- Implementar autenticação/autorização conforme necessário

## Troubleshooting

### Erro: "relation 'settings' does not exist"

**Causa:** Schema não foi criado

**Solução:**
```bash
psql -U postgres -d app_db -h 127.0.0.1 -f drizzle/0000_powerful_echo.sql
```

### Erro: "Interactive prompts require a TTY terminal"

**Causa:** Usando `npm run db:push` em ambiente não-interativo

**Solução:** Usar `psql` diretamente ou usar `npm run db:generate` + `psql`

### Aplicação não responde

Verificar PM2:
```bash
pm2 list
pm2 logs grafcenter
pm2 restart grafcenter
```

## Suporte

Para issues ou dúvidas, contactar a equipe VT Digital.
