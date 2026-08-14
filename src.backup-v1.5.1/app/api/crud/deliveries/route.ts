import { crudHandler, db } from "@/lib/crud";
import { deliveries, orders } from "@/db/schema";
import { enqueueCommunicationEvent } from "@/lib/communication";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return crudHandler(req, {
    onCreate: (d) => db.insert(deliveries).values(d as never).returning().then((r) => r[0]),
    onUpdate: async (id, d) => {
      const [row] = await db.update(deliveries).set(d as never).where(eq(deliveries.id, id)).returning();
      if (row && (d.status === "em_rota" || d.status === "entregue")) {
        const [order] = row.orderId ? await db.select().from(orders).where(eq(orders.id, row.orderId)) : [];
        await enqueueCommunicationEvent({
          eventType: d.status === "em_rota" ? "delivery.in_route" : "delivery.delivered",
          eventId: row.id,
          customerId: row.customerId,
          context: { pedido: { numero: order?.number || "", total: String(order?.total || ""), prazo: order?.dueDate || "", producao_status: order?.productionStatus || "" }, entrega: { metodo: row.method, instrucao: row.notes || "", rastreio: row.trackingCode || "", previsao: row.scheduledAt?.toLocaleString("pt-BR") || "" } },
        });
      }
      return row;
    },
    onDelete: (id) => db.delete(deliveries).where(eq(deliveries.id, id)),
  });
}
