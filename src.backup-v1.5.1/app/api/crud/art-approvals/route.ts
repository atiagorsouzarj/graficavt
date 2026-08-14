import { crudHandler, db } from "@/lib/crud";
import { artApprovals, orders } from "@/db/schema";
import { enqueueCommunicationEvent } from "@/lib/communication";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return crudHandler(req, {
    onCreate: async (d) => {
      const [row] = await db.insert(artApprovals).values(d as never).returning();
      const [order] = await db.select().from(orders).where(eq(orders.id, row.orderId));
      if (order) {
        await db.update(orders).set({ artStatus: "pendente", updatedAt: new Date() }).where(eq(orders.id, order.id));
        await enqueueCommunicationEvent({
          eventType: "art.requested",
          eventId: row.id,
          customerId: order.customerId,
          context: { pedido: { numero: order.number, total: String(order.total), prazo: order.dueDate || "", producao_status: order.productionStatus }, arte: { nome: row.fileName, link: row.fileUrl || "" } },
        });
      }
      return row;
    },
    onUpdate: async (id, d) => {
      const [row] = await db
        .update(artApprovals)
        .set(d as never)
        .where(eq(artApprovals.id, id))
        .returning();
      if (row && (d.status === "aprovado" || d.status === "revisao" || d.status === "recusado")) {
        await db
          .update(orders)
          .set({
            artStatus: String(d.status),
            updatedAt: new Date(),
          })
          .where(eq(orders.id, row.orderId));
      }
      return row;
    },
    onDelete: (id) => db.delete(artApprovals).where(eq(artApprovals.id, id)),
  });
}
