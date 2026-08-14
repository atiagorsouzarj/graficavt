import { crudHandler, db } from "@/lib/crud";
import { kanbanCards } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return crudHandler(req, {
    onCreate: (d) =>
      db
        .insert(kanbanCards)
        .values(d as never)
        .returning()
        .then((r) => r[0]),
    onUpdate: (id, d) =>
      db
        .update(kanbanCards)
        .set(d as never)
        .where(eq(kanbanCards.id, id))
        .returning()
        .then((r) => r[0]),
    onDelete: (id) =>
      db.delete(kanbanCards).where(eq(kanbanCards.id, id)),
  });
}
