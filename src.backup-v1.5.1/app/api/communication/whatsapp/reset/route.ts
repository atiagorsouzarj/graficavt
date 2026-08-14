import { db } from "@/db";
import { communicationChannels, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Solicita ao gateway Baileys um novo pareamento QR de forma segura. */
export async function POST() {
  const [channel] = await db
    .select()
    .from(communicationChannels)
    .where(eq(communicationChannels.channel, "whatsapp"));
  if (!channel) return Response.json({ error: "Canal WhatsApp não cadastrado" }, { status: 404 });
  if (!channel.enabled) return Response.json({ error: "Habilite o canal WhatsApp antes de gerar QR" }, { status: 409 });
  const requestId = new Date().toISOString();
  await db
    .update(communicationChannels)
    .set({
      runtime: {
        ...(channel.runtime || {}),
        state: "QR_REQUESTED",
        qrDataUrl: null,
        resetRequestedAt: requestId,
      },
      lastError: null,
      updatedAt: new Date(),
    })
    .where(eq(communicationChannels.id, channel.id));
  await db.insert(notifications).values({
    type: "info",
    title: "Novo QR solicitado",
    body: "O gateway WhatsApp vai recriar a sessão e publicar um novo QR Code na Central de Comunicação.",
    href: "/comunicacoes",
  });
  return Response.json({ ok: true, requestId });
}
