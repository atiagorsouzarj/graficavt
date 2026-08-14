import { crudHandler, db } from "@/lib/crud";
import { artApprovals, orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return crudHandler(req, {
    onCreate: (d) => db.insert(artApprovals).values(d as never).returning().then((r) => r[0]),
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
