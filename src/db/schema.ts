import {
  pgTable,
  serial,
  text,
  timestamp,
  numeric,
  integer,
  boolean,
  jsonb,
  pgEnum,
  date,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/*  CONTROL PANEL / SETTINGS                                          */
/* ------------------------------------------------------------------ */
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  category: text("category").default("geral"),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

/* ------------------------------------------------------------------ */
/*  CATEGORIAS GENÉRICAS (reutilizáveis por módulo)                    */
/*  Produtos, Materiais, Serviços, Acabamentos, Tabelas de Preços      */
/*  Todas editáveis pelo usuário — adicionar/editar/remover livremente*/
/* ------------------------------------------------------------------ */
export const categoryModuleEnum = pgEnum("category_module", [
  "product",
  "material",
  "service",
  "finishing",
  "pricing_table",
]);

export const itemCategories = pgTable("item_categories", {
  id: serial("id").primaryKey(),
  module: categoryModuleEnum("module").notNull(),
  name: text("name").notNull(),
  icon: text("icon").default("📁"),
  color: text("color").default("#06b6d4"),
  order: integer("order").default(0),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

/* ------------------------------------------------------------------ */
/*  CRM - CUSTOMERS (PF / PJ)                                         */
/* ------------------------------------------------------------------ */
export const customerTypeEnum = pgEnum("customer_type", ["pf", "pj"]);
export const customerStatusEnum = pgEnum("customer_status", [
  "lead",
  "ativo",
  "inativo",
  "bloqueado",
]);

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  type: customerTypeEnum("type").default("pf").notNull(),
  // common
  name: text("name").notNull(), // nome (PF) ou razão social (PJ)
  tradeName: text("trade_name"), // nome fantasia
  document: text("document"), // CPF ou CNPJ
  // contato
  email: text("email"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  secondaryPhone: text("secondary_phone"),
  website: text("website"),
  contactName: text("contact_name"),
  contactRole: text("contact_role"),
  // endereco
  cep: text("cep"),
  street: text("street"),
  number: text("number"),
  complement: text("complement"),
  district: text("district"),
  city: text("city"),
  state: text("state"),
  // PF
  rg: text("rg"),
  birthDate: date("birth_date", { mode: "string" }),
  gender: text("gender"),
  // PJ
  stateRegistration: text("state_registration"), // inscricao estadual
  municipalRegistration: text("municipal_registration"), // inscricao municipal
  legalNature: text("legal_nature"), // natureza juridica
  taxRegime: text("tax_regime"), // regime tributario
  // comercial
  status: customerStatusEnum("status").default("lead").notNull(),
  creditLimit: numeric("credit_limit", { precision: 12, scale: 2 }).default("0"),
  tags: text("tags"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

/* ------------------------------------------------------------------ */
/*  PRICING ENGINE - PRINTER CATEGORIES                               */
/*  The category holds the pricing logic (cost per page)              */
/* ------------------------------------------------------------------ */
export const printerCategories = pgTable("printer_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Laser, Jato de Tinta, Térmica, 3D, Sublimação, DTF
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon").default("🖨️"),
  // custo fixo por pagina (energia + manutencao + depreciacao)
  fixedCostPerPage: numeric("fixed_cost_per_page", { precision: 12, scale: 6 }).default("0"),
  wasteFactor: numeric("waste_factor", { precision: 6, scale: 4 }).default("0"), // % de perda
  defaultMargin: numeric("default_margin", { precision: 6, scale: 4 }).default("0.4"),
  color: text("color").default("#06b6d4"),
  /** define como o custo é medido: pagina | etiqueta | grama */
  measureMode: text("measure_mode").default("pagina"),
  /** unidade exibida na UI: folha, etiqueta, grama */
  unitLabel: text("unit_label").default("folha"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

/* consumibles belong to a category and define the per-page cost      */
export const consumableTypeEnum = pgEnum("consumable_type", ["mono", "color", "both"]);

export const printerConsumables = pgTable("printer_consumables", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => printerCategories.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // Toner Preto, Cilindro, Resina, Filamento...
  unitCost: numeric("unit_cost", { precision: 12, scale: 4 }).default("0"),
  yieldPages: integer("yield_pages").default(0), // rendimento em impressoes
  appliesTo: consumableTypeEnum("applies_to").default("both"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const printerStatusEnum = pgEnum("printer_status", [
  "ativa",
  "manutencao",
  "inativa",
]);

/** Modo de medição da categoria — define COMO o custo é calculado */
export const measureModeEnum = pgEnum("measure_mode", [
  "pagina",   // Laser / Jato de Tinta / Sublimação — custo por folha (A4/A3/A3+)
  "etiqueta", // Térmica — ribbon (m) + rolo de etiqueta
  "grama",    // 3D — custo por grama de filamento (sem formato de papel)
]);

export const printers = pgTable("printers", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => printerCategories.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // Konica C284-e, L18050...
  brand: text("brand"),
  model: text("model"),
  status: printerStatusEnum("status").default("ativa").notNull(),
  costMultiplier: numeric("cost_multiplier", { precision: 6, scale: 4 }).default("1"), // override
  maxFormat: text("max_format").default("A4"),
  /** 3D: volume de construção (ex: 220x220x250mm) — não usa formato de papel */
  buildVolume: text("build_volume"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

/* ------------------------------------------------------------------ */
/*  FORMATOS DE IMPRESSÃO (A4, A3, A3+, fotos) por categoria          */
/*  Cada formato tem um fator de área e cobertura de tinta            */
/* ------------------------------------------------------------------ */
export const printFormats = pgTable("print_formats", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => printerCategories.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),          // A4, A3, A3+, 10x15, 15x20...
  widthMm: numeric("width_mm", { precision: 8, scale: 2 }).default("210"),
  heightMm: numeric("height_mm", { precision: 8, scale: 2 }).default("297"),
  /** fator de área relativo ao A4 (A4=1, A3=2, A3+=2.37) */
  areaFactor: numeric("area_factor", { precision: 8, scale: 4 }).default("1"),
  /** cobertura de tinta (1 = 100%, 0.05 = texto 5%) */
  inkCoverage: numeric("ink_coverage", { precision: 6, scale: 4 }).default("0.05"),
  isPhoto: boolean("is_photo").default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

/* ------------------------------------------------------------------ */
/*  MATERIALS & SUPPLIES (Materiais e Insumos)                        */
/* ------------------------------------------------------------------ */
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Papel A4 75g, Papel Cartolina, Vinil, TNT...
  categoryId: integer("category_id").references(() => itemCategories.id, {
    onDelete: "set null",
  }),
  unit: text("unit").default("unidade"), // folha, metro, kg, unidade
  unitCost: numeric("unit_cost", { precision: 12, scale: 4 }).default("0"),
  supplier: text("supplier"),
  stock: numeric("stock", { precision: 12, scale: 3 }).default("0"),
  minStock: numeric("min_stock", { precision: 12, scale: 3 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

/* ------------------------------------------------------------------ */
/*  MOVIMENTAÇÃO DE ESTOQUE (entrada / saída / ajuste)                */
/*  Automatiza o controle: toda venda/uso baixa estoque; compras somam*/
/* ------------------------------------------------------------------ */
export const stockMovementKindEnum = pgEnum("stock_movement_kind", [
  "entrada",
  "saida",
  "ajuste",
]);
export const stockTargetEnum = pgEnum("stock_target", ["material", "product"]);

export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  kind: stockMovementKindEnum("kind").notNull(),
  targetType: stockTargetEnum("target_type").notNull(),
  materialId: integer("material_id").references(() => materials.id, {
    onDelete: "cascade",
  }),
  productId: integer("product_id"), // FK adicionada depois de `products` ser declarada
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  unitCost: numeric("unit_cost", { precision: 12, scale: 4 }).default("0"),
  reason: text("reason").default("ajuste"), // compra, venda, perda, producao, ajuste, devolucao
  reference: text("reference"), // número da venda/pedido/nota
  notes: text("notes"),
  automatic: boolean("automatic").default(false), // gerado pelo sistema (venda/produção)
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

/* ------------------------------------------------------------------ */
/*  PRICING TABLES (DTF UV, DTF Textil, Lona, Adesivo)                */
/*  Tabelas de preço independentes — podem compor produto ou serviço   */
/* ------------------------------------------------------------------ */
export const pricingTableEnum = pgEnum("pricing_table_type", [
  "dtf_uv",       // DTF UV (terceirizado) — preço por A4/A3/metro
  "dtf_textil",   // DTF Têxtil (terceirizado) — metro linear
  "lona",         // Comunicação Visual — Lona — R$/m²
  "adesivo",      // Comunicação Visual — Adesivo Vinil — R$/m²
]);

export const pricingTables = pgTable("pricing_tables", {
  id: serial("id").primaryKey(),
  type: pricingTableEnum("type").notNull(),
  categoryId: integer("category_id").references(() => itemCategories.id, {
    onDelete: "set null",
  }),
  label: text("label").notNull(),          // "A4 (22x28cm)", "A3 (28x42cm)", "1 Metro Linear", "m² Lona 440g"
  unitCost: numeric("unit_cost", { precision: 12, scale: 4 }).default("0"),  // R$ por unidade
  unit: text("unit").default("unidade"),    // unidade, metro, m2, folha
  widthCm: numeric("width_cm", { precision: 8, scale: 2 }),   // largura útil em cm (28cm para metro linear)
  heightCm: numeric("height_cm", { precision: 8, scale: 2 }), // altura útil em cm
  minQty: numeric("min_qty", { precision: 10, scale: 3 }).default("1"),
  notes: text("notes"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

/* ------------------------------------------------------------------ */
/*  FINISHING (Acabamentos)                                           */
/* ------------------------------------------------------------------ */
export const finishingItems = pgTable("finishing_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Laminadora, Guilhotina, Plastificação, Encadernação...
  categoryId: integer("category_id").references(() => itemCategories.id, {
    onDelete: "set null",
  }),
  unit: text("unit").default("unidade"),
  unitCost: numeric("unit_cost", { precision: 12, scale: 4 }).default("0"),
  description: text("description"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

/* ------------------------------------------------------------------ */
/*  SERVICES (Serviços de Gráfica Rápida)                             */
/* ------------------------------------------------------------------ */
export const serviceTypeEnum = pgEnum("service_type", ["proprio", "terceirizado"]);

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Criação de Logo, Design, Impressão 3D, Sublimação...
  categoryId: integer("category_id").references(() => itemCategories.id, {
    onDelete: "set null",
  }),
  type: serviceTypeEnum("type").default("proprio").notNull(),
  baseCost: numeric("base_cost", { precision: 12, scale: 4 }).default("0"),
  estimatedHours: numeric("estimated_hours", { precision: 8, scale: 2 }).default("0"),
  becomesProduct: boolean("becomes_product").default(false),
  partner: text("partner"), // empresa terceirizada
  description: text("description"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

/* ------------------------------------------------------------------ */
/*  PRODUCTS (with live cost calculator)                              */
/* ------------------------------------------------------------------ */
export const colorModeEnum = pgEnum("color_mode", ["mono", "color"]);

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku"),
  description: text("description"),
  /** categoria comercial do produto: Gráfica, Papelaria Personalizada, Brindes, DTF, Produtos 3D */
  productCategoryId: integer("product_category_id").references(
    () => itemCategories.id,
    { onDelete: "set null" }
  ),
  // motor de impressao
  printerId: integer("printer_id").references(() => printers.id, { onDelete: "set null" }),
  /** categoria da impressora (Laser, Jato de Tinta...) usada no cálculo */
  printerCategoryId: integer("printer_category_id").references(
    () => printerCategories.id,
    { onDelete: "set null" }
  ),
  colorMode: colorModeEnum("color_mode").default("mono"),
  pagesPerUnit: numeric("pages_per_unit", { precision: 10, scale: 3 }).default("1"),
  copies: numeric("copies", { precision: 10, scale: 3 }).default("1"),
  // material base
  baseMaterialId: integer("base_material_id").references(() => materials.id, {
    onDelete: "set null",
  }),
  baseMaterialQty: numeric("base_material_qty", { precision: 10, scale: 3 }).default("1"),
  // servico base
  baseServiceId: integer("base_service_id").references(() => services.id, {
    onDelete: "set null",
  }),
  // precificacao
  margin: numeric("margin", { precision: 6, scale: 4 }).default("0.4"),
  costSnapshot: numeric("cost_snapshot", { precision: 12, scale: 4 }).default("0"),
  sellPrice: numeric("sell_price", { precision: 12, scale: 4 }).default("0"),
  finalPrice: numeric("final_price", { precision: 12, scale: 4 }).default("0"),
  active: boolean("active").default(true),
  // detalhe do calculo (transparencia)
  breakdown: jsonb("breakdown"),
  // estoque de produto acabado (opcional — nem todo produto é sob-demanda)
  trackStock: boolean("track_stock").default(false),
  stock: numeric("stock", { precision: 12, scale: 3 }).default("0"),
  minStock: numeric("min_stock", { precision: 12, scale: 3 }).default("0"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

/* product -> finishing (N:N) */
export const productFinishings = pgTable("product_finishings", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  finishingId: integer("finishing_id")
    .notNull()
    .references(() => finishingItems.id, { onDelete: "cascade" }),
  quantity: numeric("quantity", { precision: 10, scale: 3 }).default("1"),
});

/* product -> extra materials (N:N) */
export const productMaterials = pgTable("product_materials", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  materialId: integer("material_id")
    .notNull()
    .references(() => materials.id, { onDelete: "cascade" }),
  quantity: numeric("quantity", { precision: 10, scale: 3 }).default("1"),
});

/* ------------------------------------------------------------------ */
/*  QUOTES / ORÇAMENTOS                                               */
/* ------------------------------------------------------------------ */
export const quoteStatusEnum = pgEnum("quote_status", [
  "rascunho",
  "enviado",
  "aprovado",
  "recusado",
  "expirado",
]);

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  number: text("number").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  status: quoteStatusEnum("status").default("rascunho").notNull(),
  validUntil: date("valid_until", { mode: "string" }),
  subtotal: numeric("subtotal", { precision: 12, scale: 4 }).default("0"),
  discount: numeric("discount", { precision: 12, scale: 4 }).default("0"),
  taxes: numeric("taxes", { precision: 12, scale: 4 }).default("0"),
  total: numeric("total", { precision: 12, scale: 4 }).default("0"),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const quoteItems = pgTable("quote_items", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id")
    .notNull()
    .references(() => quotes.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  productId: integer("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  serviceId: integer("service_id").references(() => services.id, {
    onDelete: "set null",
  }),
  quantity: numeric("quantity", { precision: 10, scale: 3 }).default("1"),
  unitPrice: numeric("unit_price", { precision: 12, scale: 4 }).default("0"),
  total: numeric("total", { precision: 12, scale: 4 }).default("0"),
});

/* ------------------------------------------------------------------ */
/*  PDV - SALES (Cupom Fiscal)                                        */
/* ------------------------------------------------------------------ */
export const saleTypeEnum = pgEnum("sale_type", ["produto", "servico", "mixto"]);

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  number: text("number").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  type: saleTypeEnum("type").default("mixto").notNull(),
  items: jsonb("items").notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 4 }).default("0"),
  discount: numeric("discount", { precision: 12, scale: 4 }).default("0"),
  taxes: numeric("taxes", { precision: 12, scale: 4 }).default("0"),
  cardFee: numeric("card_fee", { precision: 12, scale: 4 }).default("0"),
  total: numeric("total", { precision: 12, scale: 4 }).default("0"),
  paymentMethod: text("payment_method"),
  status: text("status").default("concluida").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

/* ------------------------------------------------------------------ */
/*  KANBAN                                                            */
/* ------------------------------------------------------------------ */
export const kanbanCards = pgTable("kanban_cards", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  column: text("column").default("backlog").notNull(), // backlog, producao, revisao, pronto, entregue
  customerName: text("customer_name"),
  customerId: integer("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  quoteId: integer("quote_id"),
  productId: integer("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  order: integer("order").default(0),
  priority: text("priority").default("normal"), // baixa, normal, alta, urgente
  dueDate: date("due_date", { mode: "string" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

/* ------------------------------------------------------------------ */
/*  FINANCIAL                                                         */
/* ------------------------------------------------------------------ */
export const txTypeEnum = pgEnum("tx_type", ["receita", "despesa"]);
export const txStatusEnum = pgEnum("tx_status", ["pendente", "pago", "atrasado"]);

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: txTypeEnum("type").notNull(),
  category: text("category"),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).default("0"),
  dueDate: date("due_date", { mode: "string" }),
  paidDate: date("paid_date", { mode: "string" }),
  status: txStatusEnum("status").default("pendente").notNull(),
  method: text("method"),
  customerId: integer("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

/* ------------------------------------------------------------------ */
/*  API INTEGRATIONS (WhatsApp, VoIP, Portal - external systems)      */
/* ------------------------------------------------------------------ */
export const integrationTypeEnum = pgEnum("integration_type", [
  "whatsapp",
  "voip",
  "portal",
  "email",
]);

export const apiIntegrations = pgTable("api_integrations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: integrationTypeEnum("type").notNull(),
  apiKey: text("api_key"),
  endpoint: text("endpoint"),
  webhook: text("webhook"),
  active: boolean("active").default(true),
  config: jsonb("config"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type PrintFormat = typeof printFormats.$inferSelect;
export type PricingTable = typeof pricingTables.$inferSelect;
export type ItemCategory = typeof itemCategories.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;
export type PrinterCategory = typeof printerCategories.$inferSelect;
export type PrinterConsumable = typeof printerConsumables.$inferSelect;
export type Printer = typeof printers.$inferSelect;
export type Material = typeof materials.$inferSelect;
export type FinishingItem = typeof finishingItems.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type QuoteItem = typeof quoteItems.$inferSelect;
export type Sale = typeof sales.$inferSelect;
export type KanbanCard = typeof kanbanCards.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
