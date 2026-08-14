import { db } from "@/db";
import { customers } from "@/db/schema";
import { ClientsCRM } from "@/components/modules/ClientsCRM";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const rows = await db.select().from(customers);
  return <ClientsCRM customers={rows} />;
}
