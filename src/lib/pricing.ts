/**
 * ====================================================================
 *  MOTOR DE PRECIFICAÇÃO — Gráfica Rápida & Papelaria Personalizada
 * ====================================================================
 *
 *  Fluxo do motor:
 *
 *    Categoria (Laser / Jato de Tinta / Térmica / 3D / Sublimação / DTF)
 *        │  possui lógica de custo por página (consumíveis + custo fixo)
 *        ▼
 *    Impressora (Konica C284-e, L18050...)  → herda a categoria, com fator
 *        │
 *        ▼
 *    PRODUTO =  Impressão  +  Material/Insumo  +  Acabamento  +  Serviço
 *               ───────────────────────────────────────────────────────
 *               custo base  →  margem  →  preço de venda
 *                            →  impostos  →  taxa de maquininha  →  preço final
 *
 *  Tudo é decomposto (breakdown) para total transparência na calculadora.
 * ==================================================================== */

/** Tabela de preços (DTF UV, DTF Textil, Lona, Adesivo) */
export interface PricingTableRow {
  id: number;
  type: string;         // dtf_uv, dtf_textil, lona, adesivo
  label: string;
  unitCost: string | number | null;
  unit?: string | null;
}

/**
 * Para categorias Térmica: o cálculo é diferente.
 * Ribbon (custo por metro consumido) + rolo de etiqueta (custo por unidade).
 * ribbonLengthMeters = 76m padrão, labelMetersPerUnit = metros de ribbon usados por etiqueta
 */
export function thermalCostPerLabel(
  ribbonCost: number,
  ribbonLengthMeters: number,   // ex: 76m
  labelRollCost: number,        // custo do rolo de etiquetas (ex: R$60)
  labelRollQty: number,         // quantidade de etiquetas no rolo (ex: 1000)
  labelsPerMeter: number        // etiquetas por metro de ribbon (ex: 50x50mm ~20/m)
): number {
  const ribbonCostPerMeter = ribbonCost / ribbonLengthMeters;
  const ribbonCostPerLabel = ribbonCostPerMeter / labelsPerMeter;
  const labelCostEach = labelRollCost / labelRollQty;
  return ribbonCostPerLabel + labelCostEach;
}

/** Tipos estruturais mínimos — desacoplados do schema (duck typing). */
export interface ConsumableLike {
  unitCost?: string | number | null;
  yieldPages?: string | number | null;
  appliesTo?: string | null;
}
export interface CategoryLike {
  fixedCostPerPage?: string | number | null;
  wasteFactor?: string | number | null;
  measureMode?: string | null;
  unitLabel?: string | null;
}
export interface PrinterLike {
  costMultiplier?: string | number | null;
}
export interface MaterialLike {
  name?: string | null;
  unit?: string | null;
  unitCost: string | number | null;
}
export interface FinishingLike {
  name?: string | null;
  unit?: string | null;
  unitCost: string | number | null;
}
export interface ServiceLike {
  name?: string | null;
  baseCost: string | number | null;
  type?: string | null;
}

const num = (v: unknown, fallback = 0): number => {
  if (v === null || v === undefined || v === "") return fallback;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
};

export type ColorMode = "mono" | "color";

/** Custo de um único consumível por página/impressão. */
export function consumableCostPerPage(c: ConsumableLike): number {
  const yieldPages = num(c.yieldPages, 0);
  if (yieldPages <= 0) return 0;
  return num(c.unitCost) / yieldPages;
}

/**
 * Custo de página da CATEGORIA.
 *  mono  = soma consumíveis mono/both  + custo fixo
 *  color = soma consumíveis color/both + custo fixo
 * Aplica fator de perda (waste) — resíduos/prova.
 */
export function categoryCostPerPage(
  category: CategoryLike,
  consumables: ConsumableLike[],
  mode: ColorMode = "color"
): number {
  const consumableTotal = consumables
    .filter((c) => {
      if (mode === "mono") return c.appliesTo === "mono" || c.appliesTo === "both";
      return c.appliesTo === "color" || c.appliesTo === "both";
    })
    .reduce((sum, c) => sum + consumableCostPerPage(c), 0);

  const fixed = num(category.fixedCostPerPage);
  const waste = num(category.wasteFactor); // ex: 0.05 = 5%
  return (consumableTotal + fixed) * (1 + waste);
}

/**
 * Custo de página de uma IMPRESSORA.
 * Herda a lógica da categoria e aplica um fator multiplicador
 * (máquina mais velha/insumo importado etc.).
 */
export function printerCostPerPage(
  printer: PrinterLike,
  category: CategoryLike,
  consumables: ConsumableLike[],
  mode: ColorMode = "color"
): number {
  const base = categoryCostPerPage(category, consumables, mode);
  return base * num(printer.costMultiplier, 1);
}

export interface FinishingLine {
  finishing?: FinishingLike;
  quantity: number;
}
export interface MaterialLine {
  material?: MaterialLike;
  quantity: number;
}

export interface ProductCalcInput {
  category?: CategoryLike | null;
  consumables: ConsumableLike[];
  printer?: PrinterLike | null;
  colorMode: ColorMode;
  pagesPerUnit: number; // páginas/impressões por unidade de produto
  copies: number; // vias/copias por unidade
  baseMaterial?: MaterialLike | null;
  baseMaterialQty: number;
  finishings: FinishingLine[];
  extraMaterials: MaterialLine[];
  service?: ServiceLike | null;
  margin: number; // margem sobre o preço (0..1)
  taxRate: number; // impostos sobre venda (0..1)
  cardFeeRate: number; // taxa maquininha (0..1)
}

export interface BreakdownLine {
  label: string;
  detail?: string;
  amount: number;
}

export interface ProductCalcResult {
  lines: BreakdownLine[];
  printing: number;
  materials: number;
  finishing: number;
  service: number;
  baseCost: number;
  marginAmount: number;
  sellPrice: number; // preço de venda (com margem, antes de taxas extras)
  taxAmount: number;
  cardFeeAmount: number;
  finalPrice: number; // preço final ao cliente
  unitPrice: number;
}

/**
 * Calculadora real do produto.
 * Decomposição completa — cada centavo é justificado.
 */
export function computeProduct(input: ProductCalcInput): ProductCalcResult {
  const lines: BreakdownLine[] = [];

  // 1) IMPRESSÃO -----------------------------------------------------
  let printing = 0;
  if (input.printer && input.category) {
    const perPage = printerCostPerPage(
      input.printer,
      input.category,
      input.consumables,
      input.colorMode
    );
    printing = perPage * num(input.pagesPerUnit) * num(input.copies);
    lines.push({
      label: "Impressão",
      detail: `${num(input.copies)} via(s) × ${num(input.pagesPerUnit)} pg × ${formatMoney(
        perPage
      )}/pg (${input.colorMode === "color" ? "colorido" : "P&B"})`,
      amount: printing,
    });
  } else if (input.category) {
    const perPage = categoryCostPerPage(
      input.category,
      input.consumables,
      input.colorMode
    );
    printing = perPage * num(input.pagesPerUnit) * num(input.copies);
    lines.push({
      label: "Impressão (categoria)",
      detail: `${num(input.copies)} via(s) × ${num(input.pagesPerUnit)} pg × ${formatMoney(
        perPage
      )}/pg`,
      amount: printing,
    });
  }

  // 2) MATERIAL / INSUMO BASE --------------------------------------
  let materials = 0;
  if (input.baseMaterial) {
    const m = num(input.baseMaterial.unitCost) * num(input.baseMaterialQty);
    materials += m;
    lines.push({
      label: `Material: ${input.baseMaterial.name}`,
      detail: `${num(input.baseMaterialQty)} ${input.baseMaterial.unit} × ${formatMoney(
        num(input.baseMaterial.unitCost)
      )}`,
      amount: m,
    });
  }

  // 3) ACABAMENTOS --------------------------------------------------
  let finishing = 0;
  for (const fl of input.finishings) {
    if (!fl.finishing) continue;
    const v = num(fl.finishing.unitCost) * num(fl.quantity);
    finishing += v;
    lines.push({
      label: `Acabamento: ${fl.finishing.name}`,
      detail: `${num(fl.quantity)} ${fl.finishing.unit} × ${formatMoney(
        num(fl.finishing.unitCost)
      )}`,
      amount: v,
    });
  }

  // 4) MATERIAIS EXTRAS --------------------------------------------
  for (const ml of input.extraMaterials) {
    if (!ml.material) continue;
    const v = num(ml.material.unitCost) * num(ml.quantity);
    materials += v;
    lines.push({
      label: `Insumo: ${ml.material.name}`,
      detail: `${num(ml.quantity)} ${ml.material.unit} × ${formatMoney(
        num(ml.material.unitCost)
      )}`,
      amount: v,
    });
  }

  // 5) SERVIÇO ------------------------------------------------------
  let serviceCost = 0;
  if (input.service) {
    serviceCost = num(input.service.baseCost);
    lines.push({
      label: `Serviço: ${input.service.name}`,
      detail: input.service.type === "terceirizado" ? "Terceirizado" : "Próprio",
      amount: serviceCost,
    });
  }

  const baseCost = printing + materials + finishing + serviceCost;

  // 6) MARGEM -------------------------------------------------------
  // preço de venda = baseCost / (1 - margin)
  const margin = Math.min(Math.max(num(input.margin), 0), 0.99);
  const sellPrice = baseCost > 0 ? baseCost / (1 - margin) : 0;
  const marginAmount = sellPrice - baseCost;

  // 7) IMPOSTOS + TAXA DE MAQUININHA (sobre o preço de venda) -------
  const taxAmount = sellPrice * num(input.taxRate);
  const cardFeeAmount = sellPrice * num(input.cardFeeRate);
  const finalPrice = sellPrice + taxAmount + cardFeeAmount;

  return {
    lines,
    printing,
    materials,
    finishing,
    service: serviceCost,
    baseCost,
    marginAmount,
    sellPrice,
    taxAmount,
    cardFeeAmount,
    finalPrice,
    unitPrice: finalPrice,
  };
}

export function formatMoney(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(v) ? v : 0);
}
