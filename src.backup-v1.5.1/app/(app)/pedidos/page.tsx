import { db } from "@/db";
import { customers } from "@/db/schema";
import { getOrders } from "@/lib/queries";
import { OrdersHub } from "@/components/modules/OrdersHub";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const [orders, customerList] = await Promise.all([getOrders(), db.select().from(customers)]);
  return <OrdersHub orders={orders} customers={customerList} />;
}
