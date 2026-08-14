import { notFound } from "next/navigation";
import {
  getCatalog,
  getProductWithComponents,
  getCategoriesByModule,
} from "@/lib/queries";
import { getPricingDefaults } from "@/lib/settings";
import { ProdutoEditor } from "@/components/modules/ProdutoEditor";

export const dynamic = "force-dynamic";

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [catalog, defaults, productCategories] = await Promise.all([
    getCatalog(),
    getPricingDefaults(),
    getCategoriesByModule("product"),
  ]);

  if (id === "new") {
    return (
      <ProdutoEditor
        catalog={catalog}
        productCategories={productCategories}
        defaults={defaults}
        product={null}
        components={{ finishings: [], materials: [] }}
      />
    );
  }

  const data = await getProductWithComponents(Number(id));
  if (!data) notFound();

  return (
    <ProdutoEditor
      catalog={catalog}
      productCategories={productCategories}
      defaults={defaults}
      product={data.product}
      components={{
        finishings: data.finishings.map((f) => ({
          finishingId: f.finishingId,
          quantity: String(f.quantity),
          chargeMode: f.chargeMode,
          batchSize: String(f.batchSize),
        })),
        materials: data.materials.map((m) => ({
          materialId: m.materialId,
          quantity: String(m.quantity),
        })),
      }}
    />
  );
}
