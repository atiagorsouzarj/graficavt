import Link from "next/link";
import { ClientIdentity } from "@/components/ClientIdentity";
import { Badge, Card, CardHeader, EmptyState, PageHeader, Stat } from "@/components/ui";
import { formatDate, formatMoney } from "@/lib/format";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

const statusColor: Record<string, "slate" | "blue" | "green" | "amber" | "red" | "cyan"> = {
  aberto: "blue", confirmado: "cyan", concluido: "green", cancelado: "red",
  aguardando: "slate", em_producao: "blue", pronto: "cyan", entregue: "green",
  nao_enviada: "slate", pendente: "amber", aprovado: "green", revisao: "red",
};

export function OrdersHub({ orders, customers }: { orders: AnyRow[]; customers: AnyRow[] }) {
  const open = orders.filter((order) => !["concluido", "cancelado"].includes(order.status));
  const inProduction = orders.filter((order) => order.productionStatus === "em_producao");
  const needsArt = orders.filter((order) => ["nao_enviada", "pendente", "revisao"].includes(order.artStatus));
  return (
    <div>
      <PageHeader eyebrow="Operação" icon="📋" title="Pedidos & Ordens de Produção" description="Pedidos confirmados, arte, produção, entrega e valor em uma única visão." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Pedidos abertos" value={open.length} icon="📋" accent="blue" trend="Aguardando conclusão" />
        <Stat label="Em produção" value={inProduction.length} icon="🖨️" accent="cyan" trend="Máquinas e acabamentos" />
        <Stat label="Aguardando arte" value={needsArt.length} icon="🎨" accent="amber" trend="Não iniciar sem aprovação" />
        <Stat label="Valor em aberto" value={formatMoney(open.reduce((sum, order) => sum + Number(order.total || 0), 0))} icon="💰" accent="emerald" trend="Pedidos não concluídos" />
      </div>
      <Card className="mt-6 overflow-hidden"><CardHeader title="Lista operacional" subtitle="Acompanhe cada pedido até a entrega" />
        {orders.length === 0 ? <EmptyState icon="📋" title="Nenhum pedido criado" description="Converta um orçamento aprovado em pedido para iniciar a operação." /> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[11px] uppercase text-slate-500"><th className="px-4 py-3">Pedido</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Arte</th><th className="px-4 py-3">Produção</th><th className="px-4 py-3">Prazo</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3" /></tr></thead><tbody className="divide-y divide-slate-50">{orders.map((order) => { const customer = customers.find((item) => item.id === order.customerId) || null; return <tr key={order.id} className="hover:bg-cyan-50/30"><td className="px-4 py-3"><p className="font-bold text-slate-700">{order.number}</p><p className="text-[11px] text-slate-400">{order.status}</p></td><td className="px-4 py-3">{customer ? <ClientIdentity customer={customer} variant="inline" /> : <span className="text-slate-400">Consumidor final</span>}</td><td className="px-4 py-3"><Badge color={statusColor[order.artStatus] || "slate"}>{order.artStatus}</Badge></td><td className="px-4 py-3"><Badge color={statusColor[order.productionStatus] || "slate"}>{order.productionStatus}</Badge></td><td className="px-4 py-3 text-slate-500">{order.dueDate ? formatDate(order.dueDate) : "—"}</td><td className="px-4 py-3 text-right font-bold text-cyan-700">{formatMoney(Number(order.total))}</td><td className="px-4 py-3 text-right"><Link href={`/pedidos/${order.id}`} className="text-xs font-bold text-cyan-600 hover:underline">Abrir →</Link></td></tr>; })}</tbody></table></div>}
      </Card>
    </div>
  );
}
