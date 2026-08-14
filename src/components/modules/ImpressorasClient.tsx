"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "@/lib/mutate";
import {
  categoryCostPerPage,
  consumableCostPerPage,
  formatMoney,
} from "@/lib/pricing";
import {
  Button,
  Input,
  Select,
  Field,
  Modal,
  Badge,
  Textarea,
  PageHeader,
  InfoBanner,
  Card,
} from "@/components/ui";
import { FormatModal } from "@/components/modules/FormatModal";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

const SLUG = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const MODE_LABEL: Record<string, string> = {
  pagina: "por folha",
  etiqueta: "por etiqueta",
  grama: "por grama",
};

export function ImpressorasClient({
  categories: cats,
  consumables,
  printers,
  formats,
}: {
  categories: AnyRow[];
  consumables: AnyRow[];
  printers: AnyRow[];
  formats: AnyRow[];
}) {
  const router = useRouter();
  const [catModal, setCatModal] = useState<null | { edit?: AnyRow }>(null);
  const [consModal, setConsModal] = useState<null | {
    categoryId: number;
    edit?: AnyRow;
  }>(null);
  const [prtModal, setPrtModal] = useState<null | {
    categoryId: number;
    mode: string;
    edit?: AnyRow;
  }>(null);
  const [formatModal, setFormatModal] = useState<null | {
    categoryId: number;
    mode: string;
    edit?: AnyRow;
  }>(null);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(
    cats.length ? cats[0].id : null
  );

  const refresh = () => router.refresh();

  async function saveCat(form: Record<string, string>, id?: number) {
    setSaving(true);
    try {
      const data = {
        name: form.name,
        description: form.description,
        icon: form.icon,
        color: form.color,
        measureMode: form.measureMode,
        unitLabel: form.unitLabel,
        slug: SLUG(form.name),
        fixedCostPerPage: Number(form.fixedCostPerPage || 0).toFixed(6),
        referenceCoverage: (Number(form.referenceCoverage || 5) / 100).toFixed(4),
        wasteFactor: (Number(form.wasteFactor || 0) / 100).toFixed(4),
        defaultMargin: (Number(form.defaultMargin || 0) / 100).toFixed(4),
      };
      if (id) await mutate("categories", "update", data, id);
      else await mutate("categories", "create", data);
      setCatModal(null);
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "erro");
    } finally {
      setSaving(false);
    }
  }

  async function saveCons(
    form: Record<string, string>,
    categoryId: number,
    id?: number
  ) {
    setSaving(true);
    try {
      const data = {
        categoryId,
        name: form.name,
        unitCost: Number(form.unitCost || 0).toFixed(4),
        yieldPages: Number(form.yieldPages || 0),
        appliesTo: form.appliesTo,
        costRole: form.costRole || "colorant",
      };
      if (id) await mutate("consumables", "update", data, id);
      else await mutate("consumables", "create", data);
      setConsModal(null);
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "erro");
    } finally {
      setSaving(false);
    }
  }

  async function savePrt(
    form: Record<string, string>,
    categoryId: number,
    id?: number
  ) {
    setSaving(true);
    try {
      const data = {
        categoryId,
        name: form.name,
        brand: form.brand,
        model: form.model,
        status: form.status,
        costMultiplier: Number(form.costMultiplier || 1).toFixed(4),
        maxFormat: form.maxFormat || null,
        buildVolume: form.buildVolume || null,
      };
      if (id) await mutate("printers", "update", data, id);
      else await mutate("printers", "create", data);
      setPrtModal(null);
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "erro");
    } finally {
      setSaving(false);
    }
  }

  async function saveFormat(
    form: Record<string, string>,
    categoryId: number,
    id?: number
  ) {
    setSaving(true);
    try {
      const data = {
        categoryId,
        name: form.name,
        widthMm: String(Number(form.widthMm || 0)),
        heightMm: String(Number(form.heightMm || 0)),
        areaFactor: String(Number(form.areaFactor || 1)),
        inkCoverage: String(Number(form.inkCoverage || 0) / 100),
        printCostOverride: String(Number(form.printCostOverride || 0)),
        isPhoto: form.isPhoto === "true",
      };
      if (id) await mutate("print-formats", "update", data, id);
      else await mutate("print-formats", "create", data);
      setFormatModal(null);
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "erro");
    } finally {
      setSaving(false);
    }
  }

  async function delFormat(id: number) {
    if (!confirm("Excluir formato?")) return;
    await mutate("print-formats", "delete", undefined, id);
    refresh();
  }

  async function delCat(id: number) {
    if (!confirm("Excluir categoria e todos os seus consumíveis/impressoras?"))
      return;
    await mutate("categories", "delete", undefined, id);
    refresh();
  }
  async function delCons(id: number) {
    if (!confirm("Excluir consumível?")) return;
    await mutate("consumables", "delete", undefined, id);
    refresh();
  }
  async function delPrt(id: number) {
    if (!confirm("Excluir impressora?")) return;
    await mutate("printers", "delete", undefined, id);
    refresh();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Cálculo de suprimentos e mecânica"
        title="Impressoras & Tintas"
        icon="🖨️"
        description="A categoria define a lógica de custo. A impressora herda essa lógica com um fator de ajuste."
        action={<Button onClick={() => setCatModal({})}>＋ Nova Categoria</Button>}
      />

      <InfoBanner icon="⚙️">
        <strong>Como funciona:</strong> cada categoria tem um{" "}
        <em>modo de medição</em> — Laser/Jato/Sublimação medem{" "}
        <strong>por folha</strong>, Térmica <strong>por etiqueta</strong> (ribbon
        + rolo) e 3D <strong>por grama</strong> de filamento (sem formato de
        papel).
      </InfoBanner>

      <div className="space-y-4">
        {cats.map((cat) => {
          const cons = consumables.filter((c) => c.categoryId === cat.id);
          const prts = printers.filter((p) => p.categoryId === cat.id);
          const fmts = formats.filter((f) => f.categoryId === cat.id);
          const mono = categoryCostPerPage(cat, cons, "mono");
          const colorCost = categoryCostPerPage(cat, cons, "color");
          const colorHex = cat.color || "#06b6d4";
          const mode = cat.measureMode || "pagina";
          const unit = cat.unitLabel || "folha";
          const isOpen = expanded === cat.id;

          return (
            <Card key={cat.id} className="overflow-hidden">
              {/* Header */}
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
                <button
                  onClick={() => setExpanded(isOpen ? null : cat.id)}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl shadow-sm"
                    style={{ background: `${colorHex}18` }}
                  >
                    {cat.icon || "🖨️"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-800">
                        {cat.name}
                      </h2>
                      <Badge color="cyan">{MODE_LABEL[mode]}</Badge>
                    </div>
                    {cat.description && (
                      <p className="truncate text-xs text-slate-500">
                        {cat.description}
                      </p>
                    )}
                  </div>
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="rounded-xl bg-slate-50 px-3 py-1.5 text-center ring-1 ring-slate-100">
                    <p className="text-[9px] font-bold uppercase text-slate-400">
                      P&amp;B / {unit}
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {formatMoney(mono)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-cyan-50 px-3 py-1.5 text-center ring-1 ring-cyan-100">
                    <p className="text-[9px] font-bold uppercase text-cyan-600">
                      Colorido / {unit}
                    </p>
                    <p className="text-sm font-bold text-cyan-700">
                      {formatMoney(colorCost)}
                    </p>
                  </div>
                  <button
                    onClick={() => setCatModal({ edit: cat })}
                    className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-500 hover:bg-slate-50"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => delCat(cat.id)}
                    className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-rose-500 hover:bg-rose-50"
                  >
                    🗑️
                  </button>
                  <button
                    onClick={() => setExpanded(isOpen ? null : cat.id)}
                    className="rounded-lg px-2 py-2 text-slate-400 hover:bg-slate-50"
                  >
                    {isOpen ? "▲" : "▼"}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  {/* Consumíveis */}
                  <div className="border-b border-slate-100 p-5 lg:border-b-0 lg:border-r">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Consumíveis ({cons.length})
                      </h3>
                      <button
                        onClick={() => setConsModal({ categoryId: cat.id })}
                        className="text-xs font-bold text-cyan-600 hover:underline"
                      >
                        ＋ adicionar
                      </button>
                    </div>
                    {cons.length === 0 ? (
                      <p className="py-6 text-center text-xs text-slate-400">
                        Sem consumíveis cadastrados.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 text-left text-[10px] uppercase text-slate-400">
                              <th className="pb-1.5 font-bold">Item</th>
                              <th className="pb-1.5 font-bold">Preço</th>
                              <th className="pb-1.5 font-bold">Rend.</th>
                              <th className="pb-1.5 font-bold">R$/{unit}</th>
                              <th />
                            </tr>
                          </thead>
                          <tbody>
                            {cons.map((c) => (
                              <tr
                                key={c.id}
                                className="border-b border-slate-50 hover:bg-slate-50/50"
                              >
                                <td className="py-2 pr-2 font-medium text-slate-700">
                                  {c.name}
                                  <span className="ml-1 rounded bg-slate-100 px-1 text-[9px] text-slate-500">
                                    {c.appliesTo}
                                  </span>
                                </td>
                                <td className="py-2 text-slate-600">
                                  {formatMoney(Number(c.unitCost))}
                                </td>
                                <td className="py-2 text-slate-600">
                                  {Number(c.yieldPages).toLocaleString("pt-BR")}
                                </td>
                                <td className="py-2 font-bold text-cyan-600">
                                  {formatMoney(consumableCostPerPage(c))}
                                </td>
                                <td className="py-2 text-right whitespace-nowrap">
                                  <button
                                    onClick={() =>
                                      setConsModal({
                                        categoryId: cat.id,
                                        edit: c,
                                      })
                                    }
                                    className="text-slate-400 hover:text-cyan-600"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => delCons(c.id)}
                                    className="ml-1 text-slate-300 hover:text-rose-500"
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Impressoras + Formatos */}
                  <div className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Impressoras ({prts.length})
                      </h3>
                      <button
                        onClick={() =>
                          setPrtModal({ categoryId: cat.id, mode })
                        }
                        className="text-xs font-bold text-cyan-600 hover:underline"
                      >
                        ＋ adicionar
                      </button>
                    </div>
                    {prts.length === 0 ? (
                      <p className="py-6 text-center text-xs text-slate-400">
                        Sem impressoras.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {prts.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-700">
                                {p.name}
                              </p>
                              <p className="truncate text-[11px] text-slate-400">
                                {p.brand} ·{" "}
                                {mode === "grama"
                                  ? p.buildVolume || "volume não definido"
                                  : p.maxFormat}{" "}
                                · ×{Number(p.costMultiplier)}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                              <Badge
                                color={
                                  p.status === "ativa"
                                    ? "green"
                                    : p.status === "manutencao"
                                    ? "amber"
                                    : "red"
                                }
                              >
                                {p.status}
                              </Badge>
                              <button
                                onClick={() =>
                                  setPrtModal({
                                    categoryId: cat.id,
                                    mode,
                                    edit: p,
                                  })
                                }
                                className="text-slate-400 hover:text-cyan-600"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => delPrt(p.id)}
                                className="text-slate-300 hover:text-rose-500"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Formatos editáveis */}
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                          {mode === "grama"
                            ? "Faixas de peso"
                            : mode === "etiqueta"
                            ? "Tamanhos de etiqueta"
                            : "Formatos"}
                        </h3>
                        <button
                          onClick={() => setFormatModal({ categoryId: cat.id, mode })}
                          className="text-xs font-bold text-cyan-600 hover:underline"
                        >
                          ＋ formato
                        </button>
                      </div>
                      {fmts.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-400">
                          Nenhum formato cadastrado.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {fmts.map((f) => (
                            <span
                              key={f.id}
                              className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200"
                              title={
                                mode === "grama"
                                  ? `${Number(f.areaFactor)}g`
                                  : `Área ${Number(f.areaFactor)}× A4 · Tinta ${Math.round(
                                      Number(f.inkCoverage) * 100
                                    )}%`
                              }
                            >
                              {f.isPhoto && "📷"} {f.name}
                              {mode !== "grama" && (
                                <span className="text-slate-400">
                                  {Math.round(Number(f.inkCoverage) * 100)}%
                                </span>
                              )}
                              <button
                                onClick={() => setFormatModal({ categoryId: cat.id, mode, edit: f })}
                                className="ml-0.5 text-slate-400 hover:text-cyan-600"
                              >
                                ✏️
                              </button>
                              <button onClick={() => delFormat(f.id)} className="text-slate-300 hover:text-rose-500">×</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {catModal && (
        <CategoryModal
          initial={catModal.edit}
          saving={saving}
          onClose={() => setCatModal(null)}
          onSave={saveCat}
        />
      )}
      {consModal && (
        <ConsumableModal
          initial={consModal.edit}
          unit={
            cats.find((c) => c.id === consModal.categoryId)?.unitLabel || "folha"
          }
          saving={saving}
          onClose={() => setConsModal(null)}
          onSave={(f) => saveCons(f, consModal.categoryId, consModal.edit?.id)}
        />
      )}
      {prtModal && (
        <PrinterModal
          initial={prtModal.edit}
          mode={prtModal.mode}
          saving={saving}
          onClose={() => setPrtModal(null)}
          onSave={(f) => savePrt(f, prtModal.categoryId, prtModal.edit?.id)}
        />
      )}
      {formatModal && (
        <FormatModal
          initial={formatModal.edit}
          mode={formatModal.mode}
          saving={saving}
          onClose={() => setFormatModal(null)}
          onSave={(f) => saveFormat(f, formatModal.categoryId, formatModal.edit?.id)}
        />
      )}
    </div>
  );
}

/* ----------------- Category modal ----------------- */
function CategoryModal({
  initial,
  saving,
  onClose,
  onSave,
}: {
  initial?: AnyRow;
  saving: boolean;
  onClose: () => void;
  onSave: (f: Record<string, string>, id?: number) => void;
}) {
  const [f, setF] = useState<Record<string, string>>({
    name: initial?.name || "",
    description: initial?.description || "",
    icon: initial?.icon || "🖨️",
    color: initial?.color || "#06b6d4",
    measureMode: initial?.measureMode || "pagina",
    unitLabel: initial?.unitLabel || "folha",
    fixedCostPerPage: String(Number(initial?.fixedCostPerPage || 0)),
    referenceCoverage: String(Number(initial?.referenceCoverage ?? 0.05) * 100),
    wasteFactor: String(Number(initial?.wasteFactor || 0) * 100),
    defaultMargin: String(Number(initial?.defaultMargin || 0.4) * 100),
  });
  const set = (k: string, v: string) => setF({ ...f, [k]: v });
  return (
    <Modal
      open
      onClose={onClose}
      icon="🖨️"
      title={initial ? "Editar Categoria" : "Nova Categoria"}
      subtitle="A categoria manda na lógica de precificação"
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nome" className="col-span-2">
          <Input value={f.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Descrição" className="col-span-2">
          <Textarea
            rows={2}
            value={f.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>
        <Field label="Modo de medição" hint="Como o custo é calculado">
          <Select
            value={f.measureMode}
            onChange={(e) => {
              const v = e.target.value;
              setF({
                ...f,
                measureMode: v,
                unitLabel:
                  v === "grama" ? "grama" : v === "etiqueta" ? "etiqueta" : "folha",
              });
            }}
          >
            <option value="pagina">Por folha (Laser / Jato / Sublimação)</option>
            <option value="etiqueta">Por etiqueta (Térmica)</option>
            <option value="grama">Por grama (3D)</option>
          </Select>
        </Field>
        <Field label="Unidade exibida">
          <Input
            value={f.unitLabel}
            onChange={(e) => set("unitLabel", e.target.value)}
          />
        </Field>
        <Field label="Ícone (emoji)">
          <Input value={f.icon} onChange={(e) => set("icon", e.target.value)} />
        </Field>
        <Field label="Cor">
          <input
            type="color"
            value={f.color}
            onChange={(e) => set("color", e.target.value)}
            className="h-10 w-full cursor-pointer rounded-xl border border-slate-200"
          />
        </Field>
        <Field
          label="Custo fixo por unidade (R$)"
          hint="Energia + manutenção + depreciação"
        >
          <Input
            type="number"
            step="0.000001"
            value={f.fixedCostPerPage}
            onChange={(e) => set("fixedCostPerPage", e.target.value)}
          />
        </Field>
        <Field label="Cobertura de referência (%)" hint="Laser normalmente 5%; foto/sublimação 100%">
          <Input
            type="number"
            step="0.01"
            value={f.referenceCoverage}
            onChange={(e) => set("referenceCoverage", e.target.value)}
          />
        </Field>
        <Field label="Fator de perda (%)" hint="Resíduos, provas, refugo">
          <Input
            type="number"
            step="0.01"
            value={f.wasteFactor}
            onChange={(e) => set("wasteFactor", e.target.value)}
          />
        </Field>
        <Field label="Margem padrão (%)" className="col-span-2">
          <Input
            type="number"
            step="0.01"
            value={f.defaultMargin}
            onChange={(e) => set("defaultMargin", e.target.value)}
          />
        </Field>
      </div>
      <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={() => onSave(f, initial?.id)} disabled={saving || !f.name}>
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </Modal>
  );
}

/* ----------------- Consumable modal ----------------- */
function ConsumableModal({
  initial,
  unit,
  saving,
  onClose,
  onSave,
}: {
  initial?: AnyRow;
  unit: string;
  saving: boolean;
  onClose: () => void;
  onSave: (f: Record<string, string>) => void;
}) {
  const [f, setF] = useState<Record<string, string>>({
    name: initial?.name || "",
    unitCost: String(Number(initial?.unitCost || 0)),
    yieldPages: String(initial?.yieldPages || 0),
    appliesTo: initial?.appliesTo || "both",
    costRole: initial?.costRole || "colorant",
  });
  const set = (k: string, v: string) => setF({ ...f, [k]: v });
  const perUnit =
    Number(f.unitCost || 0) / Math.max(Number(f.yieldPages || 1), 1);
  return (
    <Modal
      open
      onClose={onClose}
      icon="🧪"
      title={initial ? "Editar Consumível" : "Novo Consumível"}
      subtitle={`Rendimento medido em ${unit}s`}
    >
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Nome"
          className="col-span-2"
          hint="Ex: Toner Preto TN321K, Cilindro DR-512K, Ribbon Resina"
        >
          <Input value={f.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Preço de compra (R$)">
          <Input
            type="number"
            step="0.0001"
            value={f.unitCost}
            onChange={(e) => set("unitCost", e.target.value)}
          />
        </Field>
        <Field label={`Rendimento (${unit}s)`} hint={`Quantas ${unit}s rende`}>
          <Input
            type="number"
            value={f.yieldPages}
            onChange={(e) => set("yieldPages", e.target.value)}
          />
        </Field>
        <Field label="Aplica-se a">
          <Select
            value={f.appliesTo}
            onChange={(e) => set("appliesTo", e.target.value)}
          >
            <option value="both">P&amp;B e Colorido</option>
            <option value="mono">Apenas P&amp;B</option>
            <option value="color">Apenas Colorido</option>
          </Select>
        </Field>
        <Field label="Tipo de custo" hint="Colorante varia com cobertura; mecânico não">
          <Select value={f.costRole} onChange={(e) => set("costRole", e.target.value)}>
            <option value="colorant">Colorante (toner, tinta, resina)</option>
            <option value="mechanical">Mecânico (cilindro, fusora, manutenção)</option>
          </Select>
        </Field>
      </div>
      <div className="mt-4 rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 p-4 text-center ring-1 ring-cyan-100">
        <p className="text-[11px] font-bold uppercase text-cyan-600">
          Custo por {unit}
        </p>
        <p className="text-2xl font-extrabold text-cyan-700">
          {formatMoney(perUnit)}
        </p>
      </div>
      <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={() => onSave(f)} disabled={saving || !f.name}>
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </Modal>
  );
}

/* ----------------- Printer modal ----------------- */
function PrinterModal({
  initial,
  mode,
  saving,
  onClose,
  onSave,
}: {
  initial?: AnyRow;
  mode: string;
  saving: boolean;
  onClose: () => void;
  onSave: (f: Record<string, string>) => void;
}) {
  const is3D = mode === "grama";
  const [f, setF] = useState<Record<string, string>>({
    name: initial?.name || "",
    brand: initial?.brand || "",
    model: initial?.model || "",
    status: initial?.status || "ativa",
    costMultiplier: String(Number(initial?.costMultiplier || 1)),
    maxFormat: initial?.maxFormat || "A4",
    buildVolume: initial?.buildVolume || "",
  });
  const set = (k: string, v: string) => setF({ ...f, [k]: v });
  return (
    <Modal
      open
      onClose={onClose}
      icon="🖨️"
      title={initial ? "Editar Impressora" : "Nova Impressora"}
      subtitle="Herda a lógica de custo da categoria"
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nome / Modelo" className="col-span-2">
          <Input
            value={f.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder={is3D ? "Ex: Creality Ender 3 V3" : "Ex: Konica C284-e"}
          />
        </Field>
        <Field label="Marca">
          <Input value={f.brand} onChange={(e) => set("brand", e.target.value)} />
        </Field>
        <Field label="Modelo detalhado">
          <Input value={f.model} onChange={(e) => set("model", e.target.value)} />
        </Field>
        <Field
          label="Fator de custo (×)"
          hint="1 = igual à categoria · 1.2 = 20% mais caro"
        >
          <Input
            type="number"
            step="0.01"
            value={f.costMultiplier}
            onChange={(e) => set("costMultiplier", e.target.value)}
          />
        </Field>
        {is3D ? (
          <Field
            label="Volume de construção"
            hint="3D não tem formato de papel"
          >
            <Input
              value={f.buildVolume}
              onChange={(e) => set("buildVolume", e.target.value)}
              placeholder="220 × 220 × 250 mm"
            />
          </Field>
        ) : (
          <Field label="Formato máximo">
            <Select
              value={f.maxFormat}
              onChange={(e) => set("maxFormat", e.target.value)}
            >
              {["A6", "A5", "A4", "A3", "A3+", "110mm", "Rolo"].map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Status" className="col-span-2">
          <Select value={f.status} onChange={(e) => set("status", e.target.value)}>
            <option value="ativa">Ativa</option>
            <option value="manutencao">Em Manutenção</option>
            <option value="inativa">Inativa</option>
          </Select>
        </Field>
      </div>
      <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={() => onSave(f)} disabled={saving || !f.name}>
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </Modal>
  );
}
