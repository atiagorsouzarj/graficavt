import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { ResourceTable, type FieldDef } from "@/components/ResourceTable";

export const dynamic = "force-dynamic";

const fields: FieldDef[] = [
  { name: "name", label: "Razão social / Nome", type: "text", showInTable: true, colSpan: 2 },
  { name: "tradeName", label: "Nome fantasia", type: "text", showInTable: true },
  { name: "document", label: "CNPJ / CPF", type: "text", showInTable: true },
  { name: "contactName", label: "Contato", type: "text", showInTable: true },
  { name: "whatsapp", label: "WhatsApp", type: "text", showInTable: true },
  { name: "phone", label: "Telefone", type: "text" },
  { name: "email", label: "E-mail", type: "text" },
  { name: "website", label: "Website", type: "text" },
  { name: "paymentTerms", label: "Condição de pagamento", type: "text", showInTable: true, hint: "Ex.: 28 dias, PIX à vista" },
  { name: "leadTimeDays", label: "Prazo médio (dias)", type: "number", default: "0", showInTable: true },
  { name: "cep", label: "CEP", type: "text" },
  { name: "street", label: "Logradouro", type: "text", colSpan: 2 },
  { name: "number", label: "Número", type: "text" },
  { name: "complement", label: "Complemento", type: "text" },
  { name: "district", label: "Bairro", type: "text" },
  { name: "city", label: "Cidade", type: "text" },
  { name: "state", label: "UF", type: "text" },
  { name: "notes", label: "Observações", type: "textarea", colSpan: 2 },
];

export default async function FornecedoresPage() {
  const rows = await db.select().from(suppliers);
  return <ResourceTable resource="suppliers" title="Fornecedores" eyebrow="Compras & Estoque" icon="🚚" description="Cadastre fornecedores, prazos e condições para alimentar o processo de compras." fields={fields} rows={rows} searchKeys={["name", "tradeName", "document", "contactName", "whatsapp", "email"]} newLabel="Novo Fornecedor" emptyIcon="🚚" />;
}
