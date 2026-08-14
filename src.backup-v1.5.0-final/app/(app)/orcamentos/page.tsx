import Link from "next/link";
import { db } from "@/db";
import { quotes, customers } from "@/db/schema";
import { desc } from "drizzle-orm";
import {
  Card,
  PageHeader,
  Button,
  Badge,
  EmptyState,
} from "@/components/ui";
import { formatMoney, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const statusColor = {
  rascunho: "slate",
  enviado: "blue",
  aprovado: "green",
  recusado: "red",
  expirado: "amber",
} as const;

export default async function OrcamentosPage() {
  const [list, custs] = await Promise.all([
    db.select().from(quotes).orderBy(desc(quotes.createdAt)),
    db.select().from(customers),
  ]);
  const custMap = new Map(custs.map((c) => [c.id, c]));

  return (
    <div>
      <PageHeader
        title="Orçamentos"
        description="Gerencie propostas e gere a OS / PDF para imprimir ou salvar."
        action={
          <Link href="/orcamentos/new">
            <Button>＋ Novo Orçamento</Button>
          </Link>
        }
      />

      {list.length === 0 ? (
        <Card>
          <EmptyState
            icon="📄"
            title="Nenhum orçamento"
            description="Crie seu primeiro orçamento e gere a OS para impressão."
            action={
              <Link href="/orcamentos/new">
                <Button>＋ Novo Orçamento</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs uppercase text-slate-500">
                  <th className="px-4 py-3">Número</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {list.map((q) => {
                  const c = q.customerId ? custMap.get(q.customerId) : null;
                  return (
                    <tr key={q.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {q.number}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {c?.name || "Consumidor final"}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(q.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={statusColor[q.status as keyof typeof statusColor]}>
                          {q.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">
                        {formatMoney(Number(q.total))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/orcamentos/${q.id}`}
                          className="text-xs font-semibold text-cyan-600 hover:underline"
                        >
                          Abrir →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
