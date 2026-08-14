import { db } from "@/db";
import {
  communicationEvents,
  communicationOutbox,
  customers,
  messageTemplates,
  notifications,
  settings,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { renderInteractiveTemplate, renderTemplate } from "@/lib/communication-template";
import { getPricingDefaults } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const [demo] = await db.select().from(settings).where(eq(settings.key, "communication_demo_mode"));
  if (demo?.value !== "true") {
    return Response.json({ error: "Modo de demonstração está desligado no Painel de Controle." }, { status: 403 });
  }
  const templateId = Number(body.templateId);
  const channel = body.channel as "whatsapp" | "email";
  if (!templateId || !channel) return Response.json({ error: "Template e canal são obrigatórios" }, { status: 400 });
  const [template] = await db.select().from(messageTemplates).where(eq(messageTemplates.id, templateId));
  if (!template) return Response.json({ error: "Template não encontrado" }, { status: 404 });
  const [customer] = body.customerId ? await db.select().from(customers).where(eq(customers.id, Number(body.customerId))) : [];
  const company = await getPricingDefaults();
  const recipient = String(body.recipient || (channel === "email" ? customer?.email : customer?.whatsapp || customer?.phone) || `demo-${channel}@grafcenter.local`);
  const context = {
    cliente: { nome: customer?.tradeName || customer?.name || "Cliente Demo", primeiro_nome: String(customer?.tradeName || customer?.name || "Cliente Demo").split(/\s+/)[0], documento: customer?.document || "", whatsapp: customer?.whatsapp || customer?.phone || "", email: customer?.email || "" },
    empresa: { nome: company.company_name, email: company.company_email, whatsapp: company.company_whatsapp || company.company_phone, site: "" },
    orcamento: body.context?.orcamento || { numero: "ORC-DEMO-0001", total: "R$ 120,00", validade: "20/08/2026", pagamento: "PIX", itens: "• 200 Adesivos Vinil A3+\n  Qtd: 200 · R$ 120,00", link: "#" },
    pedido: body.context?.pedido || { numero: "PED-DEMO-0001", total: "R$ 397,73", prazo: "22/08/2026", producao_status: "Aguardando" },
    arte: body.context?.arte || { nome: "arte-demo.pdf", link: "https://exemplo.com/arte-demo.pdf" },
    entrega: body.context?.entrega || { metodo: "Motoboy", instrucao: "Previsão hoje até 18h", rastreio: "", previsao: "Hoje até 18h" },
  };
  const renderedBody = renderTemplate(template.body, context, { html: channel === "email" });
  const interactive = channel === "whatsapp" ? renderInteractiveTemplate(template.interactive, context) : null;
  const subject = template.subject ? renderTemplate(template.subject, context) : null;
  const [outbox] = await db.insert(communicationOutbox).values({
    channel,
    kind: template.kind,
    customerId: customer?.id || null,
    templateId: template.id,
    templateVersion: template.version,
    eventType: "demo.simulation",
    recipient,
    subject,
    renderedBody,
    interactive,
    payload: context,
    idempotencyKey: `demo:${channel}:${template.id}:${Date.now()}`,
    status: "delivered",
    sentAt: new Date(),
    deliveredAt: new Date(),
    providerMessageId: `demo_${channel}_${Date.now()}`,
  }).returning();
  await db.insert(communicationEvents).values({ outboxId: outbox.id, channel, type: "delivered", payload: { demo: true } });
  await db.insert(notifications).values({ type: "success", title: "Mensagem simulada", body: `${template.name} foi processado em modo demonstração sem envio externo.`, href: "/comunicacoes" });
  return Response.json({ ok: true, outbox });
}
