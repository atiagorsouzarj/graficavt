import { db } from "@/db";
import { settings } from "@/db/schema";
import { ConfigPanel } from "@/components/modules/ConfigPanel";

export const dynamic = "force-dynamic";

export default async function ConfigPage() {
  const rows = await db.select().from(settings);
  const values: Record<string, string> = {};
  for (const r of rows) values[r.key] = r.value ?? "";

  // defaults sensíveis
  const defaults: Record<string, string> = {
    // Empresa e endereço
    company_name: "Gráfica VT Digital",
    company_legal_name: "",
    company_trade_name: "",
    company_cnpj: "",
    company_document: "",
    company_email: "",
    company_phone: "",
    company_whatsapp: "",
    company_website: "",
    company_logo_url: "",
    company_cep: "",
    company_street: "",
    company_number: "",
    company_complement: "",
    company_district: "",
    company_city: "",
    company_state: "",
    company_country: "Brasil",
    company_address: "",
    pix_key: "",
    // Fiscal e NF
    fiscal_environment: "homologacao",
    fiscal_nfe_enabled: "false",
    fiscal_nfce_enabled: "false",
    fiscal_nfse_enabled: "false",
    fiscal_state_registration: "",
    fiscal_municipal_registration: "",
    fiscal_cnae: "",
    fiscal_legal_nature: "",
    fiscal_tax_regime: "simples",
    fiscal_service_municipality: "",
    fiscal_series_nfe: "1",
    fiscal_next_nfe: "1",
    fiscal_series_nfce: "1",
    fiscal_next_nfce: "1",
    fiscal_provider: "manual",
    fiscal_certificate_type: "nenhum",
    fiscal_certificate_path: "",
    fiscal_certificate_expiration: "",
    fiscal_csc_id: "",
    fiscal_csc_token: "",
    fiscal_webhook_url: "",
    fiscal_notes: "",
    fiscal_icms_rate: "0",
    fiscal_iss_rate: "0",
    fiscal_pis_rate: "0",
    fiscal_cofins_rate: "0",
    fiscal_default_cfop: "5102",
    fiscal_default_ncm: "",
    fiscal_default_cst: "",
    fiscal_default_csosn: "",
    // Financeiro / precificação
    operational_rate: "15",
    tax_rate: "6",
    card_fee_debit: "1.99",
    card_fee_credit: "4.99",
    pricing_rounding_step: "0.01",
  };
  for (const k of Object.keys(defaults)) {
    if (values[k] === undefined) values[k] = defaults[k];
  }

  return <ConfigPanel values={values} />;
}
