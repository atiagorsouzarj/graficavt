import { getProductionData } from "@/lib/queries";
import { ProductionAgenda } from "@/components/modules/ProductionAgenda";

export const dynamic = "force-dynamic";

export default async function AgendaProducaoPage() {
  const data = await getProductionData();
  return <ProductionAgenda schedules={data.schedules} orders={data.orders} printers={data.printers} />;
}
