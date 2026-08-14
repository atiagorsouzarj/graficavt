import { crudHandler, db } from "@/lib/crud";
import { deliveries } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return crudHandler(req, {
    onCreate: (d) => db.insert(deliveries).values(d as never).returning().then((r) => r[0]),
    onUpdate: (id, d) =>
      db
        .update(deliveries)
        .set(d as never)
        .where(eq(deliveries.id, id))
        .returning()
        .then((r) => r[0]),
    onDelete: (id) => db.delete(deliveries).where(eq(deliveries.id, id)),
  });
}
