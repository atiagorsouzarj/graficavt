CREATE TYPE "public"."communication_channel" AS ENUM('whatsapp', 'email');--> statement-breakpoint
CREATE TYPE "public"."communication_kind" AS ENUM('transactional', 'marketing', 'internal');--> statement-breakpoint
CREATE TYPE "public"."communication_status" AS ENUM('draft', 'queued', 'processing', 'sent', 'delivered', 'read', 'received', 'failed', 'cancelled', 'suppressed');--> statement-breakpoint
CREATE TABLE "communication_channels" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel" "communication_channel" NOT NULL,
	"name" text NOT NULL,
	"provider" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"from_name" text,
	"from_address" text,
	"from_phone" text,
	"runtime" jsonb,
	"config" jsonb,
	"last_health_at" timestamp,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communication_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"outbox_id" integer,
	"channel" "communication_channel" NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communication_inbox" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel" "communication_channel" NOT NULL,
	"customer_id" integer,
	"sender" text NOT NULL,
	"recipient" text,
	"provider_message_id" text,
	"body" text,
	"payload" jsonb,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communication_outbox" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel" "communication_channel" NOT NULL,
	"kind" "communication_kind" DEFAULT 'transactional' NOT NULL,
	"customer_id" integer,
	"template_id" integer,
	"template_version" integer,
	"event_type" text,
	"recipient" text NOT NULL,
	"subject" text,
	"rendered_body" text NOT NULL,
	"interactive" jsonb,
	"payload" jsonb,
	"idempotency_key" text NOT NULL,
	"status" "communication_status" DEFAULT 'queued' NOT NULL,
	"scheduled_at" timestamp DEFAULT now() NOT NULL,
	"processing_at" timestamp,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"provider_message_id" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "communication_outbox_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "communication_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"channel" "communication_channel" NOT NULL,
	"template_id" integer,
	"enabled" boolean DEFAULT true NOT NULL,
	"delay_seconds" integer DEFAULT 0 NOT NULL,
	"require_consent" boolean DEFAULT true NOT NULL,
	"require_human_approval" boolean DEFAULT false NOT NULL,
	"conditions" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_consents" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer,
	"channel" "communication_channel" NOT NULL,
	"kind" "communication_kind" DEFAULT 'transactional' NOT NULL,
	"status" text DEFAULT 'granted' NOT NULL,
	"source" text DEFAULT 'manual',
	"granted_at" timestamp DEFAULT now(),
	"revoked_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_counters" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_type" text NOT NULL,
	"year" integer NOT NULL,
	"current" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel" "communication_channel" NOT NULL,
	"kind" "communication_kind" DEFAULT 'transactional' NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"interactive" jsonb,
	"preview_data" jsonb,
	"variables" jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "message_templates_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text DEFAULT 'info' NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"href" text,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "communication_events" ADD CONSTRAINT "communication_events_outbox_id_communication_outbox_id_fk" FOREIGN KEY ("outbox_id") REFERENCES "public"."communication_outbox"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_inbox" ADD CONSTRAINT "communication_inbox_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_outbox" ADD CONSTRAINT "communication_outbox_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_outbox" ADD CONSTRAINT "communication_outbox_template_id_message_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."message_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_rules" ADD CONSTRAINT "communication_rules_template_id_message_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."message_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_consents" ADD CONSTRAINT "customer_consents_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "document_counters_type_year_idx" ON "document_counters" USING btree ("document_type","year");