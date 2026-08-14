# Update Log - GrafCenter

Histórico de atualizações e melhorias do sistema.

---

## [1.5.0] — 2026-08-14

### ✨ Novas Features

#### Pipeline Comercial (CRM)
- Gerenciamento de leads com origem, responsável, valor estimado, probabilidade
- Etapas do pipeline: Prospecção → Negociação → Proposta → Ganho/Perdido
- Drag-and-drop entre etapas com reordenação automática
- Histórico de atividades por lead
- Rota: `/crm`

#### Cliente 360°
- Perfil unificado com timeline de relacionamento
- Visualização de oportunidades, orçamentos, pedidos, produção
- Histórico financeiro integrado
- Identidade comercial unificada (avatar PF/PJ, documento, contato)
- Rota: `/clientes/[id]`

#### Pedidos & Ordem de Produção
- Conversão idempotente de orçamento aprovado para pedido
- Snapshot de itens e preços no momento da venda
- Estados: comercial, produção, arte, entrega
- Rastreamento visual do status
- Rota: `/pedidos`

#### Aprovação de Arte
- Versionamento de arquivos com histórico
- Estados: pendente, aprovado, revisão solicitada
- Sistema de comentários integrado
- Bloqueio operacional quando em revisão
- Integrado ao pedido

#### Fornecedores & Compras (v1.5.0)
- Cadastro completo de fornecedores com contatos
- Pedidos de compra pesquisáveis por período, fornecedor, status
- Recebimento automático de itens no estoque
- Preços históricos por fornecedor
- Rotas: `/fornecedores`, `/compras`

#### Agenda de Produção
- Planejamento semanal por máquina
- Horário e duração de produção
- Estados: planejado, em produção, pausado, concluído
- Visualização em calendário
- Rota: `/agenda-producao`

#### Entregas & Retiradas (v1.5.0)
- Tipos: motoboy, Correios, transportadora, balcão
- Agendamento de data/hora
- Rastreio integrado
- Estados: pendente, entregue, devolvido
- Rota: `/entregas`

#### Busca Global
- Campo de busca no topo da navegação
- Busca em tempo real: clientes, produtos, pedidos, orçamentos
- Sugestões rápidas com atalhos

### 🔧 Alterações

#### Banco de Dados
- 28 → 33 tabelas (+5 novas)
- Novas tabelas: `art_approvals`, `crm_activities`, `crm_leads`, `deliveries`, `orders`, `production_schedules`, `purchases`, `suppliers`
- Tabelas estendidas: `customers` (32 cols), `products` (33 cols)
- Migration: `0001_sour_morph.sql`

#### Interface
- Navegação reorganizada em seções: Comercial, Operação, Compras/Estoque, Catálogo/Precificação
- Identidade comercial unificada em todos os modais e cards
- Modais com cabeçalho fixo e conteúdo rolável
- Melhor responsividade mobile

#### Performance
- Query caching em relacionamentos complexos
- Pré-carregamento de dados em Cliente 360
- Otimização de filtros em ordens de compra

### 🐛 Bugfixes
- Resolvido erro de schema não criado na atualização
- Corrigidos tipos de dados na migração de estoque
- Melhorada consistência de identidade visual em PDV

### 📊 Tabelas Adicionadas

```sql
-- CRM & Comercial
CREATE TABLE crm_leads (...)
CREATE TABLE crm_activities (...)
CREATE TABLE art_approvals (...)

-- Operação
CREATE TABLE orders (...)
CREATE TABLE production_schedules (...)
CREATE TABLE deliveries (...)

-- Compras
CREATE TABLE suppliers (...)
CREATE TABLE purchases (...)
```

### ✅ Testes Realizados

- ✅ Rotas testadas: /crm, /pedidos, /fornecedores, /compras, /agenda-producao, /entregas
- ✅ Banco de dados com 33 tabelas íntegras
- ✅ Integração com cliente 360 funcionando
- ✅ Pipeline CRM com drag-and-drop operacional
- ✅ Busca global indexando corretamente

---

## [1.3.1] — 2026-08-14

### 🔧 Corrigido
- Nova identidade visual de cliente centralizada (avatar, documento, contato, tags, status)
- CRM com ficha comercial consistente
- Cupom térmico 80mm com separadores CSS contínuos
- Contraste de impressão reforçado em impressoras térmicas
- Modal de cliente com cabeçalho fixo e scroll apenas no conteúdo
- Kanban com rolagem melhorada

---

## [1.3.0] — 2026

### ✨ Adicionado
- Interface base do GrafCenter
- Gerenciamento de impressoras e categorias
- Catálogo de produtos com precificação
- Sistema de orçamentos
- PDV integrado
- Kanban board

---

## Guia de Atualização

### De v1.3.1 para v1.5.0

```bash
# 1. Atualizar código
git pull origin main

# 2. Instalar dependências (mesmas da v1.3.1)
npm install

# 3. Gerar e aplicar migrations
npx drizzle-kit generate
psql -U postgres -d app_db -f drizzle/0001_sour_morph.sql

# 4. Build
npm run build

# 5. Restart com PM2
pm2 restart erp-grafica
```

### Rollback para v1.3.1

```bash
# Se necessário voltar para a versão anterior
git checkout a74b54e  # commit da v1.3.1
npm install
npm run build
pm2 restart erp-grafica
```

---

## Roadmap Futuro

- [ ] Integração com sistemas de pagamento (PIX, cartão, boleto)
- [ ] Relatórios avançados com gráficos
- [ ] App mobile para acompanhamento de pedidos
- [ ] Integração com marketplaces
- [ ] Automação de emails de acompanhamento
- [ ] Sistema de permissões por usuário
- [ ] Backup automático do banco
- [ ] Sincronização com contábil

