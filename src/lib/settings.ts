import "server-only";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface PricingDefaults {
  taxRate: number; // imposto sobre venda (%)
  operationalRate: number; // custo operacional global para markup divisor (%)
  cardFeeRate: number; // taxa maquininha débito (%)
  cardFeeCreditRate: number; // taxa maquininha crédito (%)
  company_name: string;
  company_document: string;
  company_phone: string;
  company_address: string;
  pix_key: string;
}

const DEFAULTS: PricingDefaults = {
  taxRate: 0.06,
  operationalRate: 0.15,
  cardFeeRate: 0.0199,
  cardFeeCreditRate: 0.0499,
  company_name: "Gráfica VT Digital",
  company_document: "00.000.000/0001-00",
  company_phone: "(00) 0000-0000",
  company_address: "Rua da Impressão, 100 — Centro",
  pix_key: "contato@graficavt.com.br",
};

let cache: PricingDefaults | null = null;

/**
 * Lê configurações do Painel de Controle com fallback para defaults.
 * Cache em memória por processo (revalidate clears em server actions).
 */
export async function getPricingDefaults(): Promise<PricingDefaults> {
  if (cache) return cache;
  try {
    const rows = await db.select().from(settings);
    const map = new Map(rows.map((r) => [r.key, r.value]));
    cache = {
      taxRate: num(map.get("tax_rate"), DEFAULTS.taxRate),
      operationalRate: num(map.get("operational_rate"), DEFAULTS.operationalRate),
      cardFeeRate: num(map.get("card_fee_debit"), DEFAULTS.cardFeeRate),
      cardFeeCreditRate: num(map.get("card_fee_credit"), DEFAULTS.cardFeeCreditRate),
      company_name: map.get("company_name") || DEFAULTS.company_name,
      company_document: map.get("company_document") || DEFAULTS.company_document,
      company_phone: map.get("company_phone") || DEFAULTS.company_phone,
      company_address: map.get("company_address") || DEFAULTS.company_address,
      pix_key: map.get("pix_key") || DEFAULTS.pix_key,
    };
    return cache;
  } catch {
    return DEFAULTS;
  }
}

export function clearSettingsCache() {
  cache = null;
}

const num = (v: string | null | undefined, fallback: number): number => {
  const n = v ? parseFloat(v) : NaN;
  return Number.isFinite(n) ? n / 100 : fallback; // valores guardados em %
};
