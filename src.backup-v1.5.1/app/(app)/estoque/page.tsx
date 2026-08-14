import { db } from "@/db";
import { materials, products } from "@/db/schema";
import { getStockMovements } from "@/lib/queries";
import { StockClient } from "@/components/modules/StockClient";

export const dynamic = "force-dynamic";

export default async function EstoquePage() {
  const [materialsList, productsList, movements] = await Promise.all([
    db.select().from(materials),
    db.select().from(products),
    getStockMovements(),
  ]);

  return (
    <StockClient
      materials={materialsList}
      products={productsList.filter((p) => p.trackStock)}
      movements={movements}
    />
  );
}
