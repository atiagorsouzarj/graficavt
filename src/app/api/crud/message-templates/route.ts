import { crudHandler, db } from "@/lib/crud";
import { messageTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return crudHandler(req, {
    onCreate: (d) => db.insert(messageTemplates).values(d as never).returning().then((r) => r[0]),
    onUpdate: async (id, d) => {
      const [current] = await db.select().from(messageTemplates).where(eq(messageTemplates.id, id));
      const hasContentChange = current && (String(d.body ?? current.body) !== current.body || String(d.subject ?? current.subject ?? "") !== String(current.subject ?? ""));
      return db.update(messageTemplates).set({ ...(d as object), version: hasContentChange ? current.version + 1 : current?.version, updatedAt: new Date() } as never).where(eq(messageTemplates.id, id)).returning().then((r) => r[0]);
    },
    onDelete: (id) => db.delete(messageTemplates).where(eq(messageTemplates.id, id)),
  });
}
