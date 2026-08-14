"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mutate } from "@/lib/mutate";
import { ClientAvatar, ClientIdentity, customerDisplayName, whatsappHref } from "@/components/ClientIdentity";
import { Badge, Button, Card, CardHeader, Field, Input, Modal, PageHeader, Select, Stat, Textarea } from "@/components/ui";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

const ACTIVITY_META: Record<string, { icon: string; color: string }> = {
  nota: { icon: "📝", color: "bg-slate-100" },
  ligacao: { icon: "📞", color: "bg-blue-100" },
  whatsapp: { icon: "💬", color: "bg-emerald-100" },
  email: { icon: "✉️", color: "bg-violet-100" },
  reuniao: { icon: "🤝", color: "bg-amber-100" },
  tarefa: { icon: "✅", color: "bg-cyan-100" },
};

export function Client360({ data }: { data: AnyRow }) {
  const router = useRouter();
  const [activityOpen, setActivityOpen] = useState(false);
  const customer = data.customer as AnyRow;
  const revenue = useMemo(() => data.customerSales.reduce((sum: number, sale: AnyRow) => sum + Number(sale.total || 0), 0), [data.customerSales]);
  const openQuotes = data.customerQuotes.filter((quote: AnyRow) => ["rascunho", "enviado"].includes(quote.status));
  const activeOrders = data.customerOrders.filter((order: AnyRow) => !["concluido", "cancelado"].includes(order.status));
  const whatsapp = whatsappHref(customer);
  const fullAddress = [
    customer.street && `${customer.street}${customer.number ? `, ${customer.number}` : ""}`,
    customer.complement,
    customer.district,
    [customer.city, customer.state].filter(Boolean).join(" / "),
    customer.cep && `CEP ${customer.cep}`,
  ].filter(Boolean).join(" · ");

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/clientes" className="text-xs font-bold text-cyan-600 hover:underline">← Voltar para Clientes</Link>
        <div className="flex gap-2">
          {whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer"><Button variant="success">💬 WhatsApp</Button></a>}
          <Button onClick={() => setActivityOpen(true)}>＋ Registrar interação</Button>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500" />
        <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center">
          <ClientAvatar customer={customer} size="lg" className="h-16 w-16 text-lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-800">{customerDisplayName(customer)}</h1>
              <Badge color={customer.type === "pj" ? "violet" : "blue"}>{customer.type === "pj" ? "Pessoa Jurídica" : "Pessoa Física"}</Badge>
              <Badge color={customer.status === "ativo" ? "green" : customer.status === "lead" ? "amber" : "slate"}>{customer.status}</Badge>
            </div>
            {customer.tradeName && customer.tradeName !== customer.name && <p className="mt-1 text-sm text-slate-500">Razão social: {customer.name}</p>}
            <p className="mt-2 text-sm text-slate-500">{customer.document || "Documento não informado"} · {customer.email || "Sem e-mail"} · {customer.whatsapp || customer.phone || "Sem telefone"}</p>
            {fullAddress && <p className="mt-1 text-xs text-slate-400">📍 {fullAddress}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3 text-right sm:grid-cols-3">
            <MiniMetric label="Limite" value={formatMoney(Number(customer.creditLimit || 0))} />
            <MiniMetric label="Pedidos" value={String(data.customerOrders.length)} />
            <MiniMetric label="Orçamentos" value={String(data.customerQuotes.length)} />
          </div>
        </div>
      </section>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Faturamento" value={formatMoney(revenue)} icon="💰" accent="emerald" trend={`${data.customerSales.length} vendas`} />
        <Stat label="Oportunidades" value={data.customerLeads.length} icon="🎯" accent="cyan" trend="Pipeline comercial" />
        <Stat label="Pedidos em aberto" value={activeOrders.length} icon="📋" accent="blue" trend="Produção / entrega" />
        <Stat label="Ações registradas" value={data.activities.length} icon="📝" accent="violet" trend="Timeline do cliente" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="🕒 Timeline de relacionamento" subtitle="Contatos, tarefas, reuniões e anotações internas" action={<Button size="sm" onClick={() => setActivityOpen(true)}>＋ Interação</Button>} />
            <div className="divide-y divide-slate-100">
              {data.activities.length === 0 ? <p className="px-5 py-10 text-center text-sm text-slate-400">Nenhuma interação registrada ainda.</p> : data.activities.map((activity: AnyRow) => {
                const meta = ACTIVITY_META[activity.type] || ACTIVITY_META.nota;
                return <div key={activity.id} className="flex gap-3 px-5 py-4"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.color}`}>{meta.icon}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold text-slate-700">{activity.title}</p><span className="text-[11px] text-slate-400">{formatDateTime(activity.createdAt)}</span></div>{activity.description && <p className="mt-1 text-sm text-slate-500">{activity.description}</p>}{activity.dueAt && !activity.completedAt && <p className="mt-1 text-[11px] font-semibold text-amber-600">⏰ Próxima ação: {formatDateTime(activity.dueAt)}</p>}</div></div>;
              })}
            </div>
          </Card>

          <Card>
            <CardHeader title="📋 Orçamentos e Pedidos" />
            <div className="divide-y divide-slate-100">
              {[...data.customerOrders, ...data.customerQuotes].length === 0 ? <p className="px-5 py-10 text-center text-sm text-slate-400">Nenhum orçamento ou pedido para este cliente.</p> : <>
                {data.customerOrders.map((order: AnyRow) => <Link key={`o${order.id}`} href={`/pedidos/${order.id}`} className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-cyan-50/40"><div><p className="text-sm font-bold text-slate-700">{order.number}</p><p className="text-[11px] text-slate-400">Pedido · Produção: {order.productionStatus}</p></div><div className="text-right"><Badge color={order.status === "concluido" ? "green" : "blue"}>{order.status}</Badge><p className="mt-1 text-sm font-bold text-cyan-700">{formatMoney(Number(order.total))}</p></div></Link>)}
                {data.customerQuotes.map((quote: AnyRow) => <Link key={`q${quote.id}`} href={`/orcamentos/${quote.id}`} className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-cyan-50/40"><div><p className="text-sm font-bold text-slate-700">{quote.number}</p><p className="text-[11px] text-slate-400">Orçamento · {formatDate(quote.createdAt)}</p></div><div className="text-right"><Badge color={quote.status === "aprovado" ? "green" : quote.status === "enviado" ? "blue" : "slate"}>{quote.status}</Badge><p className="mt-1 text-sm font-bold text-cyan-700">{formatMoney(Number(quote.total))}</p></div></Link>)}
              </>}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card><CardHeader title="🎯 Pipeline comercial" /><div className="divide-y divide-slate-100">{data.customerLeads.length === 0 ? <p className="px-5 py-8 text-center text-sm text-slate-400">Sem oportunidades abertas.</p> : data.customerLeads.map((lead: AnyRow) => <div key={lead.id} className="px-5 py-3"><div className="flex justify-between gap-2"><p className="text-sm font-bold text-slate-700">{lead.title}</p><Badge color={lead.column === "ganho" ? "green" : lead.column === "perdido" ? "red" : "cyan"}>{lead.column}</Badge></div><p className="mt-1 text-xs text-slate-500">{formatMoney(Number(lead.expectedValue || 0))} · {lead.probability}%</p></div>)}</div></Card>
          <Card><CardHeader title="🗂️ Produção" /><div className="divide-y divide-slate-100">{data.customerCards.length === 0 ? <p className="px-5 py-8 text-center text-sm text-slate-400">Sem cards de produção.</p> : data.customerCards.map((card: AnyRow) => <div key={card.id} className="px-5 py-3"><p className="text-sm font-bold text-slate-700">{card.title}</p><p className="mt-1 text-xs text-slate-500">{card.column} · {card.priority}{card.dueDate ? ` · ${formatDate(card.dueDate)}` : ""}</p></div>)}</div></Card>
          <Card><CardHeader title="💳 Financeiro" /><div className="divide-y divide-slate-100">{data.customerTx.length === 0 ? <p className="px-5 py-8 text-center text-sm text-slate-400">Sem lançamentos financeiros.</p> : data.customerTx.slice(0, 6).map((tx: AnyRow) => <div key={tx.id} className="flex justify-between px-5 py-3"><div><p className="text-sm font-bold text-slate-700">{tx.description}</p><p className="text-[11px] text-slate-400">{tx.status}</p></div><span className={tx.type === "receita" ? "font-bold text-emerald-600" : "font-bold text-rose-600"}>{tx.type === "receita" ? "+" : "−"}{formatMoney(Number(tx.amount))}</span></div>)}</div></Card>
        </div>
      </div>
      {activityOpen && <ActivityModal customerId={customer.id} leads={data.customerLeads} onClose={() => setActivityOpen(false)} onSaved={() => { setActivityOpen(false); router.refresh(); }} />}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] font-bold uppercase text-slate-400">{label}</p><p className="mt-1 text-sm font-extrabold text-slate-700">{value}</p></div>; }

function ActivityModal({ customerId, leads, onClose, onSaved }: { customerId: number; leads: AnyRow[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ type: "nota", title: "", description: "", leadId: "", dueAt: "" });
  const [saving, setSaving] = useState(false);
  const set = (key: string, value: string) => setForm((old) => ({ ...old, [key]: value }));
  async function save() { setSaving(true); try { await mutate("crm-activities", "create", { customerId, leadId: form.leadId || null, type: form.type, title: form.title, description: form.description || null, dueAt: form.dueAt ? new Date(form.dueAt) : null }); onSaved(); } catch (e) { alert(e instanceof Error ? e.message : "Erro ao registrar interação."); } finally { setSaving(false); } }
  return <Modal open onClose={onClose} icon="📝" title="Registrar interação" subtitle="Fica no histórico do cliente e pode gerar próxima ação."><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="Tipo"><Select value={form.type} onChange={(e) => set("type", e.target.value)}>{Object.keys(ACTIVITY_META).map((type) => <option key={type} value={type}>{type}</option>)}</Select></Field><Field label="Oportunidade"><Select value={form.leadId} onChange={(e) => set("leadId", e.target.value)}><option value="">— Sem oportunidade —</option>{leads.map((lead: AnyRow) => <option key={lead.id} value={lead.id}>{lead.title}</option>)}</Select></Field><Field label="Título" className="sm:col-span-2"><Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex.: Cliente pediu ajuste na arte" /></Field><Field label="Descrição" className="sm:col-span-2"><Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field><Field label="Próxima ação"><Input type="datetime-local" value={form.dueAt} onChange={(e) => set("dueAt", e.target.value)} /></Field></div><div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={save} disabled={saving || !form.title}>{saving ? "Salvando..." : "Registrar"}</Button></div></Modal>;
}
