# Changelog — GrafCenter

Todas as mudanças relevantes do projeto. Formato baseado em
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e
[Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [1.4.0] — 2026

### ✨ Adicionado
- **Pipeline Comercial (CRM):** leads, origem, responsável, valor estimado, probabilidade, próxima ação e drag-and-drop entre etapas.
- **Cliente 360:** perfil com timeline de relacionamento, oportunidades, orçamentos, pedidos, produção, vendas e financeiro.
- **Pedidos & Ordem de Produção:** conversão idempotente de orçamento aprovado, snapshot de itens e status comercial/produção/arte/entrega.
- **Aprovação de Arte:** versões de arquivo, status pendente/aprovado/revisão, comentários e bloqueio operacional visível no pedido.
- **Fornecedores & Compras:** cadastro de fornecedores, pedidos de compra pesquisáveis e recebimento automático no estoque.
- **Agenda de Produção:** planejamento semanal por máquina, horário, duração e estado de produção.
- **Entregas & Retiradas:** motoboy, Correios, transportadora ou balcão com agendamento, rastreio e status.
- Busca global no topo para clientes, produtos, pedidos e orçamentos.
- Navegação lateral reorganizada em Comercial/CRM, Operação, Compras/Estoque e Catálogo/Precificação.

### 🔧 Alterado
- Cards e seletores de cliente passaram a usar uma identidade comercial unificada em CRM, PDV, Orçamento, Kanban e Cliente 360.
- Orçamento aprovado pode ser convertido diretamente em Pedido/OS.

---

## [1.3.1] — 2026

### 🔧 Corrigido
- **Nova identidade visual de cliente** centralizada e aplicada ao CRM, seleção de orçamento, PDV e cards do Kanban.
- CRM passou a exibir ficha comercial consistente: avatar PF/PJ, documento, contato, cidade/UF, tags, status e atalho de WhatsApp.
- Cupom térmico de **80 mm** passou a usar separadores CSS contínuos; remove quebra de traços na linha seguinte.
- Contraste de impressão do cupom reforçado para preto real e peso tipográfico maior em impressoras térmicas.
- Modal de cliente e Kanban mantêm cabeçalho fixo e rolagem apenas no conteúdo, evitando formulário deslocado ou parcialmente oculto.

---

## [1.3.0] — 2026

### ✨ Adicionado
- **Categorias editáveis por módulo**: Produtos, Materiais, Serviços, Acabamentos e Tabelas de Preços.
- Categorias iniciais de Produtos: Gráfica, Papelaria Personalizada, Brindes, DTF, Produtos 3D, Sublimação e Comunicação Visual.
- Categorias iniciais de Tabelas: DTF e Comunicação Visual.
- Módulo de **Movimentação de Estoque** com entradas, saídas, ajuste, referência e saldo automático.
- Baixa automática de materiais/produtos rastreados ao finalizar venda no PDV.
- Consulta de CEP via ViaCEP no CRM, preenchendo logradouro, bairro, cidade e UF.
- Validação de CPF/CNPJ, telefone, WhatsApp, e-mail, CEP, UF e duplicidade de documento no cadastro de cliente.
- Busca pesquisável para cliente, produto e serviço em PDV, Orçamento, Produto e Kanban.
- Arrastar e soltar nativo no Kanban de Produção.
- Orçamento aprovado cria/atualiza card de produção automaticamente no Kanban.
- Formatos de impressora editáveis por categoria.
- Documento de proposta para a futura lógica de tiragens em `docs/PRECIFICACAO-TIRAGEM.md`.

---

## [1.2.0] — 2026

### ✨ Adicionado
- **Novo layout claro e profissional** em todo o sistema (tema light, acentos ciano/azul).
- **Sidebar agrupada** com ícones coloridos: Visão Geral, Comercial, Catálogo & Produção, Comunicação.
- **Git + versionamento** do projeto (`.gitignore`, `VERSION`, `CHANGELOG.md`).
- **Instalador automático** — `scripts/install.sh` (pré-requisitos, .env, deps, schema, seed, build).
- **Atualizador automático** — `scripts/update.sh` (backup do banco, git pull, deps, migração, build).
- **Script de versionamento** — `scripts/bump-version.sh` (patch/minor/major).
- Página **Relatórios** com indicadores consolidados.
- Impressora 3D agora usa **volume/peça (gramas)** em vez de formato de papel fixo.

### 🔧 Alterado
- Formatos de impressão padronizados: **A4, A3, A3+** para todas as impressoras 2D.
- Jato de Tinta ganhou formatos fotográficos: **10x15, 13x18, 15x20, 20x30, 30x40**.
- Cupom fiscal reformulado no padrão **80 colunas** (impressora térmica).
- Ordem de Produção (OS) com layout profissional em azul.

---

## [1.1.0] — 2026

### ✨ Adicionado
- **Tabelas de Preços independentes**: DTF UV, DTF Têxtil, Lona e Adesivo Vinil.
  Compõem produto **ou** serviço, sem se misturarem.
- **Consumíveis reais pesquisados**:
  - Konica C284-e: Toner TN321 (K/C/M/Y), **4 Cilindros DR-512 separados**,
    Developer DV-512, Caixa de Resíduo WX-103, Fusora, Unidade de Transferência.
  - Epson L18050: **6 cores** (K/C/M/Y/LC/LM) + **Caixa de Manutenção C9345**,
    rendimento real de 2.100 fotos 10x15 por garrafa colorida.
  - Térmica: **Ribbon 110x76m** (preto, dourado, prata, rose gold) —
    lógica `ribbon por etiqueta + rolo de etiqueta`.
  - Sublimação: **4 tintas** (K/C/M/Y) com rendimento por garrafa.
- Tema escuro (posteriormente substituído pelo tema claro na v1.2.0).

### 🔧 Alterado
- **DTF removido das impressoras** — agora é serviço terceirizado com tabela de preços.
- Materiais expandidos: papéis fotográficos por tamanho, rolos de etiqueta, filamentos.

---

## [1.0.0] — 2026

### ✨ Adicionado
- **Motor de Precificação**: Categoria → Consumíveis → Impressora → Produto.
- **CRM** completo com todos os campos PF e PJ.
- **ERP**: Orçamentos (com OS/PDF), PDV (com cupom fiscal), Kanban, Financeiro.
- **Materiais e Insumos**, **Acabamentos**, **Serviços** (próprios e terceirizados).
- **Painel de Controle** com impostos e taxas de maquininha configuráveis.
- **APIs isoladas** para sistemas externos: WhatsApp/E-mail, VoIP e Portal de Clientes.
