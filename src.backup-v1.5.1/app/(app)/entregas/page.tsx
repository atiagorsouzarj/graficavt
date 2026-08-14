import { getDeliveryData } from "@/lib/queries";
import { DeliveriesClient } from "@/components/modules/DeliveriesClient";

export const dynamic = "force-dynamic";

export default async function EntregasPage() {
  const data = await getDeliveryData();
  return <DeliveriesClient deliveries={data.deliveries} orders={data.orders} customers={data.customers} />;
}
