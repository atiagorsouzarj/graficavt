"use client";

import { useState, useMemo } from "react";
import { Button, Input, Card, Field, Select } from "@/components/ui";
import { SearchCombobox } from "@/components/SearchCombobox";
import { ClientIdentity } from "@/components/ClientIdentity";
import { formatMoney, formatDateTime } from "@/lib/format";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

interface CartItem {
  id: number;
  code: string;
  name: string;
  unitPrice: number;
  quantity: number;
  productId?: number | null;
}

interface Props {
  products: AnyRow[];
  services: AnyRow[];
  customers: AnyRow[];
  company: AnyRow;
  defaults: AnyRow;
}

const PAY = [
  { id: "Dinheiro", label: "Dinheiro", icon: "💵" },
  { id: "PIX", label: "PIX", icon: "📱" },
  { id: "Débito", label: "Débito", icon: "💳" },
  { id: "Crédito", label: "Crédito", icon: "💳" },
];

function codeOf(prefix: string, id: number, name: string) {
  const slug = (name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 6);
  return `${prefix}-${slug}${String(id).padStart(3, "0")}`;
}

export function PDVClient({ products, services, customers, company, defaults }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [discount, setDiscount] = useState("0");
  const [received, setReceived] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("Dinheiro");
  const [checkout, setCheckout] = useState<null | AnyRow>(null);

  const customerOptions = useMemo(
    () => customers.map((c) => ({
      value: String(c.id),
      label: c.name,
      detail: [c.document, c.whatsapp || c.phone].filter(Boolean).join(" · "),
      icon: c.type === "pj" ? "🏢" : "👤",
    })),
    [customers]
  );
  const selectedCustomer = customers.find((c) => String(c.id) === customerId) || null;

  const catalog = useMemo(() => {
    const items = [
      ...products.map((p) => ({
        id: 100000 + Number(p.id),
        code: codeOf("PRO", Number(p.id), String(p.name)),
        type: "produto" as const,
        name: String(p.name),
        unitPrice: Number(p.finalPrice || 0),
        productId: Number(p.id),
      })),
      ...services.map((s) => ({
        id: 200000 + Number(s.id),
        code: codeOf("SRV", Number(s.id), String(s.name)),
        type: "servico" as const,
        name: String(s.name),
        unitPrice: Number(s.baseCost || 0),
      })),
    ];
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) => i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q)
    );
  }, [products, services, search]);

  function addItem(item: {
    id: number;
    code: string;
    name: string;
    unitPrice: number;
    productId?: number | null;
  }) {
    setCart((prev) => {
      const found = prev.find((c) => c.id === item.id);
      if (found)
        return prev.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function setQty(id: number, q: number) {
    if (q <= 0) return setCart((p) => p.filter((c) => c.id !== id));
    setCart((p) => p.map((c) => (c.id === id ? { ...c, quantity: q } : c)));
  }

  const subtotal = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0);
  const cardFeeRate =
    paymentMethod === "Crédito"
      ? Number(defaults.cardFeeCreditRate || 0.0499)
      : paymentMethod === "Débito"
      ? Number(defaults.cardFeeRate || 0.0199)
      : 0;
  const cardFee = subtotal * cardFeeRate;
  const disc = Number(discount || 0);
  const total = Math.max(subtotal + cardFee - disc, 0);
  const change = Math.max(Number(received || 0) - total, 0);

  async function finalize() {
    if (cart.length === 0) return;
    const res = await fetch("/api/crud/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        op: "create",
        customerId: customerId || null,
        type: "mixto",
        items: cart.map((c) => ({
          code: c.code,
          description: c.name,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          total: c.unitPrice * c.quantity,
          productId: c.productId || null,
        })),
        subtotal,
        discount: disc,
        taxes: 0,
        cardFee,
        total,
        paymentMethod,
      }),
    });
    const json = await res.json();
    if (json.ok) {
      setCheckout({
        ...json.row,
        _received: Number(received || 0),
        _change: change,
        _customer: customers.find((c) => String(c.id) === customerId) || null,
      });
      setCart([]);
      setReceived("0");
      setDiscount("0");
    } else {
      alert(json.error || "Erro");
    }
  }

  if (checkout) {
    return (
      <CupomDoc
        sale={checkout}
        company={company}
        onClose={() => setCheckout(null)}
      />
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-600">
            Frente de caixa rápida
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
            PDV · Balcão Loja Física
          </h1>
          <p className="text-sm text-slate-500">
            Caixa aberto · Operador do sistema
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          CAIXA ABERTO
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">
        {/* Catálogo */}
        <div>
          <div className="relative mb-4">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>
            <Input
              placeholder="Buscar produto por nome ou código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 pl-9"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {catalog.map((item) => (
              <button
                key={item.id}
                onClick={() => addItem(item)}
                className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md"
              >
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {item.code}
                </p>
                <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-slate-800">
                  {item.name}
                </p>
                <p className="mt-1.5 text-lg font-extrabold text-cyan-600">
                  {formatMoney(item.unitPrice)}
                </p>
              </button>
            ))}
            {catalog.length === 0 && (
              <p className="col-span-full py-10 text-center text-sm text-slate-400">
                Nenhum item encontrado.
              </p>
            )}
          </div>
        </div>

        {/* Carrinho */}
        <div>
          <Card className="sticky top-24 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="flex items-center gap-2 font-bold text-slate-800">
                🛒 Carrinho de Compras
              </h3>
              <span className="text-xs text-slate-400">{cart.length} itens</span>
            </div>

            <div className="px-4 py-3">
              <Field label="Cliente">
                <SearchCombobox
                  value={customerId}
                  onChange={setCustomerId}
                  options={customerOptions}
                  placeholder="Buscar cliente..."
                  emptyLabel="Cliente Balcão"
                />
              </Field>
              {selectedCustomer && <ClientIdentity customer={selectedCustomer} variant="compact" className="mt-2" />}
            </div>

            <div className="max-h-56 overflow-y-auto border-y border-slate-100">
              {cart.length === 0 ? (
                <p className="px-4 py-10 text-center text-xs italic text-slate-400">
                  Carrinho vazio. Clique num produto.
                </p>
              ) : (
                cart.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 border-b border-slate-50 px-4 py-2 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-700">
                        {c.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatMoney(c.unitPrice)} ={" "}
                        <span className="font-semibold text-slate-600">
                          {formatMoney(c.unitPrice * c.quantity)}
                        </span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => setQty(c.id, c.quantity - 1)}
                        className="h-6 w-6 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-bold">
                        {c.quantity}
                      </span>
                      <button
                        onClick={() => setQty(c.id, c.quantity + 1)}
                        className="h-6 w-6 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200"
                      >
                        ＋
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagamento */}
            <div className="space-y-3 p-4">
              <div className="grid grid-cols-4 gap-1.5">
                {PAY.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPaymentMethod(p.id)}
                    className={`flex flex-col items-center gap-0.5 rounded-xl border px-2 py-2 text-[11px] font-semibold transition-all ${
                      paymentMethod === p.id
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-base">{p.icon}</span>
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Valor recebido">
                  <Input
                    type="number"
                    step="0.01"
                    value={received}
                    onChange={(e) => setReceived(e.target.value)}
                  />
                </Field>
                <Field label="Troco">
                  <div className="flex h-10 items-center rounded-xl bg-emerald-50 px-3 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100">
                    {formatMoney(change)}
                  </div>
                </Field>
              </div>

              <Field label="Desconto (R$)">
                <Input
                  type="number"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </Field>

              {/* Totais */}
              <div className="rounded-xl bg-slate-900 p-4 text-white">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Subtotal:</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                {cardFee > 0 && (
                  <div className="mt-0.5 flex justify-between text-xs text-slate-300">
                    <span>Taxa {paymentMethod}:</span>
                    <span>{formatMoney(cardFee)}</span>
                  </div>
                )}
                {disc > 0 && (
                  <div className="mt-0.5 flex justify-between text-xs text-slate-300">
                    <span>Desconto:</span>
                    <span>− {formatMoney(disc)}</span>
                  </div>
                )}
                <div className="mt-2 flex items-end justify-between border-t border-slate-700 pt-2">
                  <span className="text-sm font-bold text-cyan-400">TOTAL:</span>
                  <span className="text-2xl font-extrabold text-cyan-400">
                    {formatMoney(total)}
                  </span>
                </div>
              </div>

              <Button
                variant="success"
                className="h-12 w-full text-base"
                onClick={finalize}
                disabled={cart.length === 0}
              >
                ✓ FINALIZAR VENDA
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ================= CUPOM TÉRMICO 80mm ================= */
function ThermalRule() {
  return <div className="my-1.5 border-t border-dashed border-black" />;
}

function ReceiptRow({
  label,
  value,
  bold = false,
  large = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
  large?: boolean;
}) {
  return (
    <div className={`flex items-baseline justify-between gap-2 ${bold ? "font-bold" : ""} ${large ? "text-[12px]" : ""}`}>
      <span className="min-w-0">{label}</span>
      <span className="shrink-0 text-right">{value}</span>
    </div>
  );
}

function CupomDoc({
  sale,
  company,
  onClose,
}: {
  sale: AnyRow;
  company: AnyRow;
  onClose: () => void;
}) {
  const cust = sale._customer;
  const money = (value: unknown) =>
    Number(value || 0).toFixed(2).replace(".", ",");
  const date = new Date(sale.createdAt || Date.now());
  const issuedAt = `${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  const address = cust?.street
    ? `${cust.street}${cust.number ? `, ${cust.number}` : ""}${cust.complement ? ` - ${cust.complement}` : ""}`
    : "";
  const city = [cust?.city, cust?.state].filter(Boolean).join(" - ");

  return (
    <div id="print-area">
      <div className="no-print mb-4 flex items-center justify-between">
        <Button variant="outline" onClick={onClose}>← Nova venda</Button>
        <Button onClick={() => window.print()}>🖨️ Imprimir Cupom 80mm</Button>
      </div>

      <div className="mx-auto box-border w-[80mm] max-w-full bg-white px-[4mm] py-[4mm] shadow-lg print:mx-0 print:w-[80mm] print:px-[4mm] print:py-[3mm] print:shadow-none">
        <div id="cupom-doc" className="box-border w-[72mm] font-mono text-[10px] font-semibold leading-[1.28] text-black print:text-[10px] print:font-bold">
          <div className="text-center text-[12px] font-black uppercase tracking-wide">
            {company.company_name || "GRÁFICA VT DIGITAL"}
          </div>
          <div className="text-center text-[9px] font-bold uppercase">
            GRÁFICA RÁPIDA • PERSONALIZADOS
          </div>
          <div className="mt-1.5 text-center text-[9px] leading-[1.25]">
            <div>{company.company_address || "ENDEREÇO NÃO INFORMADO"}</div>
            {company.company_phone && <div>{company.company_phone}</div>}
            {company.pix_key && <div>{company.pix_key}</div>}
            {company.company_document && <div>CNPJ: {company.company_document}</div>}
          </div>

          <ThermalRule />
          <div className="text-center text-[10px] font-black uppercase">
            CUPOM NAO FISCAL {sale.number}
          </div>
          <div className="text-center text-[9px]">{issuedAt}</div>
          <ThermalRule />

          <div className="font-black uppercase">{cust?.name || "CLIENTE BALCÃO"}</div>
          {address && <div className="uppercase">{address}</div>}
          {cust?.document && <div>{cust.document}</div>}
          {cust?.district && <div>{cust.district}</div>}
          <div className="flex justify-between gap-2">
            <span>{city}</span>
            <span>{cust?.cep ? `CEP: ${cust.cep}` : ""}</span>
          </div>
          {cust?.whatsapp || cust?.phone ? <div>CONTATO: {cust?.whatsapp || cust?.phone}</div> : null}
          <ThermalRule />

          <div className="flex justify-between text-[9px] font-black uppercase">
            <span>Descrição do Produto</span><span>UNI</span>
          </div>
          <div className="grid grid-cols-[1fr_16mm] text-[8px] uppercase">
            <span>Valor&nbsp;&nbsp;&nbsp;&nbsp;Quantia&nbsp;&nbsp;&nbsp;&nbsp;Desconto</span>
            <span className="text-right">Vlr Total</span>
          </div>
          <ThermalRule />

          {Array.isArray(sale.items) && sale.items.map((item: AnyRow, index: number) => (
            <div key={index} className="mb-2">
              <div className="flex justify-between gap-2 font-black uppercase">
                <span className="min-w-0 break-words">{item.description}</span><span className="shrink-0">UNI</span>
              </div>
              <div className="grid grid-cols-[1fr_16mm]">
                <span>
                  {money(item.unitPrice)}&nbsp;&nbsp;&nbsp;&nbsp;{Number(item.quantity || 0).toFixed(3).replace(".", ",")}&nbsp;&nbsp;&nbsp;&nbsp;0,00
                </span>
                <span className="text-right font-black">{money(item.total)}</span>
              </div>
            </div>
          ))}

          <ThermalRule />
          <ReceiptRow label="VALOR PRODUTOS" value={`R$ ${money(sale.subtotal)}`} />
          <ReceiptRow label="VALOR DESCONTO" value={`R$ ${money(sale.discount)}`} />
          <ReceiptRow label="VALOR TOTAL" value={`R$ ${money(sale.total)}`} bold large />
          <ThermalRule />
          <ReceiptRow label="VALOR PAGO" value={`R$ ${money(sale._received || sale.total)}`} />
          <ReceiptRow label="VALOR TROCO" value={`R$ ${money(sale._change || 0)}`} />
          <ThermalRule />

          <div className="mt-3 text-center text-[10px] font-bold">
            Agradecemos pela preferência, esperamos<br />
            seu retorno em breve!
          </div>
          <div className="mt-2">Vendedor: OPERADOR</div>
          <div>Situação: Entrega direta para o cliente</div>
          <div>Entrega: {issuedAt}</div>
          <div className="uppercase">{sale.paymentMethod || "A VISTA"}</div>
          <div className="mt-1">Informações / Anotações / Observações Gerais</div>
          <div>Não deixe de aproveitar as nossas próximas promoções!!!</div>
          <ThermalRule />
          <div className="text-center text-[8px] font-medium">GrafCenter PDV · Documento sem valor fiscal</div>
        </div>
      </div>
    </div>
  );
}
