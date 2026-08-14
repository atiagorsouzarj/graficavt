import { db } from "@/db";
import {
  communicationChannels,
  communicationEvents,
  communicationOutbox,
  crmActivities,
  notifications,
  settings,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Resposta manual do Inbox WhatsApp.
 * Sempre passa pela Outbox: em demo marca entregue; em produção vira queued.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const customerId = body.customerId ? Number(body.customerId) : null;
  const recipient = String(body.recipient || "").replace(/\D/g, "");
  const text = String(body.text || "").trim();
  const demo = body.mode === "demo";
  if (!recipient || recipient.length < 10 || !text) {
    return Response.json({ error: "Destinatário e mensagem são obrigatórios." }, { status: 400 });
  }
  const [policy] = await db.select().from(settings).where(eq(settings.key, demo ? "communication_demo_mode" : "communication_engine_enabled"));
  if (policy?.value !== "true") {
    return Response.json({ error: demo ? "Modo de demonstração está desligado." : "Motor transacional está desligado." }, { status: 409 });
  }
  if (!demo) {
    const [channel] = await db
      .select()
      .from(communicationChannels)
      .where(and(eq(communicationChannels.channel, "whatsapp"), eq(communicationChannels.enabled, true)));
    if (!channel) return Response.json({ error: "Canal WhatsApp está desabilitado." }, { status: 409 });
  }
  const idempotencyKey = `inbox-reply:${recipient}:${Date.now()}`;
  const [outbox] = await db
    .insert(communicationOutbox)
    .values({
      channel: "whatsapp",
      kind: "transactional",
      customerId,
      eventType: "inbox.reply",
      recipient,
      renderedBody: text,
      payload: { reply: true, demo },
      idempotencyKey,
      status: demo ? "delivered" : "queued",
      sentAt: demo ? new Date() : null,
      deliveredAt: demo ? new Date() : null,
      providerMessageId: demo ? `demo_reply_${Date.now()}` : null,
    })
    .returning();
  await db.insert(communicationEvents).values({
    outboxId: outbox.id,
    channel: "whatsapp",
    type: demo ? "delivered" : "queued",
    payload: { reply: true, demo },
  });
  if (customerId) {
    await db.insert(crmActivities).values({
      customerId,
      type: "whatsapp",
      title: demo ? "Resposta WhatsApp simulada" : "Resposta WhatsApp enfileirada",
      description: text,
    });
  }
  await db.insert(notifications).values({
    type: demo ? "success" : "info",
    title: demo ? "Resposta simulada" : "Resposta enfileirada",
    body: text.slice(0, 180),
    href: "/comunicacoes",
  });
  return Response.json({ ok: true, outbox });
}
