import { notFound } from "next/navigation";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrderDetail } from "@/lib/queries";
import { OrderDetail } from "@/components/modules/OrderDetail";

export const dynamic = "force-dynamic";

export default async function PedidoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getOrderDetail(Number(id));
  if (!detail) notFound();
  const [customer] = detail.order.customerId ? await db.select().from(customers).where(eq(customers.id, detail.order.customerId)) : [];
  return <OrderDetail detail={detail} customer={customer || null} />;
}
