import { notFound } from "next/navigation";
import { db } from "@/db";
import { quotes, customers, quoteItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCatalog, listProducts } from "@/lib/queries";
import { getPricingDefaults } from "@/lib/settings";
import { QuoteEditor } from "@/components/modules/QuoteEditor";

export const dynamic = "force-dynamic";

export default async function EditarOrcamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [customersList, catalog, productsList, company] = await Promise.all([
    db.select().from(customers),
    getCatalog(),
    listProducts(),
    getPricingDefaults(),
  ]);

  if (id === "new") {
    return (
      <QuoteEditor
        quote={null}
        items={[]}
        customers={customersList}
        products={productsList}
        services={catalog.services}
        company={company as never}
      />
    );
  }

  const [quote] = await db.select().from(quotes).where(eq(quotes.id, Number(id)));
  if (!quote) notFound();
  const items = await db
    .select()
    .from(quoteItems)
    .where(eq(quoteItems.quoteId, Number(id)));

  return (
    <QuoteEditor
      quote={quote}
      items={items}
      customers={customersList}
      products={productsList}
      services={catalog.services}
      company={company as never}
    />
  );
}
