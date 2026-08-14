"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { mutate } from "@/lib/mutate";
import {
  computeProduct,
  computeBatchProduct,
  formatMoney,
  type ProductCalcResult,
  type BatchCalcResult,
  type FinishingChargeMode,
} from "@/lib/pricing";
import {
  Button,
  Input,
  Select,
  Field,
  Textarea,
  Card,
  CardHeader,
} from "@/components/ui";
import { SearchCombobox } from "@/components/SearchCombobox";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

interface Props {
  catalog: {
    categories: AnyRow[];
    consumables: AnyRow[];
    printers: AnyRow[];
    materials: AnyRow[];
    finishings: AnyRow[];
    services: AnyRow[];
    formats: AnyRow[];
  };
  productCategories: AnyRow[];
  defaults: { taxRate: number; cardFeeRate: number; operationalRate: number };
  product?: AnyRow | null;
  components: { finishings: { finishingId: number; quantity: string; chargeMode?: string | null; batchSize?: string | null }[]; materials: { materialId: number; quantity: string }[] };
}

export function ProdutoEditor({ catalog, productCategories, defaults, product, components }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<Record<string, string>>({
    name: String(product?.name || ""),
    description: String(product?.description || ""),
    productCategoryId: String(product?.productCategoryId || ""),
    printerId: String(product?.printerId || ""),
    printFormatId: String(product?.printFormatId || ""),
    colorMode: String(product?.colorMode || "mono"),
    pagesPerUnit: String(product?.pagesPerUnit || 1),
    copies: String(product?.copies || 1),
    calculationMode: String(product?.calculationMode || "unit"),
    defaultQuantity: String(product?.defaultQuantity || 1),
    piecesPerSheet: String(product?.piecesPerSheet || 1),
    printSides: String(product?.printSides || 1),
    wastePercent: String(Number(product?.wastePercent || 0) * 100),
    setupSheets: String(product?.setupSheets || 0),
    minOrderQty: String(product?.minOrderQty || 1),
    operationalRate: String((product?.operationalRate !== null && product?.operationalRate !== undefined ? Number(product.operationalRate) : defaults.operationalRate || 0) * 100),
    roundingStep: String(product?.roundingStep || 0.01),
    baseMaterialId: String(product?.baseMaterialId || ""),
    baseMaterialQty: String(product?.baseMaterialQty || 1),
    baseServiceId: String(product?.baseServiceId || ""),
    margin: product?.margin
      ? String(Number(product.margin) * 100)
      : "40",
    taxRate: String((defaults.taxRate || 0.06) * 100),
    cardFeeRate: String((defaults.cardFeeRate || 0.02) * 100),
    trackStock: String(product?.trackStock ?? false),
    stock: String(product?.stock ?? 0),
    minStock: String(product?.minStock ?? 0),
  });

  const [fins, setFins] = useState<{ id: number; quantity: string; chargeMode: FinishingChargeMode; batchSize: string }[]>(
    components.finishings.map((f) => ({
      id: f.finishingId,
      quantity: String(f.quantity || 1),
      chargeMode: (f.chargeMode || "per_piece") as FinishingChargeMode,
      batchSize: String(f.batchSize || 1),
    }))
  );
  const [mats, setMats] = useState<{ id: number; quantity: string }[]>(
    components.materials.map((m) => ({
      id: m.materialId,
      quantity: String(m.quantity || 1),
    }))
  );

  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  const printer = useMemo(
    () => catalog.printers.find((p) => String(p.id) === form.printerId) || null,
    [form.printerId, catalog.printers]
  );
  const category = useMemo(() => {
    const catId = printer?.categoryId;
    return (
      catalog.categories.find((c) => String(c.id) === String(catId)) || null
    );
  }, [printer, catalog.categories]);
  const consForCategory = useMemo(
    () =>
      category
        ? catalog.consumables.filter((c) => c.categoryId === category.id)
        : [],
    [category, catalog.consumables]
  );
  const baseMaterial = useMemo(
    () =>
      catalog.materials.find((m) => String(m.id) === form.baseMaterialId) ||
      null,
    [form.baseMaterialId, catalog.materials]
  );
  const service = useMemo(
    () =>
      catalog.services.find((s) => String(s.id) === form.baseServiceId) ||
      null,
    [form.baseServiceId, catalog.services]
  );
  const selectedFormat = useMemo(
    () => catalog.formats.find((format) => String(format.id) === form.printFormatId) || null,
    [catalog.formats, form.printFormatId]
  );
  const formatOptions = useMemo(
    () => (category ? catalog.formats.filter((format) => format.categoryId === category.id) : []),
    [category, catalog.formats]
  );
  const printerOptions = catalog.printers.map((p) => ({
    value: String(p.id),
    label: p.name,
    detail: `${p.brand || ""} ${p.model || ""} · ${p.maxFormat || p.buildVolume || ""}`.trim(),
    icon: "🖨️",
  }));
  const materialOptions = catalog.materials.map((m) => ({
    value: String(m.id),
    label: m.name,
    detail: `${formatMoney(Number(m.unitCost))}/${m.unit || "un"}`,
    icon: "📦",
  }));
  const serviceOptions = catalog.services.map((s) => ({
    value: String(s.id),
    label: s.name,
    detail: `${formatMoney(Number(s.baseCost || 0))} · ${s.type === "terceirizado" ? "terceirizado" : "próprio"}`,
    icon: "🛠️",
  }));

  const result: ProductCalcResult = useMemo(() => {
    return computeProduct({
      category: category as never,
      consumables: consForCategory as never,
      printer: printer as never,
      colorMode: form.colorMode as "mono" | "color",
      pagesPerUnit: Number(form.pagesPerUnit || 1),
      copies: Number(form.copies || 1),
      baseMaterial: baseMaterial as never,
      baseMaterialQty: Number(form.baseMaterialQty || 0),
      finishings: fins
        .filter((f) => f.id)
        .map((f) => ({
          finishing: (catalog.finishings.find((x) => x.id === f.id) as never) || undefined,
          quantity: Number(f.quantity || 0),
        })),
      extraMaterials: mats
        .filter((m) => m.id)
        .map((m) => ({
          material: (catalog.materials.find((x) => x.id === m.id) as never) || undefined,
          quantity: Number(m.quantity || 0),
        })),
      service: service as never,
      margin: Number(form.margin || 0) / 100,
      taxRate: Number(form.taxRate || 0) / 100,
      cardFeeRate: Number(form.cardFeeRate || 0) / 100,
    });
  }, [category, consForCategory, printer, form, baseMaterial, service, fins, mats, catalog.finishings, catalog.materials]);

  const batchResult: BatchCalcResult = useMemo(() => computeBatchProduct({
    printer: printer as never,
    category: category as never,
    consumables: consForCategory as never,
    format: selectedFormat as never,
    colorMode: form.colorMode as "mono" | "color",
    requestedQuantity: Number(form.defaultQuantity || 0),
    piecesPerSheet: Number(form.piecesPerSheet || 1),
    printSides: Number(form.printSides || 1),
    wastePercent: Number(form.wastePercent || 0) / 100,
    setupSheets: Number(form.setupSheets || 0),
    materialSheetsPerPrintedSheet: Number(form.baseMaterialQty || 1),
    baseMaterial: baseMaterial as never,
    extraMaterials: mats.filter((m) => m.id).map((m) => ({
      material: (catalog.materials.find((x) => x.id === m.id) as never) || undefined,
      quantity: Number(m.quantity || 0),
    })),
    finishings: fins.filter((f) => f.id).map((f) => ({
      finishing: (catalog.finishings.find((x) => x.id === f.id) as never) || undefined,
      quantity: Number(f.quantity || 0),
      chargeMode: f.chargeMode,
      batchSize: Number(f.batchSize || 1),
    })),
    service: service as never,
    operationalRate: Number(form.operationalRate || 0) / 100,
    taxRate: Number(form.taxRate || 0) / 100,
    paymentRate: Number(form.cardFeeRate || 0) / 100,
    profitRate: Number(form.margin || 0) / 100,
    roundingStep: Number(form.roundingStep || 0.01),
  }), [printer, category, consForCategory, selectedFormat, form, baseMaterial, mats, fins, service, catalog.materials, catalog.finishings]);

  const activeFinalPrice = form.calculationMode === "batch" ? batchResult.finalPrice : result.finalPrice;
  const activeDirectCost = form.calculationMode === "batch" ? batchResult.directCost : result.baseCost;

  async function save() {
    setSaving(true);
    try {
      const data = {
        ...form,
        printerId: form.printerId || null,
        printerCategoryId: category?.id || null,
        productCategoryId: form.productCategoryId || null,
        baseMaterialId: form.baseMaterialId || null,
        baseServiceId: form.baseServiceId || null,
        printFormatId: form.printFormatId || null,
        calculationMode: form.calculationMode,
        defaultQuantity: form.defaultQuantity,
        piecesPerSheet: form.piecesPerSheet,
        printSides: Number(form.printSides || 1),
        wastePercent: Number(form.wastePercent || 0) / 100,
        setupSheets: Number(form.setupSheets || 0),
        minOrderQty: form.minOrderQty,
        operationalRate: Number(form.operationalRate || 0) / 100,
        roundingStep: form.roundingStep,
        margin: Number(form.margin || 0) / 100,
        costSnapshot: activeDirectCost.toFixed(4),
        sellPrice: (form.calculationMode === "batch" ? batchResult.finalPrice : result.sellPrice).toFixed(4),
        finalPrice: activeFinalPrice.toFixed(4),
        trackStock: form.trackStock === "true",
        stock: form.stock,
        minStock: form.minStock,
        breakdown: form.calculationMode === "batch"
          ? { mode: "batch", ...batchResult, lines: batchResult.lines }
          : { mode: "unit", ...result, lines: result.lines },
        finishings: fins.filter((f) => f.id),
        materials: mats.filter((m) => m.id),
      };
      if (product?.id) {
        await mutate("products", "update", data, Number(product.id));
      } else {
        await mutate("products", "create", data);
      }
      router.push("/produtos");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/produtos"
            className="text-xs font-medium text-cyan-600 hover:underline"
          >
            ← Voltar para produtos
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {product?.id ? "Editar Produto" : "Novo Produto"}
          </h1>
          <p className="text-sm text-slate-500">
            Calculadora real de custos — cada componente é decomposto.
          </p>
        </div>
        <Button onClick={save} disabled={saving || !form.name}>
          {saving ? "Salvando..." : "💾 Salvar Produto"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Config */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Informações" />
            <div className="grid grid-cols-2 gap-4 p-5">
              <Field label="Nome do produto" className="col-span-2">
                <Input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Ex: Cartão de Visita 4x4"
                />
              </Field>
              <Field label="Categoria do produto" className="col-span-2">
                <Select
                  value={form.productCategoryId}
                  onChange={(e) => set("productCategoryId", e.target.value)}
                >
                  <option value="">— sem categoria —</option>
                  {productCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Modo de precificação" className="col-span-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => set("calculationMode", "unit")}
                    className={`rounded-xl border px-3 py-3 text-left transition-colors ${form.calculationMode === "unit" ? "border-cyan-300 bg-cyan-50 text-cyan-800" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                  >
                    <span className="block text-sm font-bold">🏷️ Unitário</span>
                    <span className="block text-[11px]">Custo e venda por unidade.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => set("calculationMode", "batch")}
                    className={`rounded-xl border px-3 py-3 text-left transition-colors ${form.calculationMode === "batch" ? "border-cyan-300 bg-cyan-50 text-cyan-800" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                  >
                    <span className="block text-sm font-bold">📐 Tiragem / Kit</span>
                    <span className="block text-[11px]">Aproveitamento, folhas inteiras e markup divisor.</span>
                  </button>
                </div>
              </Field>
              <Field label="Descrição" className="col-span-2">
                <Textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </Field>
            </div>
          </Card>

          {/* Printing */}
          <Card>
            <CardHeader
              title="🖨️ Impressão"
              subtitle="Selecione a impressora — a lógica da categoria é aplicada automaticamente"
            />
            <div className="grid grid-cols-2 gap-4 p-5">
              <Field label="Impressora" className="col-span-2">
                <SearchCombobox
                  value={form.printerId}
                  onChange={(value) => set("printerId", value)}
                  options={printerOptions}
                  placeholder="Buscar impressora..."
                  emptyLabel="— Sem impressão —"
                />
              </Field>
               {category && (
                 <div className="col-span-2 rounded-xl bg-cyan-50 px-4 py-2 text-xs text-cyan-700">
                   Categoria: <strong>{category.name}</strong> • {consForCategory.length} consumíveis • formato e cobertura editáveis em Impressoras.
                 </div>
               )}
               <Field label="Formato de produção" className="col-span-2">
                 <Select value={form.printFormatId} onChange={(e) => set("printFormatId", e.target.value)} disabled={!category}>
                   <option value="">— Selecione o formato —</option>
                   {formatOptions.map((format) => (
                     <option key={format.id} value={format.id}>
                       {format.isPhoto ? "📷 " : ""}{format.name} · {format.printCostOverride && Number(format.printCostOverride) > 0 ? `${formatMoney(Number(format.printCostOverride))}/face` : `${Number(format.areaFactor)}× A4`} · {Math.round(Number(format.inkCoverage) * 100)}%
                     </option>
                   ))}
                 </Select>
               </Field>
               <Field label="Cor">
                <Select
                  value={form.colorMode}
                  onChange={(e) => set("colorMode", e.target.value)}
                >
                  <option value="mono">Preto &amp; Branco</option>
                  <option value="color">Colorido</option>
                </Select>
              </Field>
              <Field label="Vias / Cópias">
                <Input
                  type="number"
                  step="0.001"
                  value={form.copies}
                  onChange={(e) => set("copies", e.target.value)}
                />
              </Field>
              <Field label="Páginas por unidade" className="col-span-2">
                <Input
                  type="number"
                  step="0.001"
                  value={form.pagesPerUnit}
                  onChange={(e) => set("pagesPerUnit", e.target.value)}
                />
              </Field>
            </div>
          </Card>

          {form.calculationMode === "batch" && (
            <Card>
              <CardHeader title="📐 Tiragem e Aproveitamento" subtitle="Folhas inteiras com Math.ceil, perda técnica e markup divisor profissional." />
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                <Field label="Quantidade padrão / tiragem">
                  <Input type="number" step="1" value={form.defaultQuantity} onChange={(e) => set("defaultQuantity", e.target.value)} />
                </Field>
                <Field label="Quantidade mínima de venda">
                  <Input type="number" step="1" value={form.minOrderQty} onChange={(e) => set("minOrderQty", e.target.value)} />
                </Field>
                <Field label="Peças aproveitáveis por folha" hint="Ex.: 25 adesivos A3+ ou 10 cartões A4">
                  <Input type="number" step="1" value={form.piecesPerSheet} onChange={(e) => set("piecesPerSheet", e.target.value)} />
                </Field>
                <Field label="Faces impressas">
                  <Select value={form.printSides} onChange={(e) => set("printSides", e.target.value)}><option value="1">1 face (frente)</option><option value="2">2 faces (frente e verso)</option></Select>
                </Field>
                <Field label="Perda técnica (%)" hint="Refugo, provas e ajuste de corte">
                  <Input type="number" step="0.01" value={form.wastePercent} onChange={(e) => set("wastePercent", e.target.value)} />
                </Field>
                <Field label="Folhas extras de setup" hint="O motor usa o maior entre perda e setup">
                  <Input type="number" step="1" value={form.setupSheets} onChange={(e) => set("setupSheets", e.target.value)} />
                </Field>
                <Field label="Operação (%)" hint="Energia, mão de obra indireta, aluguel, gestão">
                  <Input type="number" step="0.01" value={form.operationalRate} onChange={(e) => set("operationalRate", e.target.value)} />
                </Field>
                <Field label="Lucro alvo (%)" hint="Entra no divisor do markup">
                  <Input type="number" step="0.01" value={form.margin} onChange={(e) => set("margin", e.target.value)} />
                </Field>
                <Field label="Impostos (%)"><Input type="number" step="0.01" value={form.taxRate} onChange={(e) => set("taxRate", e.target.value)} /></Field>
                <Field label="Taxa de pagamento (%)" hint="PIX 0%; cartão conforme tabela"><Input type="number" step="0.01" value={form.cardFeeRate} onChange={(e) => set("cardFeeRate", e.target.value)} /></Field>
                <Field label="Arredondar preço para cima (R$)" className="sm:col-span-2">
                  <Select value={form.roundingStep} onChange={(e) => set("roundingStep", e.target.value)}><option value="0.01">R$ 0,01</option><option value="0.1">R$ 0,10</option><option value="0.5">R$ 0,50</option><option value="1">R$ 1,00</option></Select>
                </Field>
                <div className="sm:col-span-2 rounded-xl border border-cyan-100 bg-gradient-to-r from-cyan-50 to-blue-50 p-4 text-xs text-slate-600">
                  <strong className="text-cyan-800">Fórmula ativa:</strong> folhas = max(ceil(qtd ÷ peças/folha × (1 + perda)), folhas base + setup). Preço = custo direto ÷ (1 − operação − imposto − pagamento − lucro).
                </div>
              </div>
            </Card>
          )}

          {/* Materials */}
          <Card>
            <CardHeader title="📦 Materiais e Insumos" subtitle="Papel, vinil, tecido..." />
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Material base">
                  <SearchCombobox
                    value={form.baseMaterialId}
                    onChange={(value) => set("baseMaterialId", value)}
                    options={materialOptions}
                    placeholder="Buscar material..."
                    emptyLabel="— Sem material base —"
                  />
                </Field>
                <Field label="Quantidade base">
                  <Input
                    type="number"
                    step="0.001"
                    value={form.baseMaterialQty}
                    onChange={(e) => set("baseMaterialQty", e.target.value)}
                  />
                </Field>
              </div>

              {mats.map((m, i) => {
                const mat = catalog.materials.find((x) => x.id === m.id);
                return (
                  <div key={i} className="grid grid-cols-12 gap-2">
                    <div className="col-span-7">
                      <Select
                        value={m.id}
                        onChange={(e) =>
                          setMats(
                            mats.map((x, j) =>
                              j === i ? { ...x, id: Number(e.target.value) } : x
                            )
                          )
                        }
                      >
                        <option value="">+ insumo</option>
                        {catalog.materials.map((mm) => (
                          <option key={mm.id} value={mm.id}>
                            {mm.name} ({formatMoney(Number(mm.unitCost))}/{mm.unit})
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="col-span-4">
                      <Input
                        type="number"
                        step="0.001"
                        value={m.quantity}
                        onChange={(e) =>
                          setMats(
                            mats.map((x, j) =>
                              j === i ? { ...x, quantity: e.target.value } : x
                            )
                          )
                        }
                      />
                    </div>
                    <button
                      onClick={() => setMats(mats.filter((_, j) => j !== i))}
                      className="col-span-1 text-rose-500 hover:bg-rose-50 rounded-lg"
                    >
                      ✕
                    </button>
                    {mat && (
                      <p className="col-span-12 -mt-2 text-[11px] text-slate-400">
                        subtotal:{" "}
                        {formatMoney(Number(mat.unitCost) * Number(m.quantity))}
                      </p>
                    )}
                  </div>
                );
              })}
              <button
                onClick={() => setMats([...mats, { id: 0, quantity: "1" }])}
                className="text-xs font-semibold text-cyan-600 hover:underline"
              >
                ＋ adicionar insumo
              </button>
            </div>
          </Card>

          {/* Finishing */}
          <Card>
            <CardHeader title="✂️ Acabamentos" subtitle="Laminadora, guilhotina, encadernação..." />
            <div className="space-y-3 p-5">
              {fins.map((f, i) => {
                const fin = catalog.finishings.find((x) => x.id === f.id);
                return (
                  <div key={i} className="grid grid-cols-12 gap-2">
                    <div className="col-span-7">
                      <Select
                        value={f.id}
                        onChange={(e) =>
                          setFins(
                            fins.map((x, j) =>
                              j === i ? { ...x, id: Number(e.target.value) } : x
                            )
                          )
                        }
                      >
                        <option value="">+ acabamento</option>
                        {catalog.finishings.map((ff) => (
                          <option key={ff.id} value={ff.id}>
                            {ff.name} ({formatMoney(Number(ff.unitCost))}/{ff.unit})
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="col-span-4">
                      <Input
                        type="number"
                        step="0.001"
                        value={f.quantity}
                        onChange={(e) =>
                          setFins(
                            fins.map((x, j) =>
                              j === i ? { ...x, quantity: e.target.value } : x
                            )
                          )
                        }
                      />
                    </div>
                    <button
                      onClick={() => setFins(fins.filter((_, j) => j !== i))}
                      className="col-span-1 text-rose-500 hover:bg-rose-50 rounded-lg"
                    >
                      ✕
                    </button>
                    {form.calculationMode === "batch" ? (
                      <>
                        <div className="col-span-7">
                          <Select
                            value={f.chargeMode}
                            onChange={(e) => setFins(fins.map((x, j) => j === i ? { ...x, chargeMode: e.target.value as FinishingChargeMode } : x))}
                          >
                            <option value="fixed_lot">Fixo por lote</option>
                            <option value="per_piece">Por peça</option>
                            <option value="per_sheet">Por folha</option>
                            <option value="per_kit">Por kit</option>
                            <option value="per_meter">Por metro (consumo/unidade)</option>
                            <option value="per_m2">Por m² (consumo/unidade)</option>
                          </Select>
                        </div>
                        <div className="col-span-4">
                          {f.chargeMode === "per_kit" ? (
                            <Input type="number" step="1" value={f.batchSize} onChange={(e) => setFins(fins.map((x, j) => j === i ? { ...x, batchSize: e.target.value } : x))} placeholder="Un. por kit" />
                          ) : <div className="flex h-10 items-center rounded-xl bg-slate-50 px-3 text-xs text-slate-500">{f.chargeMode === "fixed_lot" ? "1 vez/lote" : "Regra ativa"}</div>}
                        </div>
                        <p className="col-span-12 -mt-1 text-[11px] text-cyan-700">{fin ? `${fin.name}: ${f.chargeMode.replaceAll("_", " ")} × ${f.quantity}` : "Selecione um acabamento"}</p>
                      </>
                    ) : fin && (
                      <p className="col-span-12 -mt-2 text-[11px] text-slate-400">
                        subtotal: {formatMoney(Number(fin.unitCost) * Number(f.quantity))}
                      </p>
                    )}
                  </div>
                );
              })}
              <button
                onClick={() => setFins([...fins, { id: 0, quantity: "1", chargeMode: "per_piece", batchSize: "1" }])}
                className="text-xs font-semibold text-cyan-600 hover:underline"
              >
                ＋ adicionar acabamento
              </button>
            </div>
          </Card>

          {/* Service */}
          <Card>
            <CardHeader title="🛠️ Serviço" subtitle="Logo, design, sublimação..." />
            <div className="p-5">
              <Field label="Serviço vinculado">
                <SearchCombobox
                  value={form.baseServiceId}
                  onChange={(value) => set("baseServiceId", value)}
                  options={serviceOptions}
                  placeholder="Buscar serviço..."
                  emptyLabel="— Sem serviço vinculado —"
                />
              </Field>
            </div>
          </Card>

          {/* Estoque de produto acabado */}
          <Card>
            <CardHeader
              title="📦 Estoque do Produto"
              subtitle="Ative se este produto é fabricado em lote e mantido em estoque (não sob demanda)"
            />
            <div className="p-5">
              <label className="mb-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.trackStock === "true"}
                  onChange={(e) =>
                    set("trackStock", e.target.checked ? "true" : "false")
                  }
                  className="h-4 w-4 rounded accent-cyan-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Controlar estoque deste produto
                </span>
              </label>
              {form.trackStock === "true" && (
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Estoque atual">
                    <Input
                      type="number"
                      step="0.001"
                      value={form.stock}
                      onChange={(e) => set("stock", e.target.value)}
                    />
                  </Field>
                  <Field label="Estoque mínimo">
                    <Input
                      type="number"
                      step="0.001"
                      value={form.minStock}
                      onChange={(e) => set("minStock", e.target.value)}
                    />
                  </Field>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Calculator panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-cyan-600 to-violet-600 p-5 text-white">
                <p className="text-xs uppercase tracking-wide text-cyan-100">
                  {form.calculationMode === "batch" ? `Preço da tiragem (${batchResult.requestedQuantity} un.)` : "Preço final por unidade"}
                </p>
                <p className="mt-1 text-4xl font-black">
                  {formatMoney(activeFinalPrice)}
                </p>
                <p className="mt-1 text-xs text-cyan-100">
                  {form.calculationMode === "batch"
                    ? `${formatMoney(batchResult.unitPrice)} por unidade · ${batchResult.finalSheets} folha(s)`
                    : `Venda: ${formatMoney(result.sellPrice)} • Margem ${formatMoney(result.marginAmount)}`}
                </p>
              </div>
              {form.calculationMode === "batch" ? (
                <div className="divide-y divide-slate-100">
                  {!batchResult.valid && <p className="bg-rose-50 px-5 py-3 text-xs font-semibold text-rose-700">⚠️ {batchResult.error}</p>}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 px-5 py-3 text-xs"><div><p className="text-slate-400">Folhas base</p><p className="font-extrabold text-slate-700">{batchResult.baseSheets}</p></div><div><p className="text-slate-400">Folhas finais</p><p className="font-extrabold text-cyan-700">{batchResult.finalSheets}</p></div><div><p className="text-slate-400">Por perda</p><p className="font-bold text-slate-600">{batchResult.sheetsByWaste}</p></div><div><p className="text-slate-400">Por setup</p><p className="font-bold text-slate-600">{batchResult.sheetsBySetup}</p></div></div>
                  {batchResult.lines.map((line, i) => <div key={i} className="px-5 py-2.5"><div className="flex justify-between gap-3 text-sm"><span className="text-slate-600">{line.label}</span><span className="shrink-0 font-semibold text-slate-800">{formatMoney(line.amount)}</span></div>{line.detail && <p className="mt-0.5 text-[11px] text-slate-400">{line.detail}</p>}</div>)}
                  <div className="bg-slate-50 px-5 py-3"><div className="flex justify-between text-sm font-bold"><span>Custo Direto (CD)</span><span>{formatMoney(batchResult.directCost)}</span></div><p className="mt-1 text-[11px] text-slate-400">Divisor: 1 − {((batchResult.rateTotal || 0) * 100).toFixed(2)}% = {batchResult.divisor.toFixed(4)}</p></div>
                  <div className="space-y-1 px-5 py-3 text-xs"><div className="flex justify-between text-slate-500"><span>Operação</span><span>{formatMoney(batchResult.operationalAmount)}</span></div><div className="flex justify-between text-slate-500"><span>Impostos</span><span>{formatMoney(batchResult.taxAmount)}</span></div><div className="flex justify-between text-slate-500"><span>Taxa pagamento</span><span>{formatMoney(batchResult.paymentAmount)}</span></div><div className="flex justify-between text-emerald-700"><span>Lucro líquido alvo</span><span>{formatMoney(batchResult.profitAmount)}</span></div><div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-sm font-extrabold text-cyan-700"><span>Preço final da tiragem</span><span>{formatMoney(batchResult.finalPrice)}</span></div></div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {result.lines.length === 0 && <p className="px-5 py-6 text-center text-xs text-slate-400">Adicione componentes para ver o cálculo.</p>}
                  {result.lines.map((line, i) => <div key={i} className="px-5 py-2.5"><div className="flex justify-between text-sm"><span className="text-slate-600">{line.label}</span><span className="font-medium text-slate-800">{formatMoney(line.amount)}</span></div>{line.detail && <p className="text-[11px] text-slate-400">{line.detail}</p>}</div>)}
                  <div className="bg-slate-50 px-5 py-2.5"><div className="flex justify-between text-sm font-semibold"><span className="text-slate-700">Custo base</span><span className="text-slate-800">{formatMoney(result.baseCost)}</span></div></div>
                  <div className="grid grid-cols-2 gap-3 p-5"><Field label="Margem (%)"><Input type="number" step="0.01" value={form.margin} onChange={(e) => set("margin", e.target.value)} /></Field><Field label="Venda"><div className="flex h-10 items-center rounded-xl bg-slate-100 px-3 text-sm font-semibold text-slate-700">{formatMoney(result.sellPrice)}</div></Field><Field label="Impostos (%)"><Input type="number" step="0.01" value={form.taxRate} onChange={(e) => set("taxRate", e.target.value)} /></Field><Field label="Taxa maquininha (%)"><Input type="number" step="0.01" value={form.cardFeeRate} onChange={(e) => set("cardFeeRate", e.target.value)} /></Field></div>
                  <div className="space-y-1 px-5 pb-5 text-xs"><div className="flex justify-between text-slate-500"><span>Impostos</span><span>{formatMoney(result.taxAmount)}</span></div><div className="flex justify-between text-slate-500"><span>Taxa maquininha</span><span>{formatMoney(result.cardFeeAmount)}</span></div><div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-cyan-700"><span>Preço final</span><span>{formatMoney(result.finalPrice)}</span></div></div>
                </div>
              )}
            </Card>

            <Button onClick={save} disabled={saving || !form.name} className="w-full">
              {saving ? "Salvando..." : "💾 Salvar Produto"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
