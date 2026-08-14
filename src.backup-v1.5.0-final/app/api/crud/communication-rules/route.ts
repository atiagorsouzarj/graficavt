import { crudHandler, db } from "@/lib/crud";
import { communicationRules } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return crudHandler(req, {
    onCreate: (d) => db.insert(communicationRules).values(d as never).returning().then((r) => r[0]),
    onUpdate: (id, d) => db.update(communicationRules).set({ ...(d as object), updatedAt: new Date() } as never).where(eq(communicationRules.id, id)).returning().then((r) => r[0]),
    onDelete: (id) => db.delete(communicationRules).where(eq(communicationRules.id, id)),
  });
}
