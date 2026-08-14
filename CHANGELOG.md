# Changelog — GrafCenter

Todas as mudanças relevantes do projeto. Formato baseado em
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e
[Semantic Versioning](https://semver.org/lang/pt-BR/).

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
