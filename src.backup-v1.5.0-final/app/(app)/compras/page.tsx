import { getPurchasingData } from "@/lib/queries";
import { PurchasesClient } from "@/components/modules/PurchasesClient";

export const dynamic = "force-dynamic";

export default async function ComprasPage() {
  const data = await getPurchasingData();
  return <PurchasesClient suppliers={data.suppliers} purchases={data.purchases} materials={data.materials} />;
}
