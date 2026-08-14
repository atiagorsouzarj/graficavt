import { db } from "@/db";
import { transactions } from "@/db/schema";
import { ResourceTable, type FieldDef } from "@/components/ResourceTable";
import { Stat } from "@/components/ui";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

const fields: FieldDef[] = [
  {
    name: "type",
    label: "Tipo",
    type: "select",
    default: "receita",
    showInTable: true,
    options: [
      { value: "receita", label: "Receita" },
      { value: "despesa", label: "Despesa" },
    ],
  },
  { name: "description", label: "Descrição", type: "text", showInTable: true, colSpan: 2 },
  { name: "category", label: "Categoria", type: "text", showInTable: true },
  { name: "amount", label: "Valor (R$)", type: "money", default: "0", showInTable: true, moneyInTable: true },
  { name: "method", label: "Forma de pagamento", type: "text" },
  { name: "dueDate", label: "Vencimento", type: "date", showInTable: true },
  { name: "paidDate", label: "Data pagamento", type: "date" },
  {
    name: "status",
    label: "Status",
    type: "select",
    default: "pendente",
    showInTable: true,
    options: [
      { value: "pendente", label: "Pendente" },
      { value: "pago", label: "Pago" },
      { value: "atrasado", label: "Atrasado" },
    ],
  },
];

export default async function FinanceiroPage() {
  const rows = await db.select().from(transactions);
  const receitas = rows
    .filter((r) => r.type === "receita")
    .reduce((s, r) => s + Number(r.amount), 0);
  const despesas = rows
    .filter((r) => r.type === "despesa")
    .reduce((s, r) => s + Number(r.amount), 0);
  const aReceber = rows
    .filter((r) => r.type === "receita" && (r.status === "pendente" || r.status === "atrasado"))
    .reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Stat label="Receitas" value={formatMoney(receitas)} icon="📈" accent="emerald" />
        <Stat label="Despesas" value={formatMoney(despesas)} icon="📉" accent="rose" />
        <Stat label="Saldo" value={formatMoney(receitas - despesas)} icon="💰" accent="blue" />
        <Stat label="A receber" value={formatMoney(aReceber)} icon="⏳" accent="amber" />
      </div>

      <ResourceTable
        resource="transactions"
        title="Financeiro"
        eyebrow="Comercial"
        icon="💰"
        description="Contas a pagar e a receber."
        fields={fields}
        rows={rows}
        searchKeys={["description", "category", "method"]}
        newLabel="Lançamento"
        emptyIcon="💰"
        badgeField={{
          name: "type",
          map: {
            receita: { label: "Receita", color: "green" },
            despesa: { label: "Despesa", color: "red" },
          },
        }}
      />
    </div>
  );
}
