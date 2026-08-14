CREATE TYPE "public"."category_module" AS ENUM('product', 'material', 'service', 'finishing', 'pricing_table');--> statement-breakpoint
CREATE TYPE "public"."color_mode" AS ENUM('mono', 'color');--> statement-breakpoint
CREATE TYPE "public"."consumable_type" AS ENUM('mono', 'color', 'both');--> statement-breakpoint
CREATE TYPE "public"."customer_status" AS ENUM('lead', 'ativo', 'inativo', 'bloqueado');--> statement-breakpoint
CREATE TYPE "public"."customer_type" AS ENUM('pf', 'pj');--> statement-breakpoint
CREATE TYPE "public"."integration_type" AS ENUM('whatsapp', 'voip', 'portal', 'email');--> statement-breakpoint
CREATE TYPE "public"."measure_mode" AS ENUM('pagina', 'etiqueta', 'grama');--> statement-breakpoint
CREATE TYPE "public"."pricing_table_type" AS ENUM('dtf_uv', 'dtf_textil', 'lona', 'adesivo');--> statement-breakpoint
CREATE TYPE "public"."printer_status" AS ENUM('ativa', 'manutencao', 'inativa');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('rascunho', 'enviado', 'aprovado', 'recusado', 'expirado');--> statement-breakpoint
CREATE TYPE "public"."sale_type" AS ENUM('produto', 'servico', 'mixto');--> statement-breakpoint
CREATE TYPE "public"."service_type" AS ENUM('proprio', 'terceirizado');--> statement-breakpoint
CREATE TYPE "public"."stock_movement_kind" AS ENUM('entrada', 'saida', 'ajuste');--> statement-breakpoint
CREATE TYPE "public"."stock_target" AS ENUM('material', 'product');--> statement-breakpoint
CREATE TYPE "public"."tx_status" AS ENUM('pendente', 'pago', 'atrasado');--> statement-breakpoint
CREATE TYPE "public"."tx_type" AS ENUM('receita', 'despesa');--> statement-breakpoint
CREATE TABLE "api_integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "integration_type" NOT NULL,
	"api_key" text,
	"endpoint" text,
	"webhook" text,
	"active" boolean DEFAULT true,
	"config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "customer_type" DEFAULT 'pf' NOT NULL,
	"name" text NOT NULL,
	"trade_name" text,
	"document" text,
	"email" text,
	"phone" text,
	"whatsapp" text,
	"secondary_phone" text,
	"website" text,
	"contact_name" text,
	"contact_role" text,
	"cep" text,
	"street" text,
	"number" text,
	"complement" text,
	"district" text,
	"city" text,
	"state" text,
	"rg" text,
	"birth_date" date,
	"gender" text,
	"state_registration" text,
	"municipal_registration" text,
	"legal_nature" text,
	"tax_regime" text,
	"status" "customer_status" DEFAULT 'lead' NOT NULL,
	"credit_limit" numeric(12, 2) DEFAULT '0',
	"tags" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finishing_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category_id" integer,
	"unit" text DEFAULT 'unidade',
	"unit_cost" numeric(12, 4) DEFAULT '0',
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"module" "category_module" NOT NULL,
	"name" text NOT NULL,
	"icon" text DEFAULT '📁',
	"color" text DEFAULT '#06b6d4',
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kanban_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"column" text DEFAULT 'backlog' NOT NULL,
	"customer_name" text,
	"customer_id" integer,
	"quote_id" integer,
	"product_id" integer,
	"order" integer DEFAULT 0,
	"priority" text DEFAULT 'normal',
	"due_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category_id" integer,
	"unit" text DEFAULT 'unidade',
	"unit_cost" numeric(12, 4) DEFAULT '0',
	"supplier" text,
	"stock" numeric(12, 3) DEFAULT '0',
	"min_stock" numeric(12, 3) DEFAULT '0',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_tables" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "pricing_table_type" NOT NULL,
	"category_id" integer,
	"label" text NOT NULL,
	"unit_cost" numeric(12, 4) DEFAULT '0',
	"unit" text DEFAULT 'unidade',
	"width_cm" numeric(8, 2),
	"height_cm" numeric(8, 2),
	"min_qty" numeric(10, 3) DEFAULT '1',
	"notes" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "print_formats" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer,
	"name" text NOT NULL,
	"width_mm" numeric(8, 2) DEFAULT '210',
	"height_mm" numeric(8, 2) DEFAULT '297',
	"area_factor" numeric(8, 4) DEFAULT '1',
	"ink_coverage" numeric(6, 4) DEFAULT '0.05',
	"is_photo" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "printer_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"icon" text DEFAULT '🖨️',
	"fixed_cost_per_page" numeric(12, 6) DEFAULT '0',
	"waste_factor" numeric(6, 4) DEFAULT '0',
	"default_margin" numeric(6, 4) DEFAULT '0.4',
	"color" text DEFAULT '#06b6d4',
	"measure_mode" text DEFAULT 'pagina',
	"unit_label" text DEFAULT 'folha',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "printer_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "printer_consumables" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"name" text NOT NULL,
	"unit_cost" numeric(12, 4) DEFAULT '0',
	"yield_pages" integer DEFAULT 0,
	"applies_to" "consumable_type" DEFAULT 'both',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "printers" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"name" text NOT NULL,
	"brand" text,
	"model" text,
	"status" "printer_status" DEFAULT 'ativa' NOT NULL,
	"cost_multiplier" numeric(6, 4) DEFAULT '1',
	"max_format" text DEFAULT 'A4',
	"build_volume" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_finishings" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"finishing_id" integer NOT NULL,
	"quantity" numeric(10, 3) DEFAULT '1'
);
--> statement-breakpoint
CREATE TABLE "product_materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"material_id" integer NOT NULL,
	"quantity" numeric(10, 3) DEFAULT '1'
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sku" text,
	"description" text,
	"product_category_id" integer,
	"printer_id" integer,
	"printer_category_id" integer,
	"color_mode" "color_mode" DEFAULT 'mono',
	"pages_per_unit" numeric(10, 3) DEFAULT '1',
	"copies" numeric(10, 3) DEFAULT '1',
	"base_material_id" integer,
	"base_material_qty" numeric(10, 3) DEFAULT '1',
	"base_service_id" integer,
	"margin" numeric(6, 4) DEFAULT '0.4',
	"cost_snapshot" numeric(12, 4) DEFAULT '0',
	"sell_price" numeric(12, 4) DEFAULT '0',
	"final_price" numeric(12, 4) DEFAULT '0',
	"active" boolean DEFAULT true,
	"breakdown" jsonb,
	"track_stock" boolean DEFAULT false,
	"stock" numeric(12, 3) DEFAULT '0',
	"min_stock" numeric(12, 3) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"quote_id" integer NOT NULL,
	"description" text NOT NULL,
	"product_id" integer,
	"service_id" integer,
	"quantity" numeric(10, 3) DEFAULT '1',
	"unit_price" numeric(12, 4) DEFAULT '0',
	"total" numeric(12, 4) DEFAULT '0'
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"customer_id" integer,
	"status" "quote_status" DEFAULT 'rascunho' NOT NULL,
	"valid_until" date,
	"subtotal" numeric(12, 4) DEFAULT '0',
	"discount" numeric(12, 4) DEFAULT '0',
	"taxes" numeric(12, 4) DEFAULT '0',
	"total" numeric(12, 4) DEFAULT '0',
	"payment_method" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quotes_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"customer_id" integer,
	"type" "sale_type" DEFAULT 'mixto' NOT NULL,
	"items" jsonb NOT NULL,
	"subtotal" numeric(12, 4) DEFAULT '0',
	"discount" numeric(12, 4) DEFAULT '0',
	"taxes" numeric(12, 4) DEFAULT '0',
	"card_fee" numeric(12, 4) DEFAULT '0',
	"total" numeric(12, 4) DEFAULT '0',
	"payment_method" text,
	"status" text DEFAULT 'concluida' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sales_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category_id" integer,
	"type" "service_type" DEFAULT 'proprio' NOT NULL,
	"base_cost" numeric(12, 4) DEFAULT '0',
	"estimated_hours" numeric(8, 2) DEFAULT '0',
	"becomes_product" boolean DEFAULT false,
	"partner" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text,
	"category" text DEFAULT 'geral',
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" "stock_movement_kind" NOT NULL,
	"target_type" "stock_target" NOT NULL,
	"material_id" integer,
	"product_id" integer,
	"quantity" numeric(12, 3) NOT NULL,
	"unit_cost" numeric(12, 4) DEFAULT '0',
	"reason" text DEFAULT 'ajuste',
	"reference" text,
	"notes" text,
	"automatic" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "tx_type" NOT NULL,
	"category" text,
	"description" text NOT NULL,
	"amount" numeric(12, 2) DEFAULT '0',
	"due_date" date,
	"paid_date" date,
	"status" "tx_status" DEFAULT 'pendente' NOT NULL,
	"method" text,
	"customer_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "finishing_items" ADD CONSTRAINT "finishing_items_category_id_item_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."item_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_cards" ADD CONSTRAINT "kanban_cards_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_cards" ADD CONSTRAINT "kanban_cards_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_category_id_item_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."item_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_tables" ADD CONSTRAINT "pricing_tables_category_id_item_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."item_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "print_formats" ADD CONSTRAINT "print_formats_category_id_printer_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."printer_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printer_consumables" ADD CONSTRAINT "printer_consumables_category_id_printer_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."printer_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printers" ADD CONSTRAINT "printers_category_id_printer_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."printer_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_finishings" ADD CONSTRAINT "product_finishings_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_finishings" ADD CONSTRAINT "product_finishings_finishing_id_finishing_items_id_fk" FOREIGN KEY ("finishing_id") REFERENCES "public"."finishing_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_materials" ADD CONSTRAINT "product_materials_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_materials" ADD CONSTRAINT "product_materials_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_product_category_id_item_categories_id_fk" FOREIGN KEY ("product_category_id") REFERENCES "public"."item_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_printer_id_printers_id_fk" FOREIGN KEY ("printer_id") REFERENCES "public"."printers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_printer_category_id_printer_categories_id_fk" FOREIGN KEY ("printer_category_id") REFERENCES "public"."printer_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_base_material_id_materials_id_fk" FOREIGN KEY ("base_material_id") REFERENCES "public"."materials"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_base_service_id_services_id_fk" FOREIGN KEY ("base_service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_item_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."item_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;