import { db } from "@/db";
import { pricingTables } from "@/db/schema";
import { getCategoriesByModule } from "@/lib/queries";
import { ResourceTable, type FieldDef } from "@/components/ResourceTable";
import { CategoryManager } from "@/components/CategoryManager";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function TabelasPrecosPage() {
  const [rows, categories] = await Promise.all([
    db.select().from(pricingTables),
    getCategoriesByModule("pricing_table"),
  ]);

  const catOptions = categories.map((c) => ({
    value: String(c.id),
    label: `${c.icon} ${c.name}`,
  }));
  const catLabels: Record<string, string> = {};
  for (const c of categories) catLabels[String(c.id)] = `${c.icon} ${c.name}`;

  const fields: FieldDef[] = [
    {
      name: "categoryId",
      label: "Categoria",
      type: "select",
      showInTable: true,
      options: [{ value: "", label: "— sem categoria —" }, ...catOptions],
    },
    {
      name: "type",
      label: "Subtipo (identificador)",
      type: "select",
      default: "dtf_uv",
      showInTable: true,
      hint: "Usado internamente para agrupar no produto/serviço",
      options: [
        { value: "dtf_uv", label: "DTF UV" },
        { value: "dtf_textil", label: "DTF Têxtil" },
        { value: "lona", label: "Lona" },
        { value: "adesivo", label: "Adesivo Vinil" },
      ],
    },
    { name: "label", label: "Descrição", type: "text", showInTable: true, colSpan: 2 },
    { name: "unitCost", label: "Preço (R$)", type: "money", default: "0", showInTable: true, moneyInTable: true },
    { name: "unit", label: "Unidade", type: "text", default: "unidade", showInTable: true },
    { name: "widthCm", label: "Largura (cm)", type: "number" },
    { name: "heightCm", label: "Altura (cm)", type: "number" },
    { name: "minQty", label: "Qtd mínima", type: "number", default: "1" },
    { name: "notes", label: "Observações", type: "textarea", colSpan: 2 },
    {
      name: "active",
      label: "Ativo",
      type: "select",
      default: "true",
      options: [
        { value: "true", label: "Sim" },
        { value: "false", label: "Não" },
      ],
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Catálogo & Produção"
        icon="📊"
        title="Tabelas de Preços"
        description="Preços para DTF UV, DTF Têxtil, Lona e Adesivo Vinil. Compõem produtos ou serviços independentemente."
        action={
          <CategoryManager
            module="pricing_table"
            moduleLabel="Tabelas de Preços"
            categories={categories}
          />
        }
      />
      <ResourceTable
        resource="pricing-tables"
        title="Tabelas de Preços"
        fields={fields}
        rows={rows}
        searchKeys={["type", "label", "notes"]}
        newLabel="Novo Preço"
        emptyIcon="📊"
        hideHeader
        groupBy={{ name: "categoryId", labels: catLabels }}
      />
    </div>
  );
}
