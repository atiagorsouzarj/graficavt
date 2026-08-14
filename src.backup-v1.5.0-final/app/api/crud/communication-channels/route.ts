import { crudHandler, db } from "@/lib/crud";
import { communicationChannels } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return crudHandler(req, {
    onCreate: (d) => db.insert(communicationChannels).values(d as never).returning().then((r) => r[0]),
    onUpdate: (id, d) => db.update(communicationChannels).set({ ...(d as object), updatedAt: new Date() } as never).where(eq(communicationChannels.id, id)).returning().then((r) => r[0]),
    onDelete: (id) => db.delete(communicationChannels).where(eq(communicationChannels.id, id)),
  });
}
