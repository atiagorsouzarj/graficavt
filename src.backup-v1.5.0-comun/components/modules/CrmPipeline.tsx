"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { mutate } from "@/lib/mutate";
import { ClientIdentity } from "@/components/ClientIdentity";
import { SearchCombobox } from "@/components/SearchCombobox";
import { Badge, Button, Field, Input, Modal, PageHeader, Select, Textarea } from "@/components/ui";
import { formatMoney, formatDate } from "@/lib/format";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

const STAGES = [
  { id: "novo", title: "Novos", color: "bg-slate-400" },
  { id: "qualificacao", title: "Qualificação", color: "bg-blue-500" },
  { id: "orcamento", title: "Orçamento", color: "bg-cyan-500" },
  { id: "negociacao", title: "Negociação", color: "bg-amber-500" },
  { id: "ganho", title: "Ganhos", color: "bg-emerald-500" },
  { id: "perdido", title: "Perdidos", color: "bg-rose-500" },
];

const SOURCES = ["manual", "balcao", "whatsapp", "instagram", "site", "indicacao", "telefone", "email"];

export function CrmPipeline({ leads: initial, customers }: { leads: AnyRow[]; customers: AnyRow[] }) {
  const router = useRouter();
  const [leads, setLeads] = useState(initial);
  const [dragId, setDragId] = useState<number | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [modal, setModal] = useState<null | { stage: string; lead?: AnyRow }>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => setLeads(initial), [initial]);

  const totals = useMemo(() => ({
    expected: leads.filter((l) => !["ganho", "perdido"].includes(l.column)).reduce((sum, l) => sum + Number(l.expectedValue || 0), 0),
    gained: leads.filter((l) => l.column === "ganho").reduce((sum, l) => sum + Number(l.expectedValue || 0), 0),
    actions: leads.filter((l) => l.nextActionAt && new Date(l.nextActionAt).getTime() <= Date.now() + 86400000).length,
  }), [leads]);

  async function moveLead(id: number, column: string) {
    const before = leads;
    setLeads((all) => all.map((lead) => lead.id === id ? { ...lead, column } : lead));
    try {
      await mutate("crm-leads", "update", { column }, id);
    } catch {
      setLeads(before);
      alert("Não foi possível mover o lead.");
    }
  }

  async function remove(id: number) {
    if (!confirm("Excluir esta oportunidade?")) return;
    setLeads((all) => all.filter((lead) => lead.id !== id));
    await mutate("crm-leads", "delete", undefined, id);
  }

  async function save(data: Record<string, unknown>, id?: number) {
    setSaving(true);
    try {
      if (id) await mutate("crm-leads", "update", data, id);
      else await mutate("crm-leads", "create", data);
      setModal(null);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao salvar oportunidade.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Comercial & Relacionamento"
        icon="🎯"
        title="Pipeline Comercial"
        description="Acompanhe leads, oportunidades e próximos contatos — do primeiro atendimento ao ganho."
        action={<Button onClick={() => setModal({ stage: "novo" })}>＋ Nova Oportunidade</Button>}
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 to-blue-50 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-cyan-600">Pipeline aberto</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-800">{formatMoney(totals.expected)}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">Oportunidades ganhas</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-800">{formatMoney(totals.gained)}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-600">Próximas ações</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-800">{totals.actions}</p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageLeads = leads.filter((lead) => lead.column === stage.id);
          const stageValue = stageLeads.reduce((sum, lead) => sum + Number(lead.expectedValue || 0), 0);
          return (
            <div
              key={stage.id}
              onDragOver={(e) => { e.preventDefault(); setOver(stage.id); }}
              onDragLeave={() => setOver(null)}
              onDrop={() => { if (dragId) moveLead(dragId, stage.id); setDragId(null); setOver(null); }}
              className={`w-80 shrink-0 rounded-2xl p-2 transition-colors ${over === stage.id ? "bg-cyan-50 ring-2 ring-cyan-300" : "bg-slate-100/70"}`}
            >
              <div className="mb-2 flex items-center justify-between px-2 py-1">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                    <h2 className="text-sm font-bold text-slate-700">{stage.title}</h2>
                    <span className="rounded-full bg-white px-1.5 text-[11px] font-bold text-slate-500">{stageLeads.length}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400">{formatMoney(stageValue)}</p>
                </div>
                <button onClick={() => setModal({ stage: stage.id })} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-white hover:text-cyan-600">＋</button>
              </div>
              <div className="space-y-2">
                {stageLeads.map((lead) => {
                  const customer = customers.find((customer) => customer.id === lead.customerId) || null;
                  return (
                    <article
                      key={lead.id}
                      draggable
                      onDragStart={() => setDragId(lead.id)}
                      onDragEnd={() => { setDragId(null); setOver(null); }}
                      className={`cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all active:cursor-grabbing ${dragId === lead.id ? "opacity-40" : "hover:shadow-md"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-bold text-slate-800">{lead.title}</p>
                        <Badge color={lead.probability >= 70 ? "green" : lead.probability >= 40 ? "amber" : "slate"}>{lead.probability || 0}%</Badge>
                      </div>
                      {customer ? <ClientIdentity customer={customer} variant="inline" className="mt-2 border-t border-slate-100 pt-2" /> : <p className="mt-2 text-xs text-slate-400">Cliente ainda não vinculado</p>}
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="font-bold text-cyan-700">{formatMoney(Number(lead.expectedValue || 0))}</span>
                        <span className="text-slate-400">{lead.source || "manual"}</span>
                      </div>
                      {lead.nextActionAt && <p className="mt-2 text-[11px] text-amber-700">⏰ Próxima ação: {formatDate(lead.nextActionAt)}</p>}
                      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                        <Link href={customer ? `/clientes/${customer.id}` : "/clientes"} className="text-[11px] font-bold text-slate-500 hover:text-cyan-600">Cliente →</Link>
                        <div className="flex gap-2"><button onClick={() => setModal({ stage: stage.id, lead })} className="text-[11px] font-bold text-cyan-600 hover:underline">Editar</button><button onClick={() => remove(lead.id)} className="text-[11px] font-bold text-rose-600 hover:underline">Excluir</button></div>
                      </div>
                    </article>
                  );
                })}
                {stageLeads.length === 0 && <button onClick={() => setModal({ stage: stage.id })} className="w-full rounded-xl border border-dashed border-slate-300 py-5 text-xs text-slate-400 hover:border-cyan-300 hover:text-cyan-600">＋ Adicionar oportunidade</button>}
              </div>
            </div>
          );
        })}
      </div>

      {modal && <LeadModal stage={modal.stage} lead={modal.lead} customers={customers} saving={saving} onClose={() => setModal(null)} onSave={(data) => save(data, modal.lead?.id)} />}
    </div>
  );
}

function LeadModal({ stage, lead, customers, saving, onClose, onSave }: { stage: string; lead?: AnyRow; customers: AnyRow[]; saving: boolean; onClose: () => void; onSave: (data: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({
    title: lead?.title || "",
    customerId: lead?.customerId ? String(lead.customerId) : "",
    column: lead?.column || stage,
    source: lead?.source || "manual",
    expectedValue: String(lead?.expectedValue || 0),
    probability: String(lead?.probability ?? 10),
    owner: lead?.owner || "",
    nextActionAt: lead?.nextActionAt ? String(lead.nextActionAt).slice(0, 16) : "",
    notes: lead?.notes || "",
    lostReason: lead?.lostReason || "",
  });
  const set = (key: string, value: string) => setForm((old) => ({ ...old, [key]: value }));
  const options = customers.map((customer) => ({ value: String(customer.id), label: customer.tradeName || customer.name, detail: [customer.document, customer.whatsapp || customer.phone].filter(Boolean).join(" · "), icon: customer.type === "pj" ? "🏢" : "👤" }));
  return (
    <Modal open onClose={onClose} icon="🎯" title={lead ? "Editar oportunidade" : "Nova oportunidade"} subtitle="Pipeline comercial e próximo passo do relacionamento" size="lg">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Oportunidade" className="sm:col-span-2"><Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex.: 500 tags para evento" /></Field>
        <Field label="Cliente"><SearchCombobox value={form.customerId} onChange={(value) => set("customerId", value)} options={options} placeholder="Buscar cliente..." emptyLabel="— Sem cliente vinculado —" /></Field>
        <Field label="Etapa"><Select value={form.column} onChange={(e) => set("column", e.target.value)}>{STAGES.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</Select></Field>
        <Field label="Origem"><Select value={form.source} onChange={(e) => set("source", e.target.value)}>{SOURCES.map((source) => <option key={source} value={source}>{source}</option>)}</Select></Field>
        <Field label="Responsável"><Input value={form.owner} onChange={(e) => set("owner", e.target.value)} placeholder="Ex.: Tiago" /></Field>
        <Field label="Valor estimado (R$)"><Input type="number" step="0.01" value={form.expectedValue} onChange={(e) => set("expectedValue", e.target.value)} /></Field>
        <Field label="Probabilidade (%)"><Input type="number" min="0" max="100" value={form.probability} onChange={(e) => set("probability", e.target.value)} /></Field>
        <Field label="Próxima ação" className="sm:col-span-2"><Input type="datetime-local" value={form.nextActionAt} onChange={(e) => set("nextActionAt", e.target.value)} /></Field>
        {form.column === "perdido" && <Field label="Motivo da perda" className="sm:col-span-2"><Input value={form.lostReason} onChange={(e) => set("lostReason", e.target.value)} /></Field>}
        <Field label="Anotações" className="sm:col-span-2"><Textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
      </div>
      <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={() => onSave({ ...form, customerId: form.customerId || null, expectedValue: form.expectedValue, probability: Number(form.probability || 0), nextActionAt: form.nextActionAt ? new Date(form.nextActionAt) : null })} disabled={saving || !form.title}>{saving ? "Salvando..." : "Salvar oportunidade"}</Button></div>
    </Modal>
  );
}
