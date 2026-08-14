import { db } from "@/db";
import { communicationChannels, customers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { enqueueManualMessage } from "@/lib/communication";
import { getPricingDefaults } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const channel = body.channel as "whatsapp" | "email";
  const templateId = Number(body.templateId);
  const customerId = body.customerId ? Number(body.customerId) : null;
  if (!channel || !templateId) return Response.json({ error: "Canal e template são obrigatórios" }, { status: 400 });

  const [activeChannel] = await db
    .select()
    .from(communicationChannels)
    .where(and(eq(communicationChannels.channel, channel), eq(communicationChannels.enabled, true)));
  if (!activeChannel) {
    return Response.json({ error: `Canal ${channel} está desabilitado no painel.` }, { status: 409 });
  }
  const [customer] = customerId
    ? await db.select().from(customers).where(eq(customers.id, customerId))
    : [];
  const recipient = String(body.recipient || (channel === "email" ? customer?.email : customer?.whatsapp || customer?.phone) || "");
  if (!recipient) return Response.json({ error: "Destinatário não informado" }, { status: 400 });
  const company = await getPricingDefaults();
  const context = {
    cliente: {
      nome: customer?.tradeName || customer?.name || body.customerName || "Cliente",
      primeiro_nome: String(customer?.tradeName || customer?.name || body.customerName || "Cliente").split(/\s+/)[0],
      documento: customer?.document || "",
      whatsapp: customer?.whatsapp || customer?.phone || "",
      email: customer?.email || "",
    },
    empresa: {
      nome: company.company_name,
      email: company.company_email,
      whatsapp: company.company_whatsapp || company.company_phone,
      site: body.companySite || "",
    },
    orcamento: body.context?.orcamento || {},
    pedido: body.context?.pedido || {},
    arte: body.context?.arte || {},
    entrega: body.context?.entrega || {},
  };
  try {
    const outbox = await enqueueManualMessage({
      channel,
      customerId,
      templateId,
      recipient,
      context,
      requireApproval: Boolean(body.requireApproval),
    });
    return Response.json({ ok: true, outbox });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "erro" }, { status: 500 });
  }
}
