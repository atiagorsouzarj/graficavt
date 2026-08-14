import { Webhook } from "svix";
import { db } from "@/db";
import { communicationEvents, communicationOutbox, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const statusFor = (type: string) => {
  if (type === "email.delivered") return "delivered";
  if (type === "email.opened") return "read";
  if (["email.bounced", "email.complained", "email.failed", "email.suppressed"].includes(type)) return "failed";
  return "sent";
};

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "RESEND_WEBHOOK_SECRET não configurado" }, { status: 503 });
  const payload = await req.text();
  const id = req.headers.get("svix-id");
  const timestamp = req.headers.get("svix-timestamp");
  const signature = req.headers.get("svix-signature");
  if (!id || !timestamp || !signature) return Response.json({ error: "Assinatura ausente" }, { status: 401 });

  let event: Record<string, unknown>;
  try {
    event = new Webhook(secret).verify(payload, {
      "svix-id": id,
      "svix-timestamp": timestamp,
      "svix-signature": signature,
    }) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  const type = String(event.type || "email.unknown");
  const data = (event.data || {}) as Record<string, unknown>;
  const providerId = String(data.email_id || data.id || "");
  if (!providerId) return Response.json({ ok: true, ignored: "email_id ausente" });
  const [outbox] = await db
    .select()
    .from(communicationOutbox)
    .where(eq(communicationOutbox.providerMessageId, providerId));
  if (!outbox) return Response.json({ ok: true, ignored: "outbox não encontrado" });

  const status = statusFor(type);
  const update: Record<string, unknown> = { status, updatedAt: new Date() };
  if (type === "email.delivered") update.deliveredAt = new Date();
  if (status === "failed") update.lastError = type;
  await db.update(communicationOutbox).set(update as never).where(eq(communicationOutbox.id, outbox.id));
  await db.insert(communicationEvents).values({ outboxId: outbox.id, channel: "email", type, payload: event });
  if (status === "failed") {
    await db.insert(notifications).values({
      type: "warning",
      title: "Falha em e-mail transacional",
      body: `${type} para ${outbox.recipient}.`,
      href: "/comunicacoes",
    });
  }
  return Response.json({ ok: true });
}
