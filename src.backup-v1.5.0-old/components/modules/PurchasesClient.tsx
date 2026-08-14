"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SearchCombobox } from "@/components/SearchCombobox";
import { Badge, Button, Card, CardHeader, Field, Input, Modal, PageHeader, Textarea } from "@/components/ui";
import { formatDate, formatMoney } from "@/lib/format";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;
type Line = { materialId: string; quantity: string; unitCost: string };

export function PurchasesClient({ suppliers, purchases, materials }: { suppliers: AnyRow[]; purchases: AnyRow[]; materials: AnyRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [receiving, setReceiving] = useState<number | null>(null);

  async function receive(id: number) {
    if (!confirm("Confirmar recebimento? Os materiais serão adicionados ao estoque.")) return;
    setReceiving(id);
    try {
      const res = await fetch("/api/purchases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "receive", purchaseId: id }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao receber compra.");
      router.refresh();
    } catch (e) { alert(e instanceof Error ? e.message : "Erro ao receber compra."); } finally { setReceiving(null); }
  }

  return <div>
    <PageHeader eyebrow="Compras & Estoque" icon="🛒" title="Compras" description="Crie pedidos de compra e receba materiais diretamente no estoque." action={<div className="flex gap-2"><Link href="/fornecedores"><Button variant="outline">🚚 Fornecedores</Button></Link><Button onClick={() => setOpen(true)}>＋ Nova Compra</Button></div>} />
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4"><Summary label="Rascunhos" value={purchases.filter((p) => p.status === "rascunho").length} color="slate" /><Summary label="Aguardando recebimento" value={purchases.filter((p) => ["pedido", "parcial"].includes(p.status)).length} color="amber" /><Summary label="Recebidas" value={purchases.filter((p) => p.status === "recebido").length} color="green" /><Summary label="Total em pedidos" value={formatMoney(purchases.filter((p) => p.status !== "cancelado").reduce((sum, p) => sum + Number(p.total || 0), 0))} color="cyan" /></div>
    <Card className="mt-6 overflow-hidden"><CardHeader title="Pedidos de compra" subtitle="O recebimento cria uma entrada automática para cada material." />{purchases.length === 0 ? <div className="px-5 py-12 text-center text-sm text-slate-400">Nenhuma compra registrada.</div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-slate-50 text-left text-[11px] uppercase text-slate-500"><th className="px-4 py-3">Compra</th><th className="px-4 py-3">Fornecedor</th><th className="px-4 py-3">Previsão</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3" /></tr></thead><tbody className="divide-y divide-slate-50">{purchases.map((purchase) => { const supplier = suppliers.find((s) => s.id === purchase.supplierId); return <tr key={purchase.id} className="hover:bg-cyan-50/30"><td className="px-4 py-3"><p className="font-bold text-slate-700">{purchase.number}</p><p className="text-[11px] text-slate-400">{Array.isArray(purchase.items) ? purchase.items.length : 0} itens</p></td><td className="px-4 py-3 text-slate-600">{supplier?.tradeName || supplier?.name || "—"}</td><td className="px-4 py-3 text-slate-500">{purchase.expectedDate ? formatDate(purchase.expectedDate) : "—"}</td><td className="px-4 py-3"><Badge color={purchase.status === "recebido" ? "green" : purchase.status === "pedido" ? "amber" : "slate"}>{purchase.status}</Badge></td><td className="px-4 py-3 text-right font-bold text-cyan-700">{formatMoney(Number(purchase.total))}</td><td className="px-4 py-3 text-right">{purchase.status !== "recebido" && purchase.status !== "cancelado" && <button disabled={receiving === purchase.id} onClick={() => receive(purchase.id)} className="text-xs font-bold text-emerald-600 hover:underline">{receiving === purchase.id ? "Recebendo..." : "↓ Receber"}</button>}</td></tr>; })}</tbody></table></div>}</Card>
    {open && <PurchaseModal suppliers={suppliers} materials={materials} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); router.refresh(); }} />}
  </div>;
}

function Summary({ label, value, color }: { label: string; value: string | number; color: "slate" | "amber" | "green" | "cyan" }) { const styles = { slate: "border-slate-200 bg-slate-50", amber: "border-amber-100 bg-amber-50", green: "border-emerald-100 bg-emerald-50", cyan: "border-cyan-100 bg-cyan-50" }; return <div className={`rounded-2xl border p-4 ${styles[color]}`}><p className="text-[11px] font-bold uppercase text-slate-500">{label}</p><p className="mt-1 text-xl font-extrabold text-slate-800">{value}</p></div>; }

function PurchaseModal({ suppliers, materials, onClose, onSaved }: { suppliers: AnyRow[]; materials: AnyRow[]; onClose: () => void; onSaved: () => void }) {
  const [supplierId, setSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [freight, setFreight] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([{ materialId: "", quantity: "1", unitCost: "0" }]);
  const [saving, setSaving] = useState(false);
  const supplierOptions = suppliers.filter((s) => s.active).map((s) => ({ value: String(s.id), label: s.tradeName || s.name, detail: [s.document, s.whatsapp || s.phone].filter(Boolean).join(" · "), icon: "🚚" }));
  const materialOptions = materials.map((m) => ({ value: String(m.id), label: m.name, detail: `${formatMoney(Number(m.unitCost))}/${m.unit}`, icon: "📦" }));
  const subtotal = lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unitCost || 0), 0);
  const total = subtotal + Number(freight || 0) - Number(discount || 0);
  function setLine(i: number, patch: Partial<Line>) { setLines((all) => all.map((line, index) => index === i ? { ...line, ...patch } : line)); }
  async function save() { const items = lines.filter((line) => line.materialId && Number(line.quantity) > 0).map((line) => ({ materialId: Number(line.materialId), quantity: Number(line.quantity), unitCost: Number(line.unitCost), label: materials.find((m) => String(m.id) === line.materialId)?.name })); if (!items.length) return alert("Inclua ao menos um material."); setSaving(true); try { const res = await fetch("/api/purchases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "create", data: { supplierId: supplierId || null, status: "pedido", items, freight, discount, expectedDate, notes } }) }); const json = await res.json(); if (!res.ok) throw new Error(json.error || "Erro ao salvar compra."); onSaved(); } catch (e) { alert(e instanceof Error ? e.message : "Erro ao salvar compra."); } finally { setSaving(false); } }
  return <Modal open onClose={onClose} icon="🛒" title="Nova compra" subtitle="Ao receber, os itens entram no estoque automaticamente." size="xl"><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="Fornecedor" className="sm:col-span-2"><SearchCombobox value={supplierId} onChange={setSupplierId} options={supplierOptions} placeholder="Buscar fornecedor..." emptyLabel="— Sem fornecedor —" /></Field><Field label="Previsão de entrega"><Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} /></Field><Field label="Frete (R$)"><Input type="number" step="0.01" value={freight} onChange={(e) => setFreight(e.target.value)} /></Field></div><div className="mt-5"><div className="mb-2 flex items-center justify-between"><p className="text-xs font-bold uppercase text-slate-500">Materiais</p><button onClick={() => setLines((all) => [...all, { materialId: "", quantity: "1", unitCost: "0" }])} className="text-xs font-bold text-cyan-600 hover:underline">＋ Material</button></div><div className="space-y-2">{lines.map((line, i) => <div key={i} className="grid grid-cols-[1fr_90px_110px_30px] gap-2"><SearchCombobox value={line.materialId} onChange={(value) => { const mat = materials.find((m) => String(m.id) === value); setLine(i, { materialId: value, unitCost: mat ? String(mat.unitCost) : line.unitCost }); }} options={materialOptions} placeholder="Buscar material..." emptyLabel="Material" /><Input type="number" step="0.001" value={line.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} /><Input type="number" step="0.0001" value={line.unitCost} onChange={(e) => setLine(i, { unitCost: e.target.value })} /><button onClick={() => setLines((all) => all.filter((_, index) => index !== i))} className="rounded-lg text-rose-500 hover:bg-rose-50">×</button></div>)}</div></div><div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="Desconto (R$)"><Input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} /></Field><Field label="Total"><div className="flex h-10 items-center rounded-xl bg-cyan-50 px-3 text-lg font-extrabold text-cyan-700">{formatMoney(total)}</div></Field><Field label="Observações" className="sm:col-span-2"><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field></div><div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Criar pedido de compra"}</Button></div></Modal>;
}
