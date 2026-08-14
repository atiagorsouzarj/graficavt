CREATE TABLE "art_approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text,
	"version" integer DEFAULT 1,
	"status" text DEFAULT 'pendente' NOT NULL,
	"client_comment" text,
	"internal_note" text,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer,
	"lead_id" integer,
	"type" text DEFAULT 'nota' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer,
	"title" text NOT NULL,
	"column" text DEFAULT 'novo' NOT NULL,
	"source" text DEFAULT 'manual',
	"owner" text,
	"expected_value" numeric(12, 2) DEFAULT '0',
	"probability" integer DEFAULT 10,
	"next_action_at" timestamp,
	"last_contact_at" timestamp,
	"notes" text,
	"lost_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer,
	"customer_id" integer,
	"method" text DEFAULT 'retirada' NOT NULL,
	"status" text DEFAULT 'aguardando' NOT NULL,
	"scheduled_at" timestamp,
	"delivered_at" timestamp,
	"tracking_code" text,
	"recipient_name" text,
	"delivery_fee" numeric(12, 2) DEFAULT '0',
	"address_snapshot" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"quote_id" integer,
	"customer_id" integer,
	"status" text DEFAULT 'aberto' NOT NULL,
	"production_status" text DEFAULT 'aguardando' NOT NULL,
	"art_status" text DEFAULT 'nao_enviada' NOT NULL,
	"delivery_status" text DEFAULT 'a_definir' NOT NULL,
	"priority" text DEFAULT 'normal',
	"due_date" date,
	"items" jsonb NOT NULL,
	"subtotal" numeric(12, 4) DEFAULT '0',
	"discount" numeric(12, 4) DEFAULT '0',
	"taxes" numeric(12, 4) DEFAULT '0',
	"total" numeric(12, 4) DEFAULT '0',
	"payment_method" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "production_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer,
	"printer_id" integer,
	"title" text NOT NULL,
	"scheduled_date" date NOT NULL,
	"start_time" text DEFAULT '08:00',
	"estimated_minutes" integer DEFAULT 30,
	"status" text DEFAULT 'planejado' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"supplier_id" integer,
	"status" text DEFAULT 'rascunho' NOT NULL,
	"items" jsonb NOT NULL,
	"subtotal" numeric(12, 4) DEFAULT '0',
	"freight" numeric(12, 4) DEFAULT '0',
	"discount" numeric(12, 4) DEFAULT '0',
	"total" numeric(12, 4) DEFAULT '0',
	"expected_date" date,
	"received_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "purchases_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"trade_name" text,
	"document" text,
	"contact_name" text,
	"email" text,
	"phone" text,
	"whatsapp" text,
	"website" text,
	"cep" text,
	"street" text,
	"number" text,
	"complement" text,
	"district" text,
	"city" text,
	"state" text,
	"payment_terms" text,
	"lead_time_days" integer DEFAULT 0,
	"notes" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "print_formats" ADD COLUMN "print_cost_override" numeric(12, 4) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "printer_categories" ADD COLUMN "reference_coverage" numeric(6, 4) DEFAULT '0.05';--> statement-breakpoint
ALTER TABLE "printer_consumables" ADD COLUMN "cost_role" text DEFAULT 'colorant';--> statement-breakpoint
ALTER TABLE "product_finishings" ADD COLUMN "charge_mode" text DEFAULT 'per_piece';--> statement-breakpoint
ALTER TABLE "product_finishings" ADD COLUMN "batch_size" numeric(10, 3) DEFAULT '1';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "print_format_id" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "calculation_mode" text DEFAULT 'unit' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "default_quantity" numeric(12, 3) DEFAULT '1';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "pieces_per_sheet" numeric(12, 3) DEFAULT '1';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "print_sides" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "waste_percent" numeric(6, 4) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "setup_sheets" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "min_order_qty" numeric(12, 3) DEFAULT '1';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "operational_rate" numeric(6, 4) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "rounding_step" numeric(10, 2) DEFAULT '0.01';--> statement-breakpoint
ALTER TABLE "art_approvals" ADD CONSTRAINT "art_approvals_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_lead_id_crm_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."crm_leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_schedules" ADD CONSTRAINT "production_schedules_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_schedules" ADD CONSTRAINT "production_schedules_printer_id_printers_id_fk" FOREIGN KEY ("printer_id") REFERENCES "public"."printers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_print_format_id_print_formats_id_fk" FOREIGN KEY ("print_format_id") REFERENCES "public"."print_formats"("id") ON DELETE set null ON UPDATE no action;