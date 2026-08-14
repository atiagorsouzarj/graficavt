"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mutate } from "@/lib/mutate";
import { ClientIdentity } from "@/components/ClientIdentity";
import { Badge, Button, Card, CardHeader, Field, Input, Modal, PageHeader, Select, Textarea } from "@/components/ui";
import { formatDate, formatMoney } from "@/lib/format";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

const color: Record<string, "slate" | "blue" | "green" | "amber" | "red" | "cyan"> = { aberto:"blue", confirmado:"cyan", concluido:"green", cancelado:"red", aguardando:"slate", em_producao:"blue", pronto:"cyan", entregue:"green", nao_enviada:"slate", pendente:"amber", aprovado:"green", revisao:"red", recusado:"red" };

export function OrderDetail({ detail, customer }: { detail: AnyRow; customer: AnyRow | null }) {
  const router = useRouter();
  const { order, approvals, delivery, schedule } = detail;
  const [artModal, setArtModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const items = Array.isArray(order.items) ? order.items : [];

  async function update(patch: Record<string, unknown>) {
    setSaving(true);
    try { await mutate("orders", "update", patch, order.id); router.refresh(); } catch (e) { alert(e instanceof Error ? e.message : "Erro ao atualizar pedido."); } finally { setSaving(false); }
  }
  async function setApproval(id: number, status: string) {
    setSaving(true);
    try { await mutate("art-approvals", "update", { status, approvedAt: status === "aprovado" ? new Date() : null }, id); router.refresh(); } catch (e) { alert(e instanceof Error ? e.message : "Erro ao atualizar aprovação."); } finally { setSaving(false); }
  }

  return <div>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><Link href="/pedidos" className="text-xs font-bold text-cyan-600 hover:underline">← Voltar para Pedidos</Link><div className="flex gap-2"><Button variant="outline" onClick={() => window.print()}>🖨️ Imprimir OS</Button><Button onClick={() => update({ status: "concluido", productionStatus: "pronto" })} disabled={saving}>✓ Concluir pedido</Button></div></div>
    <PageHeader eyebrow="Pedido operacional" icon="📋" title={order.number} description={`Criado em ${formatDate(order.createdAt)} · Orçamento ${order.quoteId ? `#${order.quoteId}` : "avulso"}`} />
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_.75fr]">
      <div className="space-y-6">
        <Card><CardHeader title="Cliente" /> <div className="p-5">{customer ? <ClientIdentity customer={customer} variant="card" /> : <p className="text-sm text-slate-400">Consumidor final</p>}</div></Card>
        <Card><CardHeader title="Itens do pedido" /><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-slate-50 text-left text-[11px] uppercase text-slate-500"><th className="px-4 py-3">Descrição</th><th className="px-4 py-3 text-center">Qtd.</th><th className="px-4 py-3 text-right">Unit.</th><th className="px-4 py-3 text-right">Total</th></tr></thead><tbody className="divide-y divide-slate-50">{items.map((item: AnyRow, i: number) => <tr key={i}><td className="px-4 py-3 font-medium text-slate-700">{item.description}</td><td className="px-4 py-3 text-center">{item.quantity}</td><td className="px-4 py-3 text-right">{formatMoney(Number(item.unitPrice))}</td><td className="px-4 py-3 text-right font-bold">{formatMoney(Number(item.total))}</td></tr>)}</tbody></table></div><div className="flex justify-end bg-slate-50 px-5 py-4"><span className="text-sm text-slate-500">Total do pedido</span><span className="ml-5 text-xl font-extrabold text-cyan-700">{formatMoney(Number(order.total))}</span></div></Card>
        <Card><CardHeader title="🎨 Aprovação de Arte" action={<Button size="sm" onClick={() => setArtModal(true)}>＋ Nova arte</Button>} /><div className="divide-y divide-slate-100">{approvals.length === 0 ? <p className="px-5 py-10 text-center text-sm text-slate-400">Nenhuma arte enviada. Produção não deve iniciar sem aprovação quando necessário.</p> : approvals.map((art: AnyRow) => <div key={art.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><p className="text-sm font-bold text-slate-700">{art.fileName} <span className="text-xs text-slate-400">v{art.version}</span></p>{art.fileUrl && <a href={art.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-cyan-600 hover:underline">Abrir arquivo →</a>}{art.clientComment && <p className="mt-1 text-xs text-slate-500">Cliente: {art.clientComment}</p>}</div><div className="flex items-center gap-2"><Badge color={color[art.status] || "slate"}>{art.status}</Badge>{art.status === "pendente" && <><button onClick={() => setApproval(art.id, "aprovado")} className="text-xs font-bold text-emerald-600 hover:underline">Aprovar</button><button onClick={() => setApproval(art.id, "revisao")} className="text-xs font-bold text-rose-600 hover:underline">Solicitar revisão</button></>}</div></div>)}</div></Card>
      </div>
      <div className="space-y-6">
        <Card><CardHeader title="Status do pedido" /><div className="space-y-4 p-5"><Field label="Comercial"><Select value={order.status} onChange={(e) => update({ status: e.target.value })} disabled={saving}><option value="aberto">Aberto</option><option value="confirmado">Confirmado</option><option value="concluido">Concluído</option><option value="cancelado">Cancelado</option></Select></Field><Field label="Produção"><Select value={order.productionStatus} onChange={(e) => update({ productionStatus: e.target.value })} disabled={saving}><option value="aguardando">Aguardando</option><option value="em_producao">Em produção</option><option value="pronto">Pronto</option><option value="entregue">Entregue</option></Select></Field><Field label="Prioridade"><Select value={order.priority} onChange={(e) => update({ priority: e.target.value })} disabled={saving}><option value="baixa">Baixa</option><option value="normal">Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option></Select></Field><Field label="Prazo"><Input type="date" value={order.dueDate || ""} onChange={(e) => update({ dueDate: e.target.value || null })} /></Field></div></Card>
        <Card><CardHeader title="🚚 Entrega / Retirada" /><div className="space-y-3 p-5"><p className="text-sm font-bold text-slate-700">{delivery?.method || "A definir"}</p><Badge color={color[delivery?.status] || "slate"}>{delivery?.status || "aguardando"}</Badge>{delivery?.scheduledAt && <p className="text-xs text-slate-500">Agendada: {formatDate(delivery.scheduledAt)}</p>}<Link href="/entregas" className="block text-xs font-bold text-cyan-600 hover:underline">Gerenciar entrega →</Link></div></Card>
        <Card><CardHeader title="🗓️ Agenda de Produção" /><div className="p-5">{schedule.length === 0 ? <p className="text-sm text-slate-400">Ainda não agendado.</p> : schedule.map((s: AnyRow) => <div key={s.id} className="mb-2 rounded-xl bg-slate-50 p-3"><p className="text-sm font-bold text-slate-700">{s.title}</p><p className="text-xs text-slate-500">{formatDate(s.scheduledDate)} · {s.startTime} · {s.estimatedMinutes} min</p></div>)}<Link href="/agenda-producao" className="mt-2 block text-xs font-bold text-cyan-600 hover:underline">Agendar produção →</Link></div></Card>
      </div>
    </div>
    {artModal && <ArtModal orderId={order.id} nextVersion={approvals.length + 1} onClose={() => setArtModal(false)} onSaved={() => { setArtModal(false); router.refresh(); }} />}
  </div>;
}

function ArtModal({ orderId, nextVersion, onClose, onSaved }: { orderId: number; nextVersion: number; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ fileName: "", fileUrl: "", internalNote: "" });
  const [saving, setSaving] = useState(false);
  const set = (key: string, value: string) => setForm((old) => ({ ...old, [key]: value }));
  async function save() { setSaving(true); try { await mutate("art-approvals", "create", { orderId, fileName: form.fileName, fileUrl: form.fileUrl || null, internalNote: form.internalNote || null, version: nextVersion, status: "pendente" }); onSaved(); } catch (e) { alert(e instanceof Error ? e.message : "Erro ao registrar arte."); } finally { setSaving(false); } }
  return <Modal open onClose={onClose} icon="🎨" title="Enviar versão para aprovação" subtitle="Registre nome e link do arquivo; armazenamento pode ser integrado depois."><div className="space-y-4"><Field label="Nome do arquivo"><Input value={form.fileName} onChange={(e) => set("fileName", e.target.value)} placeholder="cartao-visita-v1.pdf" /></Field><Field label="Link do arquivo"><Input value={form.fileUrl} onChange={(e) => set("fileUrl", e.target.value)} placeholder="https://drive.google.com/..." /></Field><Field label="Nota interna"><Textarea rows={3} value={form.internalNote} onChange={(e) => set("internalNote", e.target.value)} /></Field></div><div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={save} disabled={saving || !form.fileName}>{saving ? "Salvando..." : "Enviar para aprovação"}</Button></div></Modal>;
}
