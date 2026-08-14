import { db } from "@/db";
import { finishingItems } from "@/db/schema";
import { getCategoriesByModule } from "@/lib/queries";
import { ResourceTable, type FieldDef } from "@/components/ResourceTable";
import { CategoryManager } from "@/components/CategoryManager";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AcabamentosPage() {
  const [rows, categories] = await Promise.all([
    db.select().from(finishingItems),
    getCategoriesByModule("finishing"),
  ]);

  const catOptions = categories.map((c) => ({
    value: String(c.id),
    label: `${c.icon} ${c.name}`,
  }));
  const catLabels: Record<string, string> = {};
  for (const c of categories) catLabels[String(c.id)] = `${c.icon} ${c.name}`;

  const fields: FieldDef[] = [
    { name: "name", label: "Nome", type: "text", showInTable: true },
    {
      name: "categoryId",
      label: "Categoria",
      type: "select",
      showInTable: true,
      options: [{ value: "", label: "— sem categoria —" }, ...catOptions],
    },
    { name: "unit", label: "Unidade", type: "text", default: "unidade", showInTable: true },
    { name: "unitCost", label: "Custo unitário (R$)", type: "money", default: "0", showInTable: true, moneyInTable: true },
    { name: "description", label: "Descrição", type: "textarea", colSpan: 2 },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Catálogo & Produção"
        icon="✂️"
        title="Acabamentos"
        description="Laminadora, guilhotina, plastificação, encadernação — somados ao produto."
        action={
          <CategoryManager module="finishing" moduleLabel="Acabamentos" categories={categories} />
        }
      />
      <ResourceTable
        resource="finishings"
        title="Acabamentos"
        fields={fields}
        rows={rows}
        searchKeys={["name", "description"]}
        newLabel="Novo Acabamento"
        emptyIcon="✂️"
        hideHeader
        groupBy={{ name: "categoryId", labels: catLabels }}
      />
    </div>
  );
}
