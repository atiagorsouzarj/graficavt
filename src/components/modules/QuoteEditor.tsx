"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { mutate } from "@/lib/mutate";
import {
  Button,
  Input,
  Select,
  Field,
  Textarea,
  Card,
  CardHeader,
  Badge,
} from "@/components/ui";
import { SearchCombobox } from "@/components/SearchCombobox";
import { formatMoney, formatDate } from "@/lib/format";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

interface Props {
  quote?: AnyRow | null;
  items: AnyRow[];
  customers: AnyRow[];
  products: AnyRow[];
  services: AnyRow[];
  company: AnyRow;
}

interface Line {
  description: string;
  productId?: number | null;
  serviceId?: number | null;
  quantity: string;
  unitPrice: string;
}

export function QuoteEditor({
  quote,
  items,
  customers,
  products,
  services,
  company,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showDoc, setShowDoc] = useState(false);

  const [customerId, setCustomerId] = useState(String(quote?.customerId || ""));
  const [status, setStatus] = useState(quote?.status || "rascunho");
  const [validUntil, setValidUntil] = useState(
    quote?.validUntil ? String(quote.validUntil).slice(0, 10) : ""
  );
  const [paymentMethod, setPaymentMethod] = useState(quote?.paymentMethod || "");
  const [notes, setNotes] = useState(quote?.notes || "");
  const [discount, setDiscount] = useState(String(quote?.discount || 0));
  const [taxRate, setTaxRate] = useState("6");
  const [productPick, setProductPick] = useState("");
  const [servicePick, setServicePick] = useState("");

  const [lines, setLines] = useState<Line[]>(
    items.length
      ? items.map((i) => ({
          description: i.description,
          productId: i.productId,
          serviceId: i.serviceId,
          quantity: String(i.quantity),
          unitPrice: String(i.unitPrice),
        }))
      : [{ description: "", quantity: "1", unitPrice: "0" }]
  );

  const customer = customers.find((c) => String(c.id) === customerId);
  const customerOptions = customers.map((c) => ({
    value: String(c.id),
    label: c.name,
    detail: [c.document, c.whatsapp || c.phone].filter(Boolean).join(" · "),
    icon: c.type === "pj" ? "🏢" : "👤",
  }));
  const productOptions = products.map((p) => ({
    value: String(p.id),
    label: p.name,
    detail: `${p.sku || "PRO"} · ${formatMoney(Number(p.finalPrice || 0))}`,
    icon: "🏷️",
  }));
  const serviceOptions = services.map((s) => ({
    value: String(s.id),
    label: s.name,
    detail: `${s.type === "terceirizado" ? "Terceirizado" : "Próprio"} · ${formatMoney(Number(s.baseCost || 0))}`,
    icon: "🛠️",
  }));

  const totals = useMemo(() => {
    const subtotal = lines.reduce(
      (s, l) => s + Number(l.quantity || 0) * Number(l.unitPrice || 0),
      0
    );
    const disc = Number(discount || 0);
    const tax = (subtotal - disc) * (Number(taxRate || 0) / 100);
    const total = subtotal - disc + tax;
    return { subtotal, disc, tax, total };
  }, [lines, discount, taxRate]);

  function addProductLine(productId: number) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setLines([
      ...lines,
      {
        description: p.name,
        productId,
        quantity: "1",
        unitPrice: Number(p.finalPrice || 0).toFixed(2),
      },
    ]);
  }
  function addServiceLine(serviceId: number) {
    const s = services.find((x) => x.id === serviceId);
    if (!s) return;
    setLines([
      ...lines,
      {
        description: `Serviço: ${s.name}`,
        serviceId,
        quantity: "1",
        unitPrice: Number(s.baseCost || 0).toFixed(2),
      },
    ]);
  }

  async function save(gotoDoc = false) {
    setSaving(true);
    try {
      const data = {
        customerId: customerId || null,
        status,
        validUntil,
        paymentMethod,
        notes,
        discount: totals.disc,
        taxes: totals.tax,
        subtotal: totals.subtotal,
        total: totals.total,
        items: lines.filter((l) => l.description),
      };
      if (quote?.id) {
        await mutate("quotes", "update", data, Number(quote.id));
      } else {
        await mutate("quotes", "create", data);
      }
      if (gotoDoc) setShowDoc(true);
      else {
        router.push("/orcamentos");
        router.refresh();
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    } finally {
      setSaving(false);
    }
  }

  if (showDoc) {
    return (
      <PrintDocument
        quote={quote}
        customer={customer}
        lines={lines}
        totals={totals}
        company={company}
        notes={notes}
        paymentMethod={paymentMethod}
        onClose={() => setShowDoc(false)}
        validUntil={validUntil}
      />
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/orcamentos"
            className="text-xs font-medium text-cyan-600 hover:underline"
          >
            ← Voltar
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {quote?.number || "Novo Orçamento"}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => save(true)} disabled={saving}>
            🖨️ Gerar OS / PDF
          </Button>
          <Button onClick={() => save(false)} disabled={saving}>
            {saving ? "Salvando..." : "💾 Salvar"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Dados do orçamento" />
            <div className="grid grid-cols-2 gap-4 p-5">
              <Field label="Cliente" className="col-span-2">
                <SearchCombobox
                  value={customerId}
                  onChange={setCustomerId}
                  options={customerOptions}
                  placeholder="Buscar nome, CPF/CNPJ ou telefone..."
                  emptyLabel="— Consumidor final —"
                />
              </Field>
              <Field label="Status">
                <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                  {["rascunho", "enviado", "aprovado", "recusado", "expirado"].map(
                    (s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    )
                  )}
                </Select>
              </Field>
              <Field label="Válido até">
                <Input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </Field>
              <Field label="Forma de pagamento" className="col-span-2">
                <Input
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  placeholder="PIX, Cartão, Boleto..."
                />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Itens"
              subtitle="Adicione produtos, serviços ou itens avulsos"
              action={
                <div className="flex w-[360px] max-w-full gap-2">
                  <SearchCombobox
                    value={productPick}
                    onChange={(value) => {
                      setProductPick(value);
                      if (value) {
                        addProductLine(Number(value));
                        setProductPick("");
                      }
                    }}
                    options={productOptions}
                    placeholder="Buscar produto..."
                    emptyLabel="＋ Produto"
                    className="min-w-0 flex-1"
                  />
                  <SearchCombobox
                    value={servicePick}
                    onChange={(value) => {
                      setServicePick(value);
                      if (value) {
                        addServiceLine(Number(value));
                        setServicePick("");
                      }
                    }}
                    options={serviceOptions}
                    placeholder="Buscar serviço..."
                    emptyLabel="＋ Serviço"
                    className="min-w-0 flex-1"
                  />
                </div>
              }
            />
            <div className="divide-y divide-slate-100">
              {lines.map((l, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 p-3">
                  <div className="col-span-6">
                    <Input
                      value={l.description}
                      placeholder="Descrição do item"
                      onChange={(e) =>
                        setLines(
                          lines.map((x, j) =>
                            j === i ? { ...x, description: e.target.value } : x
                          )
                        )
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.001"
                      value={l.quantity}
                      onChange={(e) =>
                        setLines(
                          lines.map((x, j) =>
                            j === i ? { ...x, quantity: e.target.value } : x
                          )
                        )
                      }
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      step="0.01"
                      value={l.unitPrice}
                      onChange={(e) =>
                        setLines(
                          lines.map((x, j) =>
                            j === i ? { ...x, unitPrice: e.target.value } : x
                          )
                        )
                      }
                    />
                  </div>
                  <button
                    onClick={() => setLines(lines.filter((_, j) => j !== i))}
                    className="col-span-1 text-rose-500 hover:bg-rose-50 rounded-lg"
                  >
                    ✕
                  </button>
                  <div className="col-span-12 -mt-1 text-right text-xs text-slate-500">
                    Subtotal:{" "}
                    {formatMoney(
                      Number(l.quantity || 0) * Number(l.unitPrice || 0)
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                setLines([...lines, { description: "", quantity: "1", unitPrice: "0" }])
              }
              className="m-3 text-xs font-semibold text-cyan-600 hover:underline"
            >
              ＋ item avulso
            </button>
          </Card>

          <Card>
            <CardHeader title="Observações" />
            <div className="p-5">
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Condições, prazos, especificações..."
              />
            </div>
          </Card>
        </div>

        {/* totals */}
        <div>
          <Card className="sticky top-6">
            <CardHeader title="Resumo" />
            <div className="space-y-3 p-5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium">{formatMoney(totals.subtotal)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Desconto (R$)">
                  <Input
                    type="number"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </Field>
                <Field label="Impostos (%)">
                  <Input
                    type="number"
                    step="0.01"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                  />
                </Field>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>Impostos</span>
                <span>{formatMoney(totals.tax)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold">
                <span>Total</span>
                <span className="text-cyan-600">{formatMoney(totals.total)}</span>
              </div>
              <Button
                className="w-full"
                onClick={() => save(true)}
                disabled={saving}
              >
                🖨️ Gerar OS / PDF
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ----------------- Printable OS document ----------------- */
/* ============ ORDEM DE PRODUÇÃO / ORÇAMENTO (layout profissional) ============ */
function PrintDocument({
  quote,
  customer,
  lines,
  totals,
  company,
  notes,
  paymentMethod,
  validUntil,
  onClose,
}: {
  quote?: AnyRow | null;
  customer?: AnyRow;
  lines: Line[];
  totals: { subtotal: number; disc: number; tax: number; total: number };
  company: AnyRow;
  notes: string;
  paymentMethod: string;
  validUntil: string;
  onClose: () => void;
}) {
  const items = lines.filter((l) => l.description);

  return (
    <div id="print-area">
      <div className="no-print mb-4 flex items-center justify-center gap-3">
        <Button onClick={() => window.print()}>🖨️ Imprimir / Salvar PDF</Button>
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </div>

      <div
        id="os-doc"
        className="mx-auto max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl print:shadow-none"
      >
        {/* faixa superior */}
        <div className="h-2 bg-gradient-to-r from-cyan-500 to-blue-500" />

        <div className="p-8">
          {/* Cabeçalho */}
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
                {company.company_name}
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600">
                Gráfica Rápida e Personalizados
              </p>
            </div>
            <div className="text-right text-[11px] leading-relaxed text-slate-500">
              <p>{company.company_address}</p>
              <p>{company.company_phone}</p>
              <p>CNPJ {company.company_document}</p>
            </div>
          </div>

          {/* Bloco do número */}
          <div className="mt-6 flex items-center justify-between gap-4 border-l-4 border-cyan-500 bg-slate-50 px-5 py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Ordem de Produção
              </p>
              <p className="text-2xl font-extrabold text-slate-800">
                {quote?.number || "NOVO"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Emissão
              </p>
              <p className="text-lg font-bold text-slate-700">
                {formatDate(new Date())}
              </p>
              <span className="mt-1 inline-block bg-cyan-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                {String(quote?.status || "rascunho")}
              </span>
            </div>
          </div>

          {/* Dados do cliente */}
          <h2 className="mt-6 border-b-2 border-cyan-500 pb-1 text-base font-bold text-slate-800">
            Dados do cliente
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <DocField label="Cliente" value={customer?.name || "Consumidor final"} />
            <DocField label="CPF/CNPJ" value={customer?.document} />
            <DocField label="Contato" value={customer?.phone} />
            <DocField label="E-mail" value={customer?.email} />
            <div className="col-span-2 sm:col-span-4">
              <DocField
                label="Endereço"
                value={
                  customer?.street
                    ? `${customer.street}, ${customer.number || "s/n"} — ${
                        customer.city || ""
                      }/${customer.state || ""}`
                    : "—"
                }
              />
            </div>
          </div>

          {/* Condições */}
          <h2 className="mt-6 border-b-2 border-cyan-500 pb-1 text-base font-bold text-slate-800">
            Condições do pedido
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <DocField label="Pagamento" value={paymentMethod || "A definir"} />
            <DocField label="Etapa atual" value={String(quote?.status || "rascunho")} />
            <DocField label="Validade" value={validUntil ? formatDate(validUntil) : "—"} />
            <DocField label="Entrega" value="Balcão" />
          </div>

          {/* Itens */}
          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="bg-cyan-500 text-left text-white">
                <th className="px-3 py-2 text-xs font-bold">#</th>
                <th className="px-3 py-2 text-xs font-bold">
                  Descrição do produto / serviço
                </th>
                <th className="px-3 py-2 text-center text-xs font-bold">Qtd.</th>
                <th className="px-3 py-2 text-right text-xs font-bold">Unitário</th>
                <th className="px-3 py-2 text-right text-xs font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="px-3 py-2 text-slate-400">
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{l.description}</td>
                  <td className="px-3 py-2 text-center text-slate-600">
                    {l.quantity}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-600">
                    {formatMoney(Number(l.unitPrice))}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-800">
                    {formatMoney(Number(l.quantity) * Number(l.unitPrice))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Observações + totais */}
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h2 className="border-b-2 border-cyan-500 pb-1 text-base font-bold text-slate-800">
                Informações / anotações
              </h2>
              <p className="mt-2 text-xs text-slate-600">
                {notes || "Sem observações registradas."}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-1.5 text-[11px] text-slate-500">
                <span>☐ Arte conferida</span>
                <span>☐ Material separado</span>
                <span>☐ Produção revisada</span>
                <span>☐ Embalado</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4">
              <div className="flex justify-between py-1 text-sm text-slate-600">
                <span>Subtotal</span>
                <span>{formatMoney(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between py-1 text-sm text-slate-600">
                <span>Impostos</span>
                <span>{formatMoney(totals.tax)}</span>
              </div>
              <div className="flex justify-between py-1 text-sm text-slate-600">
                <span>Desconto</span>
                <span>− {formatMoney(totals.disc)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between bg-cyan-500 px-3 py-2.5 text-white">
                <span className="font-bold">Total</span>
                <span className="text-lg font-extrabold">
                  {formatMoney(totals.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Assinaturas */}
          <div className="mt-10 flex justify-between gap-8 text-[11px] text-slate-400">
            <div className="flex-1 border-t border-slate-300 pt-1">
              Responsável pela produção
            </div>
            <div className="flex-1 border-t border-slate-300 pt-1">
              Cliente / retirada / recebimento
            </div>
          </div>

          <p className="mt-6 text-center text-[10px] text-slate-400">
            {company.company_name} • Pedido sem valor fiscal • Gerado pelo GrafCenter
          </p>
        </div>
      </div>
    </div>
  );
}

function DocField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="text-[13px] font-semibold text-slate-700">{value || "—"}</p>
    </div>
  );
}
