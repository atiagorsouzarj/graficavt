"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "@/lib/mutate";
import { Button, Input, Select, Field, Modal, Badge, PageHeader, Textarea } from "@/components/ui";
import { SearchCombobox } from "@/components/SearchCombobox";
import { ClientIdentity } from "@/components/ClientIdentity";
import { formatDate } from "@/lib/format";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

const PRI: Record<string, { label: string; color: "slate" | "blue" | "amber" | "red" }> = {
  baixa: { label: "Baixa", color: "slate" },
  normal: { label: "Normal", color: "blue" },
  alta: { label: "Alta", color: "amber" },
  urgente: { label: "Urgente", color: "red" },
};

export function KanbanBoard({
  cards: initial,
  products,
  customers,
  columns,
}: {
  cards: AnyRow[];
  products: AnyRow[];
  customers: AnyRow[];
  columns: { id: string; title: string; color: string }[];
}) {
  const router = useRouter();
  const [modal, setModal] = useState<null | { col: string; edit?: AnyRow }>(null);
  const [saving, setSaving] = useState(false);
  const [cards, setCards] = useState<AnyRow[]>(initial);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  // sincroniza o estado local quando o servidor devolve dados novos
  useEffect(() => {
    setCards(initial);
  }, [initial]);

  async function moveTo(id: number, column: string) {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, column } : c)));
    try {
      await mutate("kanban", "update", { column }, id);
    } catch {
      // reverte em caso de erro
      router.refresh();
    }
  }

  async function move(id: number, dir: -1 | 1) {
    const card = cards.find((c) => c.id === id);
    if (!card) return;
    const idx = columns.findIndex((c) => c.id === card.column);
    const next = columns[idx + dir];
    if (!next) return;
    await moveTo(id, next.id);
  }

  async function del(id: number) {
    if (!confirm("Excluir card?")) return;
    setCards((prev) => prev.filter((c) => c.id !== id));
    await mutate("kanban", "delete", undefined, id);
    router.refresh();
  }

  function onDragStart(id: number) {
    setDragId(id);
  }
  function onDragOverCol(colId: string, e: React.DragEvent) {
    e.preventDefault();
    setOverCol(colId);
  }
  function onDropCol(colId: string) {
    if (dragId != null) moveTo(dragId, colId);
    setDragId(null);
    setOverCol(null);
  }

  async function save(form: Record<string, string>, col: string, id?: number) {
    setSaving(true);
    try {
      const selectedCustomer = customers.find((c) => String(c.id) === form.customerId);
      const data = {
        title: form.title,
        description: form.description,
        column: col,
        customerId: form.customerId || null,
        customerName: selectedCustomer?.name || form.customerName || null,
        productId: form.productId || null,
        priority: form.priority,
        dueDate: form.dueDate || null,
      };
      if (id) await mutate("kanban", "update", data, id);
      else await mutate("kanban", "create", data);
      setModal(null);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "erro");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Comercial & Produção"
        icon="🗂️"
        title="Kanban de Produção"
        description="Arraste os cards entre etapas. Cada pedido mantém cliente, produto, prazo e prioridade."
      />

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colCards = cards.filter((c) => c.column === col.id);
          const isOver = overCol === col.id;
          return (
            <div
              key={col.id}
              onDragOver={(e) => onDragOverCol(col.id, e)}
              onDragLeave={() => setOverCol((c) => (c === col.id ? null : c))}
              onDrop={() => onDropCol(col.id)}
              className={`w-72 shrink-0 rounded-2xl p-2 transition-colors ${
                isOver ? "bg-cyan-50 ring-2 ring-cyan-300 ring-dashed" : ""
              }`}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                  <h3 className="text-sm font-bold text-slate-700">{col.title}</h3>
                  <span className="rounded-full bg-slate-100 px-1.5 text-xs font-semibold text-slate-500">
                    {colCards.length}
                  </span>
                </div>
                <button
                  onClick={() => setModal({ col: col.id })}
                  className="text-slate-400 hover:text-cyan-600"
                >
                  ＋
                </button>
              </div>
              <div className="space-y-2">
                {colCards.map((c) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => onDragStart(c.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverCol(null);
                    }}
                    className={`cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all active:cursor-grabbing ${
                      dragId === c.id ? "opacity-40" : "hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-semibold text-slate-800">
                        {c.title}
                      </p>
                      <Badge color={(PRI[c.priority]?.color) || "slate"}>
                        {PRI[c.priority]?.label || c.priority}
                      </Badge>
                    </div>
                     {(c.customerId || c.customerName) && (
                       <ClientIdentity
                         customer={
                           customers.find((customer) => customer.id === c.customerId) || {
                             name: c.customerName,
                           }
                         }
                         variant="inline"
                         className="mt-2 border-t border-slate-100 pt-2"
                       />
                     )}
                    {c.description && (
                      <p className="mt-1 text-xs text-slate-400">{c.description}</p>
                    )}
                    {c.dueDate && (
                      <p className="mt-1 text-xs text-amber-600">
                        📅 {formatDate(c.dueDate)}
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => move(c.id, -1)}
                          className="rounded px-1.5 text-slate-400 hover:bg-slate-100"
                        >
                          ←
                        </button>
                        <button
                          onClick={() => move(c.id, 1)}
                          className="rounded px-1.5 text-slate-400 hover:bg-slate-100"
                        >
                          →
                        </button>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setModal({ col: col.id, edit: c })}
                          className="text-xs text-cyan-600 hover:underline"
                        >
                          editar
                        </button>
                        <button
                          onClick={() => del(c.id)}
                          className="text-xs text-rose-600 hover:underline"
                        >
                          excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {colCards.length === 0 && (
                  <button
                    onClick={() => setModal({ col: col.id })}
                    className="w-full rounded-xl border border-dashed border-slate-200 py-4 text-xs text-slate-400 hover:border-cyan-300 hover:text-cyan-500"
                  >
                    ＋ adicionar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <CardModal
          col={modal.col}
          edit={modal.edit}
          products={products}
          customers={customers}
          saving={saving}
          onClose={() => setModal(null)}
          onSave={(f) => save(f, modal.col, modal.edit?.id)}
        />
      )}
    </div>
  );
}

function CardModal({
  col,
  edit,
  products,
  customers,
  saving,
  onClose,
  onSave,
}: {
  col: string;
  edit?: AnyRow;
  products: AnyRow[];
  customers: AnyRow[];
  saving: boolean;
  onClose: () => void;
  onSave: (f: Record<string, string>) => void;
}) {
  const [f, setF] = useState<Record<string, string>>({
    title: edit?.title || "",
    description: edit?.description || "",
    customerId: edit?.customerId ? String(edit.customerId) : "",
    customerName: edit?.customerName || "",
    productId: edit?.productId ? String(edit.productId) : "",
    priority: edit?.priority || "normal",
    dueDate: edit?.dueDate ? String(edit.dueDate).slice(0, 10) : "",
  });
  const set = (k: string, v: string) => setF({ ...f, [k]: v });

  const customerOptions = customers.map((c) => ({
    value: String(c.id),
    label: c.name,
    detail: [c.document, c.whatsapp || c.phone].filter(Boolean).join(" · "),
    icon: c.type === "pj" ? "🏢" : "👤",
  }));
  const productOptions = products.map((p) => ({
    value: String(p.id),
    label: p.name,
    detail: p.sku || `R$ ${Number(p.finalPrice || 0).toFixed(2)}`,
    icon: "🏷️",
  }));

  return (
    <Modal
      open
      onClose={onClose}
      title={edit ? "Editar card de produção" : "Novo card de produção"}
      subtitle={`Etapa inicial: ${col}`}
      icon="🗂️"
      size="lg"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Título do pedido" className="sm:col-span-2">
          <Input
            value={f.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Ex.: 100 cartões de visita — Empresa X"
          />
        </Field>
        <Field label="Cliente">
          <SearchCombobox
            value={f.customerId}
            onChange={(v) => set("customerId", v)}
            options={customerOptions}
            placeholder="Buscar cliente..."
            emptyLabel="— Cliente ainda não cadastrado —"
          />
        </Field>
        <Field label="Produto relacionado">
          <SearchCombobox
            value={f.productId}
            onChange={(v) => set("productId", v)}
            options={productOptions}
            placeholder="Buscar produto..."
            emptyLabel="— Item avulso —"
          />
        </Field>
        {!f.customerId && (
          <Field label="Nome do cliente avulso" className="sm:col-span-2">
            <Input
              value={f.customerName}
              onChange={(e) => set("customerName", e.target.value)}
              placeholder="Digite se ainda não estiver no CRM"
            />
          </Field>
        )}
        <Field label="Prioridade">
          <Select value={f.priority} onChange={(e) => set("priority", e.target.value)}>
            <option value="baixa">Baixa</option>
            <option value="normal">Normal</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </Select>
        </Field>
        <Field label="Prazo">
          <Input type="date" value={f.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
        </Field>
        <Field label="Briefing / observações" className="sm:col-span-2">
          <Textarea
            rows={3}
            value={f.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Arte, acabamento, quantidade, observações de produção..."
          />
        </Field>
      </div>
      <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => onSave(f)} disabled={saving || !f.title}>
          {saving ? "Salvando..." : "Salvar Card"}
        </Button>
      </div>
    </Modal>
  );
}
