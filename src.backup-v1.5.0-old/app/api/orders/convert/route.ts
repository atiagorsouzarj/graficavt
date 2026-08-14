import { db } from "@/db";
import { orders, quotes, quoteItems, deliveries } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Converte orçamento aprovado em Pedido/OS. Idempotente por quoteId. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const quoteId = Number(body.quoteId);
  if (!quoteId) return Response.json({ error: "quoteId obrigatório" }, { status: 400 });

  try {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId));
    if (!quote) return Response.json({ error: "Orçamento não encontrado" }, { status: 404 });
    if (quote.status !== "aprovado") {
      return Response.json({ error: "Apenas orçamentos aprovados podem virar pedido" }, { status: 409 });
    }
    const [existing] = await db.select().from(orders).where(eq(orders.quoteId, quoteId));
    if (existing) return Response.json({ ok: true, order: existing, existing: true });

    const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));
    const number = `PED-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const [order] = await db
      .insert(orders)
      .values({
        number,
        quoteId,
        customerId: quote.customerId,
        status: "confirmado",
        productionStatus: "aguardando",
        artStatus: "nao_enviada",
        deliveryStatus: "a_definir",
        items,
        subtotal: quote.subtotal,
        discount: quote.discount,
        taxes: quote.taxes,
        total: quote.total,
        paymentMethod: quote.paymentMethod,
        notes: quote.notes,
      })
      .returning();

    // já cria uma entrega/retirada pendente para controlar o último passo
    await db.insert(deliveries).values({
      orderId: order.id,
      customerId: order.customerId,
      method: "retirada",
      status: "aguardando",
      addressSnapshot: null,
      notes: "Gerada automaticamente ao converter orçamento em pedido.",
    });

    return Response.json({ ok: true, order, existing: false });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "erro" }, { status: 500 });
  }
}
