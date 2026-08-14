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
    company_name: "Gráfica VT Digital",
    company_document: "",
    company_phone: "",
    company_address: "",
    pix_key: "",
    tax_rate: "6",
    card_fee_debit: "1.99",
    card_fee_credit: "4.99",
  };
  for (const k of Object.keys(defaults)) {
    if (values[k] === undefined) values[k] = defaults[k];
  }

  return <ConfigPanel values={values} />;
}
