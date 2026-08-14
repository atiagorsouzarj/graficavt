import { db } from "@/lib/crud";
import { quotes, quoteItems, kanbanCards, customers } from "@/db/schema";
import { nextDocumentNumber } from "@/lib/documents";
import { enqueueCommunicationEvent } from "@/lib/communication";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Item = {
  description: string;
  productId?: number | null;
  serviceId?: number | null;
  quantity: number;
  unitPrice: number;
  total: number;
};

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }
  const op = body.op;
  const d = body.data || {};

  try {
    if (op === "create") {
      const number = await nextDocumentNumber("quote");
      const [row] = await db
        .insert(quotes)
        .values({
          number,
          customerId: d.customerId ? Number(d.customerId) : null,
          status: d.status || "rascunho",
          validUntil: d.validUntil || null,
          subtotal: String(d.subtotal ?? 0),
          discount: String(d.discount ?? 0),
          taxes: String(d.taxes ?? 0),
          total: String(d.total ?? 0),
          paymentMethod: d.paymentMethod || null,
          notes: d.notes || null,
        } as never)
        .returning();
      await saveItems(row.id, d.items || []);
      await syncProductionCard(row.id, d.status || "rascunho", row.customerId, row.number, d.items || []);
      if ((d.status || "rascunho") === "enviado") {
        const itemsText = (d.items || []).map((item: Item) => `• ${item.description}\n  Qtd: ${item.quantity} · R$ ${Number(item.total || 0).toFixed(2).replace(".", ",")}`).join("\n");
        await enqueueCommunicationEvent({
          eventType: "quote.sent",
          eventId: row.id,
          customerId: row.customerId,
          context: { orcamento: { numero: row.number, total: `R$ ${Number(row.total || 0).toFixed(2).replace(".", ",")}`, validade: row.validUntil || "", pagamento: row.paymentMethod || "A definir", itens: itemsText || "Itens a definir", link: `/orcamentos/${row.id}` } },
        });
      }
      return Response.json({ ok: true, row });
    }
    if (op === "update") {
      const id = Number(body.id);
      await db
        .update(quotes)
        .set({
          customerId: d.customerId ? Number(d.customerId) : null,
          status: d.status || "rascunho",
          validUntil: d.validUntil || null,
          subtotal: String(d.subtotal ?? 0),
          discount: String(d.discount ?? 0),
          taxes: String(d.taxes ?? 0),
          total: String(d.total ?? 0),
          paymentMethod: d.paymentMethod || null,
          notes: d.notes || null,
        } as never)
        .where(eq(quotes.id, id));
      await saveItems(id, d.items || []);
      const [updated] = await db.select().from(quotes).where(eq(quotes.id, id));
      if (updated) {
        await syncProductionCard(id, d.status || "rascunho", updated.customerId, updated.number, d.items || []);
        if ((d.status || "rascunho") === "enviado") {
          const itemsText = (d.items || []).map((item: Item) => `• ${item.description}\n  Qtd: ${item.quantity} · R$ ${Number(item.total || 0).toFixed(2).replace(".", ",")}`).join("\n");
          await enqueueCommunicationEvent({
            eventType: "quote.sent",
            eventId: updated.id,
            customerId: updated.customerId,
            context: { orcamento: { numero: updated.number, total: `R$ ${Number(updated.total || 0).toFixed(2).replace(".", ",")}`, validade: updated.validUntil || "", pagamento: updated.paymentMethod || "A definir", itens: itemsText || "Itens a definir", link: `/orcamentos/${updated.id}` } },
          });
        }
      }
      return Response.json({ ok: true });
    }
    if (op === "delete") {
      await db.delete(quotes).where(eq(quotes.id, Number(body.id)));
      return Response.json({ ok: true });
    }
    return Response.json({ error: "op inválido" }, { status: 400 });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "erro" },
      { status: 500 }
    );
  }
}

async function saveItems(quoteId: number, items: Item[]) {
  await db.delete(quoteItems).where(eq(quoteItems.quoteId, quoteId));
  for (const it of items) {
    await db.insert(quoteItems).values({
      quoteId,
      description: it.description,
      productId: it.productId ? Number(it.productId) : null,
      serviceId: it.serviceId ? Number(it.serviceId) : null,
      quantity: String(it.quantity ?? 1),
      unitPrice: String(it.unitPrice ?? 0),
      total: String(it.total ?? 0),
    });
  }
}

/** Orçamento aprovado entra automaticamente no Kanban de Produção. */
async function syncProductionCard(
  quoteId: number,
  status: string,
  customerId: number | null,
  quoteNumber: string,
  items: Item[]
) {
  if (status !== "aprovado") return;
  const [existing] = await db
    .select()
    .from(kanbanCards)
    .where(eq(kanbanCards.quoteId, quoteId));

  const [customer] = customerId
    ? await db.select().from(customers).where(eq(customers.id, customerId))
    : [];
  const firstProduct = items.find((i) => i.productId)?.productId || null;
  const summary = items
    .slice(0, 3)
    .map((i) => `${i.quantity}× ${i.description}`)
    .join(" · ");

  const cardData = {
    title: `Pedido ${quoteNumber}`,
    description: summary || "Orçamento aprovado — aguardando produção.",
    column: "backlog",
    customerId: customerId || null,
    customerName: customer?.name || "Consumidor final",
    productId: firstProduct ? Number(firstProduct) : null,
    priority: "normal",
    quoteId,
  };
  if (existing) {
    await db.update(kanbanCards).set(cardData).where(eq(kanbanCards.id, existing.id));
  } else {
    await db.insert(kanbanCards).values(cardData);
  }
}
