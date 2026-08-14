import Link from "next/link";
import { getDashboardStats } from "@/lib/queries";
import {
  Card,
  CardHeader,
  Stat,
  Badge,
  PageHeader,
  type BadgeColor,
} from "@/components/ui";
import { formatMoney, formatDate } from "@/lib/format";

const statusColor: Record<string, BadgeColor> = {
  rascunho: "slate",
  enviado: "blue",
  aprovado: "green",
  recusado: "red",
  expirado: "amber",
};

export const dynamic = "force-dynamic";

const MOTOR = [
  { label: "Impressoras", key: "printers", icon: "🖨️", href: "/impressoras", tint: "from-violet-50 to-white ring-violet-100" },
  { label: "Materiais", key: "materials", icon: "📦", href: "/materiais", tint: "from-amber-50 to-white ring-amber-100" },
  { label: "Acabamentos", key: "finishings", icon: "✂️", href: "/acabamentos", tint: "from-rose-50 to-white ring-rose-100" },
  { label: "Serviços", key: "services", icon: "🛠️", href: "/servicos", tint: "from-emerald-50 to-white ring-emerald-100" },
  { label: "Produtos", key: "products", icon: "🏷️", href: "/produtos", tint: "from-cyan-50 to-white ring-cyan-100" },
] as const;

const ACTIONS = [
  { href: "/produtos/new", icon: "🏷️", label: "Novo Produto", desc: "Calculadora de custo" },
  { href: "/orcamentos/new", icon: "📋", label: "Novo Orçamento", desc: "Gerar OS / PDF" },
  { href: "/pdv", icon: "🧾", label: "Abrir PDV", desc: "Frente de caixa" },
  { href: "/clientes", icon: "👥", label: "Novo Cliente", desc: "PF / PJ" },
];

export default async function Dashboard() {
  const stats = await getDashboardStats();
  const counts: Record<string, number> = {
    printers: stats.printers,
    materials: stats.materials,
    finishings: stats.finishings,
    services: stats.services,
    products: stats.products,
  };

  return (
    <div>
      <PageHeader
        eyebrow="Visão geral"
        title="Dashboard"
        icon="📊"
        description="Acompanhe seu negócio de gráfica rápida, papelaria personalizada e 3D."
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Faturamento (PDV)"
          value={formatMoney(stats.revenue)}
          icon="💰"
          accent="emerald"
          trend="Vendas concluídas"
        />
        <Stat
          label="A receber"
          value={formatMoney(stats.pending)}
          icon="⏳"
          accent="amber"
          trend="Contas em aberto"
        />
        <Stat
          label="Despesas"
          value={formatMoney(stats.expenses)}
          icon="📉"
          accent="rose"
          trend="Total registrado"
        />
        <Stat
          label="Clientes"
          value={stats.customers}
          icon="👥"
          accent="cyan"
          trend={`${stats.quotes} orçamentos`}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Motor */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="⚙️ Motor de Precificação"
            subtitle="Componentes que alimentam o cálculo dos produtos"
          />
          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-5">
            {MOTOR.map((x) => (
              <Link
                key={x.label}
                href={x.href}
                className={`group rounded-2xl bg-gradient-to-b ${x.tint} p-4 text-center ring-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
              >
                <div className="text-2xl transition-transform duration-200 group-hover:scale-110">
                  {x.icon}
                </div>
                <div className="mt-1.5 text-2xl font-extrabold text-slate-800">
                  {counts[x.key]}
                </div>
                <div className="text-[11px] font-semibold text-slate-500">
                  {x.label}
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Estoque crítico */}
        <Card>
          <CardHeader title="⚠️ Estoque crítico" subtitle="Materiais no mínimo" />
          <div className="p-3">
            {stats.lowStock.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-slate-400">
                Tudo abastecido ✅
              </p>
            ) : (
              stats.lowStock.slice(0, 6).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-slate-50"
                >
                  <span className="truncate text-sm text-slate-600">{m.name}</span>
                  <Badge color="red">
                    {Number(m.stock)} {m.unit}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Orçamentos recentes */}
      <Card className="mt-6">
        <CardHeader
          title="📋 Orçamentos recentes"
          action={
            <Link
              href="/orcamentos"
              className="text-xs font-bold text-cyan-600 hover:underline"
            >
              Ver todos →
            </Link>
          }
        />
        <div className="divide-y divide-slate-50">
          {stats.recentQuotes.length === 0 ? (
            <p className="px-5 py-10 text-center text-xs text-slate-400">
              Nenhum orçamento ainda.
            </p>
          ) : (
            stats.recentQuotes.map((q) => (
              <div
                key={q.id}
                className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-cyan-50/30"
              >
                <div>
                  <p className="text-sm font-bold text-slate-800">{q.number}</p>
                  <p className="text-xs text-slate-400">{formatDate(q.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-700">
                    {formatMoney(Number(q.total))}
                  </span>
                  <Badge color={statusColor[q.status] || "slate"}>{q.status}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Ações rápidas */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {ACTIONS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"
          >
            <div className="text-2xl transition-transform duration-200 group-hover:scale-110">
              {a.icon}
            </div>
            <div className="mt-2 text-sm font-bold text-slate-800">{a.label}</div>
            <div className="text-[11px] text-slate-500">{a.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
