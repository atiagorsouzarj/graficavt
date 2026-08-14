import Link from "next/link";
import { db } from "@/db";
import {
  sales,
  transactions,
  products,
  customers,
  quotes,
  materials,
} from "@/db/schema";
import { desc } from "drizzle-orm";
import {
  Card,
  CardHeader,
  Stat,
  PageHeader,
  Badge,
  EmptyState,
} from "@/components/ui";
import { formatMoney, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  const [salesRows, txRows, productRows, custRows, quoteRows, matRows] =
    await Promise.all([
      db.select().from(sales).orderBy(desc(sales.createdAt)),
      db.select().from(transactions),
      db.select().from(products),
      db.select().from(customers),
      db.select().from(quotes),
      db.select().from(materials),
    ]);

  const revenue = salesRows.reduce((s, r) => s + Number(r.total || 0), 0);
  const ticket = salesRows.length ? revenue / salesRows.length : 0;
  const receitas = txRows
    .filter((t) => t.type === "receita")
    .reduce((s, t) => s + Number(t.amount), 0);
  const despesas = txRows
    .filter((t) => t.type === "despesa")
    .reduce((s, t) => s + Number(t.amount), 0);
  const lucro = receitas - despesas;

  // margem média dos produtos
  const withMargin = productRows.filter((p) => Number(p.finalPrice) > 0);
  const avgMargin = withMargin.length
    ? withMargin.reduce((s, p) => {
        const f = Number(p.finalPrice);
        const c = Number(p.costSnapshot);
        return s + (f > 0 ? ((f - c) / f) * 100 : 0);
      }, 0) / withMargin.length
    : 0;

  // top produtos por preço
  const topProducts = [...productRows]
    .sort((a, b) => Number(b.finalPrice) - Number(a.finalPrice))
    .slice(0, 8);

  const approved = quoteRows.filter((q) => q.status === "aprovado").length;
  const convRate = quoteRows.length
    ? (approved / quoteRows.length) * 100
    : 0;

  const lowStock = matRows.filter(
    (m) => Number(m.stock) <= Number(m.minStock || 0)
  );

  const estoqueValor = matRows.reduce(
    (s, m) => s + Number(m.stock) * Number(m.unitCost),
    0
  );

  return (
    <div>
      <PageHeader
        eyebrow="Inteligência do negócio"
        title="Relatórios"
        icon="📈"
        description="Indicadores consolidados de vendas, margem, estoque e conversão."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Faturamento"
          value={formatMoney(revenue)}
          icon="💰"
          accent="emerald"
          trend={`${salesRows.length} vendas`}
        />
        <Stat
          label="Ticket médio"
          value={formatMoney(ticket)}
          icon="🎫"
          accent="cyan"
          trend="Por venda no PDV"
        />
        <Stat
          label="Lucro (receita − despesa)"
          value={formatMoney(lucro)}
          icon={lucro >= 0 ? "📈" : "📉"}
          accent={lucro >= 0 ? "emerald" : "rose"}
          trend={`${formatMoney(receitas)} − ${formatMoney(despesas)}`}
        />
        <Stat
          label="Margem média"
          value={`${avgMargin.toFixed(1)}%`}
          icon="🎯"
          accent="violet"
          trend={`${withMargin.length} produtos precificados`}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Conversão de orçamentos"
          value={`${convRate.toFixed(0)}%`}
          icon="✅"
          accent="blue"
          trend={`${approved} de ${quoteRows.length} aprovados`}
        />
        <Stat
          label="Valor em estoque"
          value={formatMoney(estoqueValor)}
          icon="📦"
          accent="amber"
          trend={`${matRows.length} materiais`}
        />
        <Stat
          label="Itens críticos"
          value={lowStock.length}
          icon="⚠️"
          accent="rose"
          trend="Abaixo do mínimo"
        />
        <Stat
          label="Base de clientes"
          value={custRows.length}
          icon="👥"
          accent="cyan"
          trend={`${custRows.filter((c) => c.status === "ativo").length} ativos`}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top produtos */}
        <Card>
          <CardHeader
            title="🏆 Produtos por valor"
            subtitle="Maiores preços finais do catálogo"
            action={
              <Link
                href="/produtos"
                className="text-xs font-bold text-cyan-600 hover:underline"
              >
                Ver todos →
              </Link>
            }
          />
          {topProducts.length === 0 ? (
            <EmptyState icon="🏷️" title="Sem produtos" />
          ) : (
            <div className="divide-y divide-slate-50">
              {topProducts.map((p) => {
                const cost = Number(p.costSnapshot);
                const final = Number(p.finalPrice);
                const marginPct = final > 0 ? ((final - cost) / final) * 100 : 0;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-700">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Custo {formatMoney(cost)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge
                        color={
                          marginPct >= 50
                            ? "green"
                            : marginPct >= 25
                            ? "amber"
                            : "red"
                        }
                      >
                        {marginPct.toFixed(0)}%
                      </Badge>
                      <span className="text-sm font-bold text-cyan-600">
                        {formatMoney(final)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Últimas vendas */}
        <Card>
          <CardHeader
            title="🧾 Últimas vendas"
            subtitle="Movimento do PDV"
            action={
              <Link
                href="/pdv"
                className="text-xs font-bold text-cyan-600 hover:underline"
              >
                Abrir PDV →
              </Link>
            }
          />
          {salesRows.length === 0 ? (
            <EmptyState icon="🧾" title="Nenhuma venda registrada" />
          ) : (
            <div className="divide-y divide-slate-50">
              {salesRows.slice(0, 8).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-5 py-2.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      {s.number}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {formatDate(s.createdAt)} · {s.paymentMethod || "—"}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">
                    {formatMoney(Number(s.total))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Estoque crítico */}
      {lowStock.length > 0 && (
        <Card className="mt-6">
          <CardHeader
            title="⚠️ Reposição necessária"
            subtitle="Materiais no ou abaixo do estoque mínimo"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[11px] uppercase text-slate-500">
                  <th className="px-4 py-2.5 font-bold">Material</th>
                  <th className="px-4 py-2.5 font-bold">Fornecedor</th>
                  <th className="px-4 py-2.5 font-bold">Estoque</th>
                  <th className="px-4 py-2.5 font-bold">Mínimo</th>
                  <th className="px-4 py-2.5 text-right font-bold">Repor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {lowStock.map((m) => (
                  <tr key={m.id} className="hover:bg-rose-50/30">
                    <td className="px-4 py-2.5 font-medium text-slate-700">
                      {m.name}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {m.supplier || "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge color="red">
                        {Number(m.stock)} {m.unit}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {Number(m.minStock)} {m.unit}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-700">
                      {formatMoney(
                        Math.max(Number(m.minStock) * 2 - Number(m.stock), 0) *
                          Number(m.unitCost)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
