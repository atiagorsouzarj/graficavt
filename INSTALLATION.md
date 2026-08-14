# GrafCenter - Instrução de Instalação

ERP + CRM Completo para Gráfica Rápida, Papelaria Personalizada e Impressoras 3D.

**Versão Atual:** v1.5.0  
**Atualizado:** 2026-08-14

## Stack Tecnológico

- **Frontend:** Next.js 16.2.6 (React 19.2.6)
- **ORM:** Drizzle ORM 0.45.2
- **Database:** PostgreSQL 12+ (33 tabelas)
- **Process Manager:** PM2
- **Node.js:** v20+
- **Styling:** Tailwind CSS 4.1.17

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
# Gerar migrações SQL (cria drizzle/*.sql)
npx drizzle-kit generate

# Aplicar todas as migrações ao banco (não-interativo)
psql -U usuario -d database -h host -f drizzle/0000_powerful_echo.sql
psql -U usuario -d database -h host -f drizzle/0001_sour_morph.sql
```

**Tabelas Criadas (33 total):**

**Impressoras & Produção:**
- printer_categories, printers, printer_consumables, print_formats
- production_schedules (novo v1.5.0)

**Produtos & Estoque:**
- products, product_materials, product_finishings
- materials, finishing_items, services
- item_categories, stock_movements

**Clientes & Comercial (v1.5.0):**
- customers (estendido - 32 cols)
- crm_leads, crm_activities, art_approvals (novos)

**Pedidos & Vendas:**
- orders, quote_items, sales (novo)
- deliveries (novo)

**Compras & Fornecedores (v1.5.0):**
- suppliers, purchases (novos)

**Precificação:**
- pricing_tables

**Financeiro:**
- transactions

**Sistema:**
- settings, api_integrations, kanban_cards

### 4. Seed de Dados Iniciais (Opcional)

```bash
node seed.mjs
```

Popula o banco com dados de demonstração:
- 5 categorias de impressoras (Laser, Jato de Tinta, Térmica, 3D, Sublimação)
- 9 impressoras pré-configuradas
- Categorias de produtos, materiais, serviços e acabamentos
- Formatos de impressão (A4, A3, A3+, fotos, etiquetas, 3D em gramas)
- Tabelas de preços DTF UV, DTF Têxtil, Lona e Adesivo

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

## Módulos do Sistema (v1.5.0)

### 📊 Comercial & CRM
- **Pipeline Comercial** (/crm) - Leads, etapas, probabilidade, drag-and-drop
- **Cliente 360** (/clientes/[id]) - Timeline, oportunidades, histórico completo
- **Busca Global** - Clientes, produtos, pedidos, orçamentos em tempo real

### 📦 Operação
- **Impressoras** (/impressoras) - Gerenciamento e precificação
- **Pedidos & OS** (/pedidos) - Conversão inteligente de orçamento para produção
- **Aprovação de Arte** - Versões de arquivo, comentários, bloqueio operacional
- **Agenda de Produção** (/agenda-producao) - Planejamento semanal por máquina
- **Entregas** (/entregas) - Motoboy, Correios, transportadora, balcão

### 💰 Compras & Estoque
- **Fornecedores** (/fornecedores) - Cadastro e integração
- **Compras** (/compras) - Pedidos de compra pesquisáveis
- **Estoque** - Recebimento automático de compras

### 🎨 Catálogo & Precificação
- **Produtos** (/produtos) - Catálogo com precificação
- **Materiais** - Estoque de matéria-prima
- **Serviços** - Acabamentos terceirizados
- **Tabelas de Preços** - DTF, Lona, Adesivo, Comunicação Visual

### 📋 Suporte
- **Kanban** - Workflow visual customizável
- **Relatórios** - Análises de vendas, produção, financeiro
- **Integrações** - WhatsApp, VoIP, Portal, Email
- **Configurações** - Sistema, usuários, permissões

## Scripts Disponíveis

- `npm run dev` - Desenvolvimento (modo watch)
- `npm run build` - Build para produção
- `npm start` - Inicia servidor Next.js
- `npm run lint` - Lint do código
- `npm run typecheck` - Verificação de tipos TypeScript
- `node seed.mjs` - Popular banco com dados iniciais

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
