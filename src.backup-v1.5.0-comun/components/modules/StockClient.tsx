"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Select,
  Field,
  Modal,
  Badge,
  Card,
  CardHeader,
  PageHeader,
  Stat,
  EmptyState,
} from "@/components/ui";
import { formatMoney, formatDateTime } from "@/lib/format";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

const REASONS = {
  entrada: [
    { value: "compra", label: "Compra de fornecedor" },
    { value: "devolucao", label: "Devolução de cliente" },
    { value: "ajuste", label: "Ajuste de inventário" },
    { value: "producao", label: "Produção interna" },
  ],
  saida: [
    { value: "venda", label: "Venda (PDV/Orçamento)" },
    { value: "perda", label: "Perda / avaria" },
    { value: "producao", label: "Consumo em produção" },
    { value: "ajuste", label: "Ajuste de inventário" },
  ],
};

export function StockClient({
  materials,
  products,
  movements,
}: {
  materials: AnyRow[];
  products: AnyRow[];
  movements: AnyRow[];
}) {
  const router = useRouter();
  const [modal, setModal] = useState<null | "entrada" | "saida">(null);
  const [filter, setFilter] = useState<"todos" | "material" | "product">("todos");

  const lowStockMaterials = materials.filter(
    (m) => Number(m.stock) <= Number(m.minStock || 0)
  );
  const lowStockProducts = products.filter(
    (p) => Number(p.stock) <= Number(p.minStock || 0)
  );
  const stockValue = materials.reduce(
    (s, m) => s + Number(m.stock) * Number(m.unitCost),
    0
  );

  const filteredMovements = useMemo(() => {
    if (filter === "todos") return movements;
    return movements.filter((m) => m.targetType === filter);
  }, [movements, filter]);

  function targetName(mv: AnyRow) {
    if (mv.targetType === "material") {
      return materials.find((m) => m.id === mv.materialId)?.name || "—";
    }
    return products.find((p) => p.id === mv.productId)?.name || "—";
  }

  return (
    <div>
      <PageHeader
        eyebrow="Catálogo & Produção"
        icon="📥"
        title="Estoque — Entradas e Saídas"
        description="Controle automatizado: vendas baixam estoque sozinhas; compras você registra aqui."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setModal("entrada")}>
              ⬇️ Entrada
            </Button>
            <Button variant="danger" onClick={() => setModal("saida")}>
              ⬆️ Saída
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Valor em estoque"
          value={formatMoney(stockValue)}
          icon="💰"
          accent="emerald"
          trend={`${materials.length} materiais`}
        />
        <Stat
          label="Materiais críticos"
          value={lowStockMaterials.length}
          icon="⚠️"
          accent="rose"
          trend="Abaixo do mínimo"
        />
        <Stat
          label="Produtos críticos"
          value={lowStockProducts.length}
          icon="📦"
          accent="amber"
          trend={`${products.length} rastreados`}
        />
        <Stat
          label="Movimentações"
          value={movements.length}
          icon="🔄"
          accent="cyan"
          trend="Últimos 200 registros"
        />
      </div>

      {(lowStockMaterials.length > 0 || lowStockProducts.length > 0) && (
        <Card className="mt-6">
          <CardHeader title="⚠️ Reposição necessária" />
          <div className="divide-y divide-slate-50">
            {lowStockMaterials.map((m) => (
              <div
                key={`m${m.id}`}
                className="flex items-center justify-between px-5 py-2.5"
              >
                <span className="text-sm font-medium text-slate-700">
                  📦 {m.name}
                </span>
                <Badge color="red">
                  {Number(m.stock)} / mín {Number(m.minStock)} {m.unit}
                </Badge>
              </div>
            ))}
            {lowStockProducts.map((p) => (
              <div
                key={`p${p.id}`}
                className="flex items-center justify-between px-5 py-2.5"
              >
                <span className="text-sm font-medium text-slate-700">
                  🏷️ {p.name}
                </span>
                <Badge color="amber">
                  {Number(p.stock)} / mín {Number(p.minStock)} un
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader
          title="🔄 Movimentações recentes"
          action={
            <div className="flex gap-1.5">
              {(["todos", "material", "product"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    filter === f
                      ? "bg-cyan-500 text-white"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {f === "todos" ? "Todos" : f === "material" ? "Materiais" : "Produtos"}
                </button>
              ))}
            </div>
          }
        />
        {filteredMovements.length === 0 ? (
          <EmptyState icon="🔄" title="Nenhuma movimentação ainda" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[11px] uppercase text-slate-500">
                  <th className="px-4 py-2.5 font-bold">Data</th>
                  <th className="px-4 py-2.5 font-bold">Item</th>
                  <th className="px-4 py-2.5 font-bold">Tipo</th>
                  <th className="px-4 py-2.5 font-bold">Motivo</th>
                  <th className="px-4 py-2.5 text-right font-bold">Qtd.</th>
                  <th className="px-4 py-2.5 font-bold">Origem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredMovements.map((mv) => (
                  <tr key={mv.id} className="hover:bg-cyan-50/30">
                    <td className="px-4 py-2.5 text-slate-500">
                      {formatDateTime(mv.createdAt)}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-700">
                      {targetName(mv)}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge color={mv.kind === "entrada" ? "green" : mv.kind === "saida" ? "red" : "slate"}>
                        {mv.kind}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{mv.reason}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-700">
                      {Number(mv.quantity)}
                    </td>
                    <td className="px-4 py-2.5">
                      {mv.automatic ? (
                        <Badge color="cyan">🤖 automático</Badge>
                      ) : (
                        <Badge color="slate">manual</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modal && (
        <MovementModal
          kind={modal}
          materials={materials}
          products={products}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function MovementModal({
  kind,
  materials,
  products,
  onClose,
  onDone,
}: {
  kind: "entrada" | "saida";
  materials: AnyRow[];
  products: AnyRow[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [targetType, setTargetType] = useState<"material" | "product">("material");
  const [targetId, setTargetId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("0");
  const [reason, setReason] = useState(REASONS[kind][0].value);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const options = targetType === "material" ? materials : products;

  async function save() {
    if (!targetId || Number(quantity) <= 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/crud/stock-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op: "create",
          data: { kind, targetType, targetId, quantity, unitCost, reason, reference, notes },
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "erro");
      onDone();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao registrar movimento");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      icon={kind === "entrada" ? "⬇️" : "⬆️"}
      title={kind === "entrada" ? "Registrar Entrada" : "Registrar Saída"}
      subtitle="Atualiza o saldo automaticamente"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setTargetType("material");
              setTargetId("");
            }}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
              targetType === "material"
                ? "border-cyan-300 bg-cyan-50 text-cyan-700"
                : "border-slate-200 text-slate-500"
            }`}
          >
            📦 Material
          </button>
          <button
            onClick={() => {
              setTargetType("product");
              setTargetId("");
            }}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
              targetType === "product"
                ? "border-cyan-300 bg-cyan-50 text-cyan-700"
                : "border-slate-200 text-slate-500"
            }`}
          >
            🏷️ Produto
          </button>
        </div>

        <Field label={targetType === "material" ? "Material" : "Produto"}>
          <Select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
            <option value="">Selecione...</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} (atual: {Number(o.stock)} {o.unit || "un"})
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Quantidade">
            <Input
              type="number"
              step="0.001"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </Field>
          <Field label="Custo unitário (R$)" hint="Opcional — para entrada de compra">
            <Input
              type="number"
              step="0.0001"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Motivo">
          <Select value={reason} onChange={(e) => setReason(e.target.value)}>
            {REASONS[kind].map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Referência" hint="Número da nota, pedido ou venda">
          <Input value={reference} onChange={(e) => setReference(e.target.value)} />
        </Field>

        <Field label="Observações">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>

      <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={save} disabled={saving || !targetId}>
          {saving ? "Salvando..." : "Confirmar"}
        </Button>
      </div>
    </Modal>
  );
}
