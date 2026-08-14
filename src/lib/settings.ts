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
  company_legal_name: string;
  company_trade_name: string;
  company_document: string;
  company_email: string;
  company_phone: string;
  company_whatsapp: string;
  company_address: string;
  pix_key: string;
  fiscal_environment: string;
  fiscal_tax_regime: string;
}

const DEFAULTS: PricingDefaults = {
  taxRate: 0.06,
  operationalRate: 0.15,
  cardFeeRate: 0.0199,
  cardFeeCreditRate: 0.0499,
  company_name: "Gráfica VT Digital",
  company_legal_name: "Gráfica VT Digital",
  company_trade_name: "Gráfica VT Digital",
  company_document: "00.000.000/0001-00",
  company_email: "contato@graficavt.com.br",
  company_phone: "(00) 0000-0000",
  company_whatsapp: "",
  company_address: "Rua da Impressão, 100 — Centro",
  pix_key: "contato@graficavt.com.br",
  fiscal_environment: "homologacao",
  fiscal_tax_regime: "simples",
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
    const legalName = map.get("company_legal_name") || map.get("company_name") || DEFAULTS.company_legal_name;
    const tradeName = map.get("company_trade_name") || map.get("company_name") || legalName;
    const structuredAddress = [
      map.get("company_street") && `${map.get("company_street")}${map.get("company_number") ? `, ${map.get("company_number")}` : ""}`,
      map.get("company_complement"),
      map.get("company_district"),
      [map.get("company_city"), map.get("company_state")].filter(Boolean).join(" / "),
      map.get("company_cep") && `CEP ${map.get("company_cep")}`,
    ].filter(Boolean).join(" — ");
    cache = {
      taxRate: num(map.get("tax_rate"), DEFAULTS.taxRate),
      operationalRate: num(map.get("operational_rate"), DEFAULTS.operationalRate),
      cardFeeRate: num(map.get("card_fee_debit"), DEFAULTS.cardFeeRate),
      cardFeeCreditRate: num(map.get("card_fee_credit"), DEFAULTS.cardFeeCreditRate),
      company_name: tradeName,
      company_legal_name: legalName,
      company_trade_name: tradeName,
      company_document: map.get("company_cnpj") || map.get("company_document") || DEFAULTS.company_document,
      company_email: map.get("company_email") || DEFAULTS.company_email,
      company_phone: map.get("company_phone") || DEFAULTS.company_phone,
      company_whatsapp: map.get("company_whatsapp") || DEFAULTS.company_whatsapp,
      company_address: structuredAddress || map.get("company_address") || DEFAULTS.company_address,
      pix_key: map.get("pix_key") || DEFAULTS.pix_key,
      fiscal_environment: map.get("fiscal_environment") || DEFAULTS.fiscal_environment,
      fiscal_tax_regime: map.get("fiscal_tax_regime") || DEFAULTS.fiscal_tax_regime,
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
