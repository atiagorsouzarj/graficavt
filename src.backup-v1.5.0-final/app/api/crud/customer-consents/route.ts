import { crudHandler, db } from "@/lib/crud";
import { customerConsents } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return crudHandler(req, {
    onCreate: (d) => db.insert(customerConsents).values(d as never).returning().then((r) => r[0]),
    onUpdate: (id, d) => db.update(customerConsents).set(d as never).where(eq(customerConsents.id, id)).returning().then((r) => r[0]),
    onDelete: (id) => db.delete(customerConsents).where(eq(customerConsents.id, id)),
  });
}
