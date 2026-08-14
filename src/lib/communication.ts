import "server-only";

import { db } from "@/db";
import {
  communicationChannels,
  communicationEvents,
  communicationOutbox,
  communicationRules,
  customerConsents,
  customers,
  messageTemplates,
  notifications,
  settings,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { renderTemplate, type TemplateContext } from "@/lib/communication-template";
import { getPricingDefaults } from "@/lib/settings";

export type CommunicationEventInput = {
  eventType: string;
  eventId: string | number;
  customerId: number | null | undefined;
  context?: TemplateContext;
};

const firstName = (name?: string | null) => String(name || "Cliente").trim().split(/\s+/)[0] || "Cliente";

function withinBusinessHours(date: Date, start: string, end: string, timezone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
    const minute = get("hour") * 60 + get("minute");
    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);
    return minute >= startHour * 60 + startMinute && minute <= endHour * 60 + endMinute;
  } catch { return true; }
}

function nextBusinessSchedule(base: Date, start: string, end: string, timezone: string) {
  if (withinBusinessHours(base, start, end, timezone)) return base;
  // Sem biblioteca de timezone: envia no próximo início observado pelo worker.
  // O worker também mantém canais pausados quando desabilitados.
  const next = new Date(base);
  next.setHours(Number(start.split(":")[0] || 8), Number(start.split(":")[1] || 0), 0, 0);
  if (next <= base) next.setDate(next.getDate() + 1);
  return next;
}

function normalizedWhatsApp(value?: string | null): string | null {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits.startsWith("55") ? digits : `55${digits}`;
}

/**
 * Enfileira mensagens transacionais conforme regras ativas.
 * A chave idempotente impede duplicidade caso a mesma rota seja chamada mais
 * de uma vez ou o worker seja reiniciado.
 */
export async function enqueueCommunicationEvent(input: CommunicationEventInput) {
  if (!input.customerId) return { queued: 0, skipped: "customer_missing" };
  const policyRows = await db
    .select()
    .from(settings)
    .where(eq(settings.category, "comunicacao"));
  const policy = new Map(policyRows.map((row) => [row.key, row.value || ""]));
  const engineEnabled = policy.get("communication_engine_enabled") === "true";
  if (!engineEnabled) return { queued: 0, skipped: "engine_disabled" };
  const globalConsent = policy.get("communication_require_consent") !== "false";
  const marketingEnabled = policy.get("communication_marketing_enabled") === "true";
  const businessStart = policy.get("communication_business_hours_start") || "08:00";
  const businessEnd = policy.get("communication_business_hours_end") || "18:00";
  const timezone = policy.get("communication_timezone") || "America/Sao_Paulo";
  const [customer, company, rules] = await Promise.all([
    db.select().from(customers).where(eq(customers.id, input.customerId)),
    getPricingDefaults(),
    db
      .select()
      .from(communicationRules)
      .where(and(eq(communicationRules.eventType, input.eventType), eq(communicationRules.enabled, true))),
  ]);
  const target = customer[0];
  if (!target || rules.length === 0) return { queued: 0, skipped: target ? "no_rules" : "customer_missing" };

  const baseContext: TemplateContext = {
    cliente: {
      nome: target.tradeName || target.name,
      primeiro_nome: firstName(target.tradeName || target.name),
      documento: target.document || "",
      whatsapp: target.whatsapp || target.phone || "",
      email: target.email || "",
    },
    empresa: {
      nome: company.company_name,
      email: company.company_email,
      whatsapp: company.company_whatsapp || company.company_phone,
      site: "",
    },
    ...(input.context || {}),
  };

  let queued = 0;
  for (const rule of rules) {
    const [channel, template] = await Promise.all([
      db
        .select()
        .from(communicationChannels)
        .where(and(eq(communicationChannels.channel, rule.channel), eq(communicationChannels.enabled, true))),
      rule.templateId
        ? db.select().from(messageTemplates).where(eq(messageTemplates.id, rule.templateId))
        : Promise.resolve([]),
    ]);
    const activeChannel = channel[0];
    const activeTemplate = template[0];
    if (!activeChannel || !activeTemplate || !activeTemplate.active) continue;
    if (activeTemplate.kind === "marketing" && !marketingEnabled) continue;

    const consentRequired = globalConsent || rule.requireConsent;
    if (consentRequired) {
      const consent = await db
        .select()
        .from(customerConsents)
        .where(
          and(
            eq(customerConsents.customerId, target.id),
            eq(customerConsents.channel, rule.channel),
            eq(customerConsents.kind, activeTemplate.kind),
            eq(customerConsents.status, "granted")
          )
        );
      if (!consent.length) continue;
    }

    const recipient = rule.channel === "email" ? target.email : normalizedWhatsApp(target.whatsapp || target.phone);
    if (!recipient) continue;
    const renderedBody = renderTemplate(activeTemplate.body, baseContext, { html: rule.channel === "email" });
    const subject = activeTemplate.subject ? renderTemplate(activeTemplate.subject, baseContext) : null;
    const idempotencyKey = `${input.eventType}:${rule.id}:${target.id}:${input.eventId}:${activeTemplate.version}:${rule.channel}`;
    const scheduledAt = nextBusinessSchedule(
      new Date(Date.now() + Number(rule.delaySeconds || 0) * 1000),
      businessStart,
      businessEnd,
      timezone
    );
    try {
      const [outbox] = await db
        .insert(communicationOutbox)
        .values({
          channel: rule.channel,
          kind: activeTemplate.kind,
          customerId: target.id,
          templateId: activeTemplate.id,
          templateVersion: activeTemplate.version,
          eventType: input.eventType,
          recipient,
          subject,
          renderedBody,
          payload: baseContext,
          idempotencyKey,
          status: rule.requireHumanApproval ? "draft" : "queued",
          scheduledAt,
        })
        .returning();
      await db.insert(communicationEvents).values({
        outboxId: outbox.id,
        channel: rule.channel,
        type: rule.requireHumanApproval ? "draft" : "queued",
        payload: { eventType: input.eventType, ruleId: rule.id },
      });
      if (!rule.requireHumanApproval) {
        await db.insert(notifications).values({
          type: "info",
          title: "Comunicação enfileirada",
          body: `${activeTemplate.name} para ${target.tradeName || target.name} via ${rule.channel}.`,
          href: "/comunicacoes",
        });
      }
      queued += 1;
    } catch {
      // Chave idempotente duplicada: evento já foi enfileirado; não é erro.
    }
  }
  return { queued };
}

export async function enqueueManualMessage({
  channel,
  customerId,
  templateId,
  recipient,
  context,
  requireApproval = false,
}: {
  channel: "whatsapp" | "email";
  customerId?: number | null;
  templateId: number;
  recipient: string;
  context: TemplateContext;
  requireApproval?: boolean;
}) {
  const [template] = await db.select().from(messageTemplates).where(eq(messageTemplates.id, templateId));
  if (!template) throw new Error("Template não encontrado");
  const body = renderTemplate(template.body, context, { html: channel === "email" });
  const subject = template.subject ? renderTemplate(template.subject, context) : null;
  const idempotencyKey = `manual:${channel}:${template.id}:${recipient}:${Date.now()}`;
  const [outbox] = await db.insert(communicationOutbox).values({
    channel,
    kind: template.kind,
    customerId: customerId || null,
    templateId: template.id,
    templateVersion: template.version,
    eventType: "manual.send",
    recipient,
    subject,
    renderedBody: body,
    payload: context,
    idempotencyKey,
    status: requireApproval ? "draft" : "queued",
  }).returning();
  await db.insert(communicationEvents).values({
    outboxId: outbox.id,
    channel,
    type: requireApproval ? "draft" : "queued",
    payload: { manual: true },
  });
  return outbox;
}
