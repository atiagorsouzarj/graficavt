import { db } from "@/db";
import { customers } from "@/db/schema";
import { getCrmPipeline } from "@/lib/queries";
import { CrmPipeline } from "@/components/modules/CrmPipeline";

export const dynamic = "force-dynamic";

export default async function CrmPage() {
  const [leads, customerList] = await Promise.all([
    getCrmPipeline(),
    db.select().from(customers),
  ]);
  return <CrmPipeline leads={leads} customers={customerList} />;
}
