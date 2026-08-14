import { db } from "@/db";
import { products, services, customers } from "@/db/schema";
import { listProducts } from "@/lib/queries";
import { getPricingDefaults } from "@/lib/settings";
import { PDVClient } from "@/components/modules/PDVClient";

export const dynamic = "force-dynamic";

export default async function PDVPage() {
  const [productsList, servicesList, customersList, company] = await Promise.all([
    listProducts(),
    db.select().from(services),
    db.select().from(customers),
    getPricingDefaults(),
  ]);

  return (
    <PDVClient
      products={productsList}
      services={servicesList}
      customers={customersList}
      company={company as never}
      defaults={company as never}
    />
  );
}
