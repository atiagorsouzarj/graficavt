# 🖨️ GrafCenter — ERP + CRM para Gráfica Rápida

Sistema completo de gestão, **precificação inteligente** e CRM para gráfica rápida,
papelaria personalizada, sublimação, impressão 3D e comunicação visual.

![versão](https://img.shields.io/badge/versão-1.3.0-06b6d4)
![stack](https://img.shields.io/badge/Next.js-16-black)
![db](https://img.shields.io/badge/PostgreSQL-Drizzle-336791)

---

## ⚡ Instalação rápida

```bash
git clone <seu-repositorio> grafcenter
cd grafcenter
bash scripts/install.sh
```

O instalador cuida de tudo: pré-requisitos, `.env`, dependências, schema do
banco, dados de demonstração (opcional) e build de produção.

### Atualizar o sistema

```bash
bash scripts/update.sh
```

Faz **backup do banco**, `git pull`, atualiza dependências, aplica migrações e
recompila. Use `--no-backup` ou `--no-git` para pular etapas.

### Versionamento

```bash
bash scripts/bump-version.sh patch   # 1.2.0 -> 1.2.1
bash scripts/bump-version.sh minor   # 1.2.0 -> 1.3.0
bash scripts/bump-version.sh major   # 1.2.0 -> 2.0.0
```

---

## ⚙️ O Motor de Precificação

O coração do sistema. Tudo é decomposto e transparente:

```
CATEGORIA (define a lógica)
   │  modo de medição: por folha | por etiqueta | por grama
   │  consumíveis + custo fixo + fator de perda
   ▼
IMPRESSORA (herda a categoria × fator de ajuste)
   ▼
PRODUTO = Impressão + Material + Acabamento + Serviço
          └─ custo base ÷ (1 − margem) = preço de venda
             + impostos + taxa de maquininha = PREÇO FINAL
```

### Modos de medição

| Categoria | Modo | Lógica |
|---|---|---|
| **Laser** (Konica C284-e) | por folha | Toners TN321 + **4 cilindros DR-512** + developers DV-512 + resíduo + fusora |
| **Jato de Tinta** (Epson L18050) | por folha | **6 cores** (K/C/M/Y/LC/LM) + caixa de manutenção C9345 |
| **Térmica** (Zebra/Elgin) | por etiqueta | **Ribbon 76m** ÷ etiquetas/metro **+** rolo de etiqueta (dos Materiais) |
| **3D** (Ender/Bambu) | **por grama** | Filamento ÷ 1000g — **sem formato de papel**, usa volume de construção |
| **Sublimação** (Epson F170) | por folha | 4 tintas (K/C/M/Y) com 100% de cobertura |

### Formatos e cobertura de tinta

- **A4, A3, A3+** em todas as impressoras 2D (fator de área relativo ao A4).
- **Jato de Tinta** adiciona fotográficos: **10x15, 13x18, 15x20, 20x30, 30x40, A3+**
  — todos com **100% de cobertura**.
- **3D** usa faixas de peso (peça pequena/média/grande em gramas).

### Tabelas de preços independentes

Não se misturam com as impressoras. Compõem **produto** ou **serviço**:

- **DTF UV** — A4, A3 e metro linear (28cm) com desconto por volume
- **DTF Têxtil** — metro linear (55cm)
- **Lona** — R$/m² (440g, backlight, perfurada)
- **Adesivo Vinil** — R$/m² (branco, perfurado, transparente, jateado)

---

## 📦 Módulos

**Comercial** — PDV com cupom 80 colunas · Orçamentos com OS/PDF · Kanban de produção · CRM (PF e PJ completos) · Financeiro

**Catálogo & Produção** — Produtos (calculadora ao vivo) · Materiais/Estoque · Impressoras & Tintas · Tabelas de preços · Acabamentos · Serviços

**Gestão** — Dashboard · Relatórios (margem, ticket médio, conversão, estoque) · Painel de Controle

---

## 🔌 APIs para sistemas externos

O ERP **não** carrega WhatsApp/VoIP internamente — apenas expõe contratos:

| Rota | Uso | Variáveis |
|---|---|---|
| `POST /api/integrations/whatsapp` | Enfileira mensagem no bot externo | `WHATSAPP_API_KEY`, `WHATSAPP_API_URL` |
| `POST /api/integrations/voip` | Click-to-call | `VOIP_TOKEN`, `VOIP_API_URL` |
| `GET/POST /api/portal` | Catálogo e pedidos do portal do cliente | `PORTAL_TOKEN` |
| `GET /api/health` | Healthcheck | — |

---

## 🛠️ Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
PostgreSQL + Drizzle ORM

## 📄 Scripts

```bash
npm run dev      # desenvolvimento
npm run build    # build de produção
npm run start    # servidor de produção
npm run seed     # popula dados de demonstração
npm run db:push  # aplica o schema no banco
```

Veja o [CHANGELOG.md](CHANGELOG.md) para o histórico de versões.
