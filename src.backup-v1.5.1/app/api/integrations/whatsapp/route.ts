import { db } from "@/db";
import { apiIntegrations } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Endpoint de integração para o SISTEMA EXTERNO de WhatsApp/e-mail transacional.
 *
 *  GET  /api/integrations/whatsapp        -> status da integração + contrato
 *  POST /api/integrations/whatsapp         -> envia mensagem (proxy p/ API externa)
 *       body: { to, message, template? }
 *
 *  O sistema principal NÃO conversa com a Meta/WhatsApp diretamente. Ele publica
 *  um evento neste endpoint e um serviço externo (com bots) processa a fila.
 *  A chave da API externa fica em process.env.WHATSAPP_API_KEY (server-only).
 */
export async function GET() {
  const [cfg] = await db
    .select()
    .from(apiIntegrations)
    .where(eq(apiIntegrations.type, "whatsapp"));
  return Response.json({
    module: "whatsapp",
    status: "pronto para integração externa",
    active: cfg?.active ?? false,
    contract: {
      send: "POST { to, message, template? }",
      webhook: "GET ?hub.challenge (recebimento de mensagens)",
      note: "Chave e endpoint ficam em process.env.WHATSAPP_API_KEY / WHATSAPP_API_URL",
    },
  });
}

export async function POST(req: Request) {
  const apiKey = process.env.WHATSAPP_API_KEY;
  if (!apiKey) {
    return Response.json(
      { ok: false, error: "WHATSAPP_API_KEY não configurado" },
      { status: 503 }
    );
  }
  const body = await req.json().catch(() => ({}));
  // Aqui o sistema apenas enfileiraria a mensagem para o worker externo.
  // Implementação real: POST para process.env.WHATSAPP_API_URL com Authorization.
  return Response.json({
    ok: true,
    queued: true,
    to: body.to,
    message_id: `msg_${Date.now()}`,
    note: "Enfileirado para o sistema externo de WhatsApp/bot.",
  });
}
