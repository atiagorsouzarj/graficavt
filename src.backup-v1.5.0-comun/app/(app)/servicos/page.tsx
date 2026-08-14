import { db } from "@/db";
import { services } from "@/db/schema";
import { getCategoriesByModule } from "@/lib/queries";
import { ResourceTable, type FieldDef } from "@/components/ResourceTable";
import { CategoryManager } from "@/components/CategoryManager";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ServicosPage() {
  const [rows, categories] = await Promise.all([
    db.select().from(services),
    getCategoriesByModule("service"),
  ]);

  const catOptions = categories.map((c) => ({
    value: String(c.id),
    label: `${c.icon} ${c.name}`,
  }));
  const catLabels: Record<string, string> = {};
  for (const c of categories) catLabels[String(c.id)] = `${c.icon} ${c.name}`;

  const fields: FieldDef[] = [
    { name: "name", label: "Nome do serviço", type: "text", showInTable: true, colSpan: 2 },
    {
      name: "categoryId",
      label: "Categoria",
      type: "select",
      showInTable: true,
      options: [{ value: "", label: "— sem categoria —" }, ...catOptions],
    },
    {
      name: "type",
      label: "Tipo",
      type: "select",
      default: "proprio",
      showInTable: true,
      options: [
        { value: "proprio", label: "Próprio" },
        { value: "terceirizado", label: "Terceirizado" },
      ],
    },
    { name: "baseCost", label: "Custo base (R$)", type: "money", default: "0", showInTable: true, moneyInTable: true },
    { name: "estimatedHours", label: "Horas estimadas", type: "number", default: "0" },
    { name: "becomesProduct", label: "Vira produto?", type: "select", default: "false",
      options: [
        { value: "true", label: "Sim" },
        { value: "false", label: "Não" },
      ],
    },
    { name: "partner", label: "Parceiro (se terceirizado)", type: "text" },
    { name: "description", label: "Descrição", type: "textarea", colSpan: 2 },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Catálogo & Produção"
        icon="🛠️"
        title="Serviços"
        description="Logo, design, impressão 3D, sublimação, banner, DTF — próprios ou terceirizados."
        action={
          <CategoryManager module="service" moduleLabel="Serviços" categories={categories} />
        }
      />
      <ResourceTable
        resource="services"
        title="Serviços"
        fields={fields}
        rows={rows}
        searchKeys={["name", "partner"]}
        newLabel="Novo Serviço"
        emptyIcon="🛠️"
        hideHeader
        groupBy={{ name: "categoryId", labels: catLabels }}
        badgeField={{
          name: "type",
          map: {
            proprio: { label: "Próprio", color: "blue" },
            terceirizado: { label: "Terceirizado", color: "violet" },
          },
        }}
      />
    </div>
  );
}
