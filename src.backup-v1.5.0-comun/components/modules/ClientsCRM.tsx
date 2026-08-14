"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { mutate } from "@/lib/mutate";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from "@/components/ui";
import { ClientIdentity, whatsappHref } from "@/components/ClientIdentity";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;
type Tab = "identificacao" | "contato" | "endereco" | "comercial";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "identificacao", label: "Identificação", icon: "👤" },
  { id: "contato", label: "Contato", icon: "💬" },
  { id: "endereco", label: "Endereço", icon: "📍" },
  { id: "comercial", label: "Comercial", icon: "🤝" },
];

const emptyForm = (): Record<string, string> => ({
  type: "pf",
  name: "",
  tradeName: "",
  document: "",
  rg: "",
  birthDate: "",
  gender: "",
  stateRegistration: "",
  municipalRegistration: "",
  legalNature: "",
  taxRegime: "",
  email: "",
  phone: "",
  whatsapp: "",
  secondaryPhone: "",
  website: "",
  contactName: "",
  contactRole: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
  creditLimit: "0",
  tags: "",
  status: "lead",
  notes: "",
});

const digits = (value: string) => value.replace(/\D/g, "");
const formatCep = (value: string) => {
  const d = digits(value).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};
const formatPhone = (value: string) => {
  const d = digits(value).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};
const formatDoc = (value: string, type: string) => {
  const d = digits(value).slice(0, type === "pj" ? 14 : 11);
  if (type === "pj") {
    return d
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
};

function validCpf(raw: string) {
  const d = digits(raw);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const calc = (factor: number) => {
    let sum = 0;
    for (let i = 0; i < factor - 1; i++) sum += Number(d[i]) * (factor - i);
    const rem = (sum * 10) % 11;
    return rem === 10 ? 0 : rem;
  };
  return calc(10) === Number(d[9]) && calc(11) === Number(d[10]);
}
function validCnpj(raw: string) {
  const d = digits(raw);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calc = (base: string) => {
    const weights = base.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = base.split("").reduce((s, x, i) => s + Number(x) * weights[i], 0);
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };
  return calc(d.slice(0, 12)) === Number(d[12]) && calc(d.slice(0, 13)) === Number(d[13]);
}

export function ClientsCRM({ customers }: { customers: AnyRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.name, c.tradeName, c.document, c.email, c.phone, c.whatsapp, c.tags]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [customers, search]);

  function openNew() {
    setEditing(null);
    setModal(true);
  }
  function openEdit(customer: AnyRow) {
    setEditing(customer);
    setModal(true);
  }

  async function remove(id: number) {
    if (!confirm("Excluir cliente? O histórico comercial deve ser conferido antes.")) return;
    await mutate("customers", "delete", undefined, id);
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Comercial & Relacionamento"
        icon="👥"
        title="Clientes (CRM)"
        description="Histórico, dados fiscais, contatos e endereço validados para vender com mais segurança."
        action={<Button onClick={openNew}>＋ Novo Cliente</Button>}
      />

      <div className="mb-4 flex items-center gap-2">
        <div className="relative max-w-md flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">🔍</span>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, CPF/CNPJ, telefone, e-mail..."
            className="pl-9"
          />
        </div>
        <span className="text-xs text-slate-400">
          {filtered.length} cliente{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon="👥"
            title="Nenhum cliente encontrado"
            description="Cadastre o primeiro cliente ou ajuste sua busca."
            action={<Button onClick={openNew}>＋ Novo Cliente</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const whatsapp = whatsappHref(c);
            return (
              <ClientIdentity
                key={c.id}
                customer={c}
                variant="card"
                className="transition-all hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"
                action={
                  <div className="flex shrink-0 items-center gap-2">
                    <Link href={`/clientes/${c.id}`} className="text-xs font-bold text-slate-600 hover:text-cyan-600 hover:underline">
                      Perfil 360
                    </Link>
                    {whatsapp && (
                      <a
                        href={whatsapp}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-emerald-600 hover:underline"
                      >
                        WhatsApp
                      </a>
                    )}
                    <button onClick={() => openEdit(c)} className="text-xs font-bold text-cyan-600 hover:underline">
                      Editar
                    </button>
                    <button onClick={() => remove(c.id)} className="text-xs font-bold text-rose-600 hover:underline">
                      Excluir
                    </button>
                  </div>
                }
              />
            );
          })}
        </div>
      )}

      {modal && (
        <CustomerModal
          customer={editing}
          customers={customers}
          onClose={() => setModal(false)}
          onSaved={() => {
            setModal(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function CustomerModal({
  customer,
  customers,
  onClose,
  onSaved,
}: {
  customer: AnyRow | null;
  customers: AnyRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tab, setTab] = useState<Tab>("identificacao");
  const [saving, setSaving] = useState(false);
  const [lookingUpCep, setLookingUpCep] = useState(false);
  const [cepMessage, setCepMessage] = useState("");
  const [form, setForm] = useState<Record<string, string>>(() => {
    const base = emptyForm();
    if (!customer) return base;
    for (const key of Object.keys(base)) {
      const v = customer[key];
      if (v !== null && v !== undefined) base[key] = String(v).slice(0, key === "birthDate" ? 10 : undefined);
    }
    return base;
  });

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Informe o nome ou razão social.";
    const doc = digits(form.document);
    if (doc.length > 0) {
      const valid = form.type === "pj" ? validCnpj(doc) : validCpf(doc);
      if (doc.length === (form.type === "pj" ? 14 : 11) && !valid)
        e.document = form.type === "pj" ? "CNPJ inválido." : "CPF inválido.";
      if (doc.length > 0 && doc.length < (form.type === "pj" ? 14 : 11))
        e.document = `Digite ${form.type === "pj" ? "14" : "11"} dígitos.`;
      const duplicate = customers.find(
        (c) => digits(String(c.document || "")) === doc && c.id !== customer?.id
      );
      if (duplicate) e.document = "Este CPF/CNPJ já pertence a outro cliente.";
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "E-mail inválido.";
    if (form.phone && digits(form.phone).length < 10) e.phone = "Telefone incompleto.";
    if (form.whatsapp && digits(form.whatsapp).length < 10)
      e.whatsapp = "WhatsApp incompleto.";
    if (form.cep && digits(form.cep).length !== 8) e.cep = "CEP deve ter 8 dígitos.";
    if (form.state && !/^[A-Za-z]{2}$/.test(form.state)) e.state = "Use a sigla UF (ex.: RJ).";
    return e;
  }, [form, customers, customer?.id]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function lookupCep() {
    const cep = digits(form.cep);
    if (cep.length !== 8) {
      setCepMessage("Digite um CEP válido com 8 números.");
      return;
    }
    setLookingUpCep(true);
    setCepMessage("");
    try {
      const res = await fetch(`/api/cep/${cep}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "CEP não encontrado");
      setForm((f) => ({
        ...f,
        cep: formatCep(cep),
        street: data.street || f.street,
        complement: data.complement || f.complement,
        district: data.district || f.district,
        city: data.city || f.city,
        state: data.state || f.state,
      }));
      setCepMessage("Endereço preenchido. Informe o número.");
    } catch (e) {
      setCepMessage(e instanceof Error ? e.message : "Não foi possível consultar o CEP.");
    } finally {
      setLookingUpCep(false);
    }
  }

  async function save() {
    if (Object.keys(errors).length > 0) {
      const order: Tab[] = ["identificacao", "contato", "endereco", "comercial"];
      if (errors.name || errors.document) setTab(order[0]);
      else if (errors.email || errors.phone || errors.whatsapp) setTab(order[1]);
      else if (errors.cep || errors.state) setTab(order[2]);
      alert("Revise os campos destacados antes de salvar.");
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...form,
        document: digits(form.document) || null,
        phone: digits(form.phone) || null,
        whatsapp: digits(form.whatsapp) || null,
        secondaryPhone: digits(form.secondaryPhone) || null,
        cep: digits(form.cep) || null,
        state: form.state.toUpperCase() || null,
        creditLimit: form.creditLimit || "0",
      };
      if (customer) await mutate("customers", "update", data, customer.id);
      else await mutate("customers", "create", data);
      onSaved();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao salvar cliente.");
    } finally {
      setSaving(false);
    }
  }

  const bad = (key: string) => errors[key] ? "border-rose-300 ring-2 ring-rose-100" : "";
  const feedback = (key: string) =>
    errors[key] ? <p className="mt-1 text-[11px] font-medium text-rose-600">{errors[key]}</p> : null;

  return (
    <Modal
      open
      onClose={onClose}
      title={customer ? "Editar Cliente" : "Novo Cliente"}
      subtitle="Cadastro organizado, validado e pronto para CRM, PDV e orçamentos."
      icon="👥"
      size="xl"
    >
      <div className="mb-5 flex overflow-x-auto border-b border-slate-100">
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-bold transition-colors ${
              tab === item.id
                ? "border-cyan-500 text-cyan-700"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      {tab === "identificacao" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tipo de cadastro" className="sm:col-span-2">
            <div className="grid grid-cols-2 gap-2">
              {[
                ["pf", "👤 Pessoa Física"],
                ["pj", "🏢 Pessoa Jurídica"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => set("type", id)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                    form.type === id
                      ? "border-cyan-300 bg-cyan-50 text-cyan-700"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>
          <Field label={form.type === "pj" ? "Razão Social" : "Nome completo"}>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} className={bad("name")} />
            {feedback("name")}
          </Field>
          <Field label={form.type === "pj" ? "CNPJ" : "CPF"}>
            <Input
              value={form.document}
              onChange={(e) => set("document", formatDoc(e.target.value, form.type))}
              placeholder={form.type === "pj" ? "00.000.000/0000-00" : "000.000.000-00"}
              className={bad("document")}
            />
            {feedback("document")}
          </Field>
          {form.type === "pf" ? (
            <>
              <Field label="RG"><Input value={form.rg} onChange={(e) => set("rg", e.target.value)} /></Field>
              <Field label="Data de nascimento"><Input type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} /></Field>
              <Field label="Gênero" className="sm:col-span-2">
                <Select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                  <option value="">Não informado</option><option value="masculino">Masculino</option><option value="feminino">Feminino</option><option value="outro">Outro</option>
                </Select>
              </Field>
            </>
          ) : (
            <>
              <Field label="Nome fantasia"><Input value={form.tradeName} onChange={(e) => set("tradeName", e.target.value)} /></Field>
              <Field label="Inscrição Estadual"><Input value={form.stateRegistration} onChange={(e) => set("stateRegistration", e.target.value)} /></Field>
              <Field label="Inscrição Municipal"><Input value={form.municipalRegistration} onChange={(e) => set("municipalRegistration", e.target.value)} /></Field>
              <Field label="Natureza Jurídica"><Input value={form.legalNature} onChange={(e) => set("legalNature", e.target.value)} placeholder="Ex.: Sociedade LTDA" /></Field>
              <Field label="Regime tributário" className="sm:col-span-2">
                <Select value={form.taxRegime} onChange={(e) => set("taxRegime", e.target.value)}>
                  <option value="">Não informado</option><option value="simples">Simples Nacional</option><option value="mei">MEI</option><option value="presumido">Lucro Presumido</option><option value="real">Lucro Real</option>
                </Select>
              </Field>
            </>
          )}
        </div>
      )}

      {tab === "contato" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="E-mail">
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={bad("email")} placeholder="contato@cliente.com" />
            {feedback("email")}
          </Field>
          <Field label="WhatsApp">
            <Input value={form.whatsapp} onChange={(e) => set("whatsapp", formatPhone(e.target.value))} className={bad("whatsapp")} placeholder="(00) 00000-0000" />
            {feedback("whatsapp")}
          </Field>
          <Field label="Telefone">
            <Input value={form.phone} onChange={(e) => set("phone", formatPhone(e.target.value))} className={bad("phone")} placeholder="(00) 0000-0000" />
            {feedback("phone")}
          </Field>
          <Field label="Telefone secundário"><Input value={form.secondaryPhone} onChange={(e) => set("secondaryPhone", formatPhone(e.target.value))} /></Field>
          <Field label="Website"><Input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" /></Field>
          <Field label="Contato responsável"><Input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} /></Field>
          <Field label="Cargo do contato" className="sm:col-span-2"><Input value={form.contactRole} onChange={(e) => set("contactRole", e.target.value)} placeholder="Ex.: Compras, Marketing, Financeiro" /></Field>
        </div>
      )}

      {tab === "endereco" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="CEP" hint="Digite e clique em consultar para autopreencher">
            <div className="flex gap-2">
              <Input value={form.cep} onChange={(e) => set("cep", formatCep(e.target.value))} onBlur={() => { if (digits(form.cep).length === 8) lookupCep(); }} className={bad("cep")} placeholder="00000-000" />
              <Button type="button" variant="outline" onClick={lookupCep} disabled={lookingUpCep}>{lookingUpCep ? "..." : "Consultar"}</Button>
            </div>
            {feedback("cep")}
            {cepMessage && <p className="mt-1 text-[11px] text-cyan-600">{cepMessage}</p>}
          </Field>
          <div className="hidden sm:block" />
          <Field label="Logradouro" className="sm:col-span-2"><Input value={form.street} onChange={(e) => set("street", e.target.value)} /></Field>
          <Field label="Número"><Input value={form.number} onChange={(e) => set("number", e.target.value)} placeholder="Ex.: 910" /></Field>
          <Field label="Complemento"><Input value={form.complement} onChange={(e) => set("complement", e.target.value)} placeholder="Sala, bloco, apto..." /></Field>
          <Field label="Bairro"><Input value={form.district} onChange={(e) => set("district", e.target.value)} /></Field>
          <Field label="Cidade"><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
          <Field label="UF"><Input value={form.state} onChange={(e) => set("state", e.target.value.toUpperCase().slice(0, 2))} className={bad("state")} placeholder="RJ" /></Field>
        </div>
      )}

      {tab === "comercial" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Status CRM">
            <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="lead">Lead</option><option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="bloqueado">Bloqueado</option>
            </Select>
          </Field>
          <Field label="Limite de crédito (R$)"><Input type="number" step="0.01" value={form.creditLimit} onChange={(e) => set("creditLimit", e.target.value)} /></Field>
          <Field label="Tags" className="sm:col-span-2"><Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="Ex.: recorrente, empresa, aniversário, atacado" /></Field>
          <Field label="Observações" className="sm:col-span-2"><Textarea rows={4} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Preferências, histórico de atendimento, condições comerciais..." /></Field>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-400">Campos com validação ativa em tempo real.</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "💾 Salvar Cliente"}</Button>
        </div>
      </div>
    </Modal>
  );
}
