import { db } from "@/db";
import { materials } from "@/db/schema";
import { getCategoriesByModule } from "@/lib/queries";
import { ResourceTable, type FieldDef } from "@/components/ResourceTable";
import { CategoryManager } from "@/components/CategoryManager";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function MateriaisPage() {
  const [rows, categories] = await Promise.all([
    db.select().from(materials),
    getCategoriesByModule("material"),
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
    { name: "supplier", label: "Fornecedor", type: "text", showInTable: true },
    { name: "stock", label: "Estoque atual", type: "number", default: "0", showInTable: true, hint: "Ajuste fino em Estoque > Movimentações" },
    { name: "minStock", label: "Estoque mínimo", type: "number", default: "0" },
    { name: "notes", label: "Observações", type: "textarea", colSpan: 2 },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Catálogo & Produção"
        icon="📦"
        title="Materiais / Estoque"
        description="Papéis, vinis, tecidos, químicos — tudo que compõe o custo do produto."
        action={
          <CategoryManager module="material" moduleLabel="Materiais" categories={categories} />
        }
      />
      <ResourceTable
        resource="materials"
        title="Materiais / Estoque"
        fields={fields}
        rows={rows}
        searchKeys={["name", "supplier"]}
        newLabel="Novo Material"
        emptyIcon="📦"
        hideHeader
        groupBy={{ name: "categoryId", labels: catLabels }}
      />
    </div>
  );
}
