"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardHeader, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";

interface Props { values: Record<string, string>; }
type Tab = "empresa" | "endereco" | "fiscal" | "tributacao" | "certificado";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "empresa", label: "Empresa", icon: "🏢" },
  { id: "endereco", label: "Endereço", icon: "📍" },
  { id: "fiscal", label: "Fiscal & NF", icon: "🧾" },
  { id: "tributacao", label: "Tributação & Preço", icon: "🧮" },
  { id: "certificado", label: "Certificado & Integração", icon: "🔐" },
];

const digits = (value: string) => value.replace(/\D/g, "");
const formatCep = (value: string) => { const raw = digits(value).slice(0, 8); return raw.length > 5 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw; };
const formatCnpj = (value: string) => digits(value).slice(0, 14).replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
const formatPhone = (value: string) => { const raw = digits(value).slice(0, 11); if (raw.length <= 2) return raw; if (raw.length <= 6) return `(${raw.slice(0,2)}) ${raw.slice(2)}`; if (raw.length <= 10) return `(${raw.slice(0,2)}) ${raw.slice(2,6)}-${raw.slice(6)}`; return `(${raw.slice(0,2)}) ${raw.slice(2,7)}-${raw.slice(7)}`; };

function validCnpj(value: string) {
  const cnpj = digits(value);
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  const calc = (base: string) => { const weight = base.length === 12 ? [5,4,3,2,9,8,7,6,5,4,3,2] : [6,5,4,3,2,9,8,7,6,5,4,3,2]; const total = base.split("").reduce((sum, digit, i) => sum + Number(digit) * weight[i], 0); const rest = total % 11; return rest < 2 ? 0 : 11 - rest; };
  return calc(cnpj.slice(0, 12)) === Number(cnpj[12]) && calc(cnpj.slice(0, 13)) === Number(cnpj[13]);
}

export function ConfigPanel({ values }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("empresa");
  const [form, setForm] = useState<Record<string, string>>(values);
  const [saving, setSaving] = useState(false);
  const [lookingUpCep, setLookingUpCep] = useState(false);
  const [cepMessage, setCepMessage] = useState("");

  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const legalName = form.company_legal_name || form.company_name || "";
  const tradeName = form.company_trade_name || "";
  const cnpj = form.company_cnpj || form.company_document || "";
  const fiscalReady = Boolean(legalName && digits(cnpj).length === 14 && form.company_cep && form.fiscal_tax_regime && form.fiscal_environment && form.fiscal_provider && form.fiscal_certificate_type);
  const cnpjError = digits(cnpj).length > 0 && !validCnpj(cnpj) ? "CNPJ inválido." : "";

  async function lookupCep() {
    const cep = digits(form.company_cep || "");
    if (cep.length !== 8) { setCepMessage("Digite um CEP com 8 números."); return; }
    setLookingUpCep(true); setCepMessage("");
    try {
      const response = await fetch(`/api/cep/${cep}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "CEP não encontrado");
      setForm((current) => ({ ...current, company_cep: formatCep(cep), company_street: data.street || current.company_street, company_complement: data.complement || current.company_complement, company_district: data.district || current.company_district, company_city: data.city || current.company_city, company_state: data.state || current.company_state }));
      setCepMessage("Endereço preenchido. Confira número e complemento.");
    } catch (error) { setCepMessage(error instanceof Error ? error.message : "Erro ao consultar CEP."); } finally { setLookingUpCep(false); }
  }

  async function save() {
    if (cnpj && cnpjError) { setTab("empresa"); alert("Revise o CNPJ antes de salvar."); return; }
    if (form.company_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.company_email)) { setTab("empresa"); alert("Revise o e-mail empresarial."); return; }
    setSaving(true);
    try {
      const address = [form.company_street && `${form.company_street}${form.company_number ? `, ${form.company_number}` : ""}`, form.company_complement, form.company_district, [form.company_city, form.company_state].filter(Boolean).join(" / "), form.company_cep && `CEP ${form.company_cep}`].filter(Boolean).join(" — ");
      const normalized = {
        ...form,
        company_legal_name: legalName,
        company_trade_name: tradeName,
        company_cnpj: digits(cnpj),
        company_phone: digits(form.company_phone || ""),
        company_whatsapp: digits(form.company_whatsapp || ""),
        company_cep: digits(form.company_cep || ""),
        company_state: (form.company_state || "").toUpperCase(),
        // retrocompatibilidade com OS, cupom e portal existentes
        company_name: tradeName || legalName,
        company_document: digits(cnpj),
        company_address: address,
        pix_key: form.pix_key || "",
      };
      for (const [key, value] of Object.entries(normalized)) {
        await fetch("/api/crud/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "save", data: { key, value, category: categoryFor(key) } }) });
      }
      router.refresh();
      alert("Painel de controle salvo com sucesso.");
    } finally { setSaving(false); }
  }

  return <div>
    <PageHeader eyebrow="Administração" icon="⚙️" title="Painel de Controle" description="Cadastro empresarial, dados fiscais, parâmetros tributários e preparação para emissão de documentos fiscais." action={<Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "💾 Salvar Painel"}</Button>} />
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${fiscalReady ? "bg-emerald-100" : "bg-amber-100"}`}>{fiscalReady ? "✓" : "⚠️"}</div><div className="min-w-0 flex-1"><p className="text-sm font-extrabold text-slate-700">Preparação fiscal {fiscalReady ? "completa" : "pendente"}</p><p className="text-xs text-slate-500">{fiscalReady ? "Dados cadastrais e campos de NF preparados para integração com provedor fiscal." : "Complete empresa, endereço, regime tributário, ambiente e certificado/provedor."}</p></div><Badge color={fiscalReady ? "green" : "amber"}>{fiscalReady ? "PRONTO PARA INTEGRAÇÃO" : "CADASTRO INCOMPLETO"}</Badge></div>
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[240px_1fr]">
      <Card className="h-fit"><div className="p-2">{TABS.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition-colors ${tab === item.id ? "bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-800" : "text-slate-500 hover:bg-slate-50"}`}><span className="text-lg">{item.icon}</span>{item.label}{tab === item.id && <span className="ml-auto h-2 w-2 rounded-full bg-cyan-500" />}</button>)}</div></Card>
      <Card><CardHeader title={TABS.find((item) => item.id === tab)?.label || "Configuração"} subtitle={tab === "empresa" ? "Identidade pública e canais de contato." : tab === "endereco" ? "Endereço fiscal e operacional da empresa." : tab === "fiscal" ? "Dados exigidos e preparados para NF-e, NFC-e e NFS-e." : tab === "tributacao" ? "Impostos, markup divisor e parâmetros comerciais." : "Configuração de provedor fiscal, certificado A1 e dados sensíveis."} /><div className="p-5">
        {tab === "empresa" && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="Razão social"><Input value={legalName} onChange={(e) => set("company_legal_name", e.target.value)} placeholder="Ex.: VTDigital Art Studio LTDA" /></Field><Field label="Nome fantasia"><Input value={tradeName} onChange={(e) => set("company_trade_name", e.target.value)} placeholder="Ex.: VTDigital Art Studio" /></Field><Field label="CNPJ"><Input value={cnpj} onChange={(e) => set("company_cnpj", formatCnpj(e.target.value))} className={cnpjError ? "border-rose-300 ring-2 ring-rose-100" : ""} placeholder="00.000.000/0000-00" />{cnpjError && <p className="mt-1 text-[11px] font-bold text-rose-600">{cnpjError}</p>}</Field><Field label="E-mail empresarial"><Input type="email" value={form.company_email || ""} onChange={(e) => set("company_email", e.target.value)} placeholder="contato@empresa.com.br" /></Field><Field label="Telefone"><Input value={form.company_phone || ""} onChange={(e) => set("company_phone", formatPhone(e.target.value))} /></Field><Field label="WhatsApp"><Input value={form.company_whatsapp || ""} onChange={(e) => set("company_whatsapp", formatPhone(e.target.value))} /></Field><Field label="Website"><Input value={form.company_website || ""} onChange={(e) => set("company_website", e.target.value)} placeholder="https://www.empresa.com.br" /></Field><Field label="Logo (URL)"><Input value={form.company_logo_url || ""} onChange={(e) => set("company_logo_url", e.target.value)} placeholder="https://.../logo.png" /></Field><Field label="Chave PIX" className="sm:col-span-2"><Input value={form.pix_key || ""} onChange={(e) => set("pix_key", e.target.value)} /></Field></div>}
        {tab === "endereco" && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="CEP" hint="Consulta ViaCEP"><div className="flex gap-2"><Input value={form.company_cep || ""} onChange={(e) => set("company_cep", formatCep(e.target.value))} onBlur={() => { if (digits(form.company_cep || "").length === 8) lookupCep(); }} /><Button variant="outline" type="button" onClick={lookupCep} disabled={lookingUpCep}>{lookingUpCep ? "..." : "Consultar"}</Button></div>{cepMessage && <p className="mt-1 text-[11px] text-cyan-600">{cepMessage}</p>}</Field><div className="hidden sm:block" /><Field label="Logradouro" className="sm:col-span-2"><Input value={form.company_street || ""} onChange={(e) => set("company_street", e.target.value)} /></Field><Field label="Número"><Input value={form.company_number || ""} onChange={(e) => set("company_number", e.target.value)} /></Field><Field label="Complemento"><Input value={form.company_complement || ""} onChange={(e) => set("company_complement", e.target.value)} /></Field><Field label="Bairro"><Input value={form.company_district || ""} onChange={(e) => set("company_district", e.target.value)} /></Field><Field label="Cidade"><Input value={form.company_city || ""} onChange={(e) => set("company_city", e.target.value)} /></Field><Field label="UF"><Input value={form.company_state || ""} onChange={(e) => set("company_state", e.target.value.toUpperCase().slice(0, 2))} placeholder="RJ" /></Field><Field label="País"><Input value={form.company_country || "Brasil"} onChange={(e) => set("company_country", e.target.value)} /></Field></div>}
        {tab === "fiscal" && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Toggle label="Emitir NF-e (produtos)" value={form.fiscal_nfe_enabled || "false"} onChange={(v) => set("fiscal_nfe_enabled", v)} /><Toggle label="Emitir NFC-e (PDV)" value={form.fiscal_nfce_enabled || "false"} onChange={(v) => set("fiscal_nfce_enabled", v)} /><Toggle label="Emitir NFS-e (serviços)" value={form.fiscal_nfse_enabled || "false"} onChange={(v) => set("fiscal_nfse_enabled", v)} /><Field label="Ambiente fiscal"><Select value={form.fiscal_environment || "homologacao"} onChange={(e) => set("fiscal_environment", e.target.value)}><option value="homologacao">Homologação / testes</option><option value="producao">Produção</option></Select></Field><Field label="Inscrição Estadual"><Input value={form.fiscal_state_registration || ""} onChange={(e) => set("fiscal_state_registration", e.target.value)} /></Field><Field label="Inscrição Municipal"><Input value={form.fiscal_municipal_registration || ""} onChange={(e) => set("fiscal_municipal_registration", e.target.value)} /></Field><Field label="CNAE principal"><Input value={form.fiscal_cnae || ""} onChange={(e) => set("fiscal_cnae", e.target.value)} placeholder="Ex.: 1813-0/01" /></Field><Field label="Natureza jurídica"><Input value={form.fiscal_legal_nature || ""} onChange={(e) => set("fiscal_legal_nature", e.target.value)} /></Field><Field label="Regime tributário"><Select value={form.fiscal_tax_regime || "simples"} onChange={(e) => set("fiscal_tax_regime", e.target.value)}><option value="simples">Simples Nacional</option><option value="mei">MEI</option><option value="presumido">Lucro Presumido</option><option value="real">Lucro Real</option></Select></Field><Field label="Município para NFS-e"><Input value={form.fiscal_service_municipality || form.company_city || ""} onChange={(e) => set("fiscal_service_municipality", e.target.value)} /></Field><Field label="Série NF-e"><Input value={form.fiscal_series_nfe || "1"} onChange={(e) => set("fiscal_series_nfe", e.target.value)} /></Field><Field label="Próximo número NF-e"><Input type="number" value={form.fiscal_next_nfe || "1"} onChange={(e) => set("fiscal_next_nfe", e.target.value)} /></Field><Field label="Série NFC-e"><Input value={form.fiscal_series_nfce || "1"} onChange={(e) => set("fiscal_series_nfce", e.target.value)} /></Field><Field label="Próximo número NFC-e"><Input type="number" value={form.fiscal_next_nfce || "1"} onChange={(e) => set("fiscal_next_nfce", e.target.value)} /></Field></div>}
        {tab === "tributacao" && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="Custo operacional padrão (%)"><Input type="number" step="0.01" value={form.operational_rate || "15"} onChange={(e) => set("operational_rate", e.target.value)} /></Field><Field label="Imposto padrão sobre venda (%)"><Input type="number" step="0.01" value={form.tax_rate || "6"} onChange={(e) => set("tax_rate", e.target.value)} /></Field><Field label="Taxa débito (%)"><Input type="number" step="0.01" value={form.card_fee_debit || "0"} onChange={(e) => set("card_fee_debit", e.target.value)} /></Field><Field label="Taxa crédito (%)"><Input type="number" step="0.01" value={form.card_fee_credit || "0"} onChange={(e) => set("card_fee_credit", e.target.value)} /></Field><Field label="ICMS referência (%)"><Input type="number" step="0.01" value={form.fiscal_icms_rate || "0"} onChange={(e) => set("fiscal_icms_rate", e.target.value)} /></Field><Field label="ISS referência (%)"><Input type="number" step="0.01" value={form.fiscal_iss_rate || "0"} onChange={(e) => set("fiscal_iss_rate", e.target.value)} /></Field><Field label="PIS referência (%)"><Input type="number" step="0.01" value={form.fiscal_pis_rate || "0"} onChange={(e) => set("fiscal_pis_rate", e.target.value)} /></Field><Field label="COFINS referência (%)"><Input type="number" step="0.01" value={form.fiscal_cofins_rate || "0"} onChange={(e) => set("fiscal_cofins_rate", e.target.value)} /></Field><Field label="CFOP padrão"><Input value={form.fiscal_default_cfop || "5102"} onChange={(e) => set("fiscal_default_cfop", e.target.value)} /></Field><Field label="NCM padrão"><Input value={form.fiscal_default_ncm || ""} onChange={(e) => set("fiscal_default_ncm", e.target.value)} /></Field><Field label="CST padrão"><Input value={form.fiscal_default_cst || ""} onChange={(e) => set("fiscal_default_cst", e.target.value)} /></Field><Field label="CSOSN padrão"><Input value={form.fiscal_default_csosn || ""} onChange={(e) => set("fiscal_default_csosn", e.target.value)} /></Field><Field label="Arredondamento comercial"><Select value={form.pricing_rounding_step || "0.01"} onChange={(e) => set("pricing_rounding_step", e.target.value)}><option value="0.01">R$ 0,01</option><option value="0.1">R$ 0,10</option><option value="0.5">R$ 0,50</option><option value="1">R$ 1,00</option></Select></Field></div>}
        {tab === "certificado" && <div className="space-y-4"><div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800"><strong>Segurança:</strong> estes campos deixam o ERP preparado para integração fiscal. Antes de emitir NF em produção, tokens e certificado devem ser migrados para cofre de segredos/variáveis de ambiente e homologados com seu contador/provedor.</div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="Provedor fiscal"><Select value={form.fiscal_provider || "manual"} onChange={(e) => set("fiscal_provider", e.target.value)}><option value="manual">Manual / ainda não integrado</option><option value="nuvemfiscal">Nuvem Fiscal</option><option value="plugnotas">PlugNotas</option><option value="focusnfe">Focus NFe</option><option value="sefaz_direto">SEFAZ direto</option></Select></Field><Field label="Certificado"><Select value={form.fiscal_certificate_type || "A1"} onChange={(e) => set("fiscal_certificate_type", e.target.value)}><option value="A1">A1 (.pfx)</option><option value="A3">A3 (token/cartão)</option><option value="nenhum">Ainda não configurado</option></Select></Field><Field label="Caminho/ID do certificado"><Input value={form.fiscal_certificate_path || ""} onChange={(e) => set("fiscal_certificate_path", e.target.value)} placeholder="Identificador seguro ou caminho do cofre" /></Field><Field label="Validade do certificado"><Input type="date" value={form.fiscal_certificate_expiration || ""} onChange={(e) => set("fiscal_certificate_expiration", e.target.value)} /></Field><Field label="CSC ID (NFC-e)"><Input value={form.fiscal_csc_id || ""} onChange={(e) => set("fiscal_csc_id", e.target.value)} /></Field><Field label="CSC Token (NFC-e)"><Input type="password" value={form.fiscal_csc_token || ""} onChange={(e) => set("fiscal_csc_token", e.target.value)} placeholder="Campo sensível" /></Field><Field label="Endpoint / Webhook fiscal" className="sm:col-span-2"><Input value={form.fiscal_webhook_url || ""} onChange={(e) => set("fiscal_webhook_url", e.target.value)} placeholder="https://..." /></Field></div><Field label="Observações fiscais"><Textarea rows={4} value={form.fiscal_notes || ""} onChange={(e) => set("fiscal_notes", e.target.value)} placeholder="Orientações do contador, particularidades de tributação, regras municipais..." /></Field></div>}
      </div></Card>
    </div>
  </div>;
}

function Toggle({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { const enabled = value === "true"; return <button type="button" onClick={() => onChange(enabled ? "false" : "true")} className={`flex items-center justify-between rounded-xl border px-3 py-3 text-left transition-colors ${enabled ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}><span className="text-sm font-bold text-slate-700">{label}</span><span className={`relative h-5 w-9 rounded-full ${enabled ? "bg-emerald-500" : "bg-slate-300"}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${enabled ? "left-[18px]" : "left-0.5"}`} /></span></button>; }

function categoryFor(key: string) { if (key.startsWith("company_")) return "empresa"; if (key.startsWith("fiscal_")) return "fiscal"; if (key.includes("rate") || key.includes("fee") || key.includes("rounding")) return "tributacao"; return "geral"; }
