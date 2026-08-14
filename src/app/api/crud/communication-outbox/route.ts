import { db } from "@/db";
import { communicationEvents, communicationOutbox } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  if (!id) return Response.json({ error: "id obrigatório" }, { status: 400 });
  if (body.op === "approve") {
    const [row] = await db.update(communicationOutbox).set({ status: "queued", scheduledAt: new Date(), updatedAt: new Date() }).where(eq(communicationOutbox.id, id)).returning();
    await db.insert(communicationEvents).values({ outboxId: id, channel: row.channel, type: "queued", payload: { approvedManually: true } });
    return Response.json({ ok: true, row });
  }
  if (body.op === "cancel") {
    const [row] = await db.update(communicationOutbox).set({ status: "cancelled", updatedAt: new Date() }).where(eq(communicationOutbox.id, id)).returning();
    await db.insert(communicationEvents).values({ outboxId: id, channel: row.channel, type: "cancelled", payload: { cancelledManually: true } });
    return Response.json({ ok: true, row });
  }
  if (body.op === "retry") {
    const [row] = await db.update(communicationOutbox).set({ status: "queued", scheduledAt: new Date(), lastError: null, updatedAt: new Date() }).where(eq(communicationOutbox.id, id)).returning();
    await db.insert(communicationEvents).values({ outboxId: id, channel: row.channel, type: "queued", payload: { retriedManually: true } });
    return Response.json({ ok: true, row });
  }
  return Response.json({ error: "op inválido" }, { status: 400 });
}
