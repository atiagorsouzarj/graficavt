import { getCatalog } from "@/lib/queries";
import { ImpressorasClient } from "@/components/modules/ImpressorasClient";

export const dynamic = "force-dynamic";

export default async function ImpressorasPage() {
  const { categories, consumables, printers, formats } = await getCatalog();
  return (
    <ImpressorasClient
      categories={categories}
      consumables={consumables}
      printers={printers}
      formats={formats}
    />
  );
}
