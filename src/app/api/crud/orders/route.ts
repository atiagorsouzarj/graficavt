import { crudHandler, db } from "@/lib/crud";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return crudHandler(req, {
    onCreate: (d) => db.insert(orders).values(d as never).returning().then((r) => r[0]),
    onUpdate: (id, d) =>
      db
        .update(orders)
        .set({ ...(d as object), updatedAt: new Date() } as never)
        .where(eq(orders.id, id))
        .returning()
        .then((r) => r[0]),
    onDelete: (id) => db.delete(orders).where(eq(orders.id, id)),
  });
}
