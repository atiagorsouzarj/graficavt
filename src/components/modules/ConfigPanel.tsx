"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, Button, Input, Field, Badge } from "@/components/ui";

interface Props {
  values: Record<string, string>;
}

const GROUPS: {
  title: string;
  icon: string;
  hint: string;
  fields: { key: string; label: string; type: "text" | "percent"; suffix?: string }[];
}[] = [
  {
    title: "Empresa",
    icon: "🏢",
    hint: "Dados que aparecem na OS e no cupom fiscal.",
    fields: [
      { key: "company_name", label: "Nome da empresa", type: "text" },
      { key: "company_document", label: "CNPJ", type: "text" },
      { key: "company_phone", label: "Telefone", type: "text" },
      { key: "company_address", label: "Endereço", type: "text" },
      { key: "pix_key", label: "Chave PIX", type: "text" },
    ],
  },
  {
    title: "Impostos & Taxas",
    icon: "🧮",
    hint: "Aplicados automaticamente na calculadora de produtos e no PDV.",
    fields: [
      { key: "operational_rate", label: "Custo operacional padrão", type: "percent", suffix: "%" },
      { key: "tax_rate", label: "Imposto sobre venda", type: "percent", suffix: "%" },
      { key: "card_fee_debit", label: "Taxa maquininha (Débito)", type: "percent", suffix: "%" },
      { key: "card_fee_credit", label: "Taxa maquininha (Crédito)", type: "percent", suffix: "%" },
    ],
  },
];

export function ConfigPanel({ values }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>(values);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      for (const key of Object.keys(form)) {
        await fetch("/api/crud/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ op: "save", data: { key, value: form[key], category: "geral" } }),
        });
      }
      router.refresh();
      alert("Configurações salvas!");
    } finally {
      setSaving(false);
    }
  }

  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Painel de Controle
          </h1>
          <p className="text-sm text-slate-500">
            Configure os módulos internos do sistema.
          </p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? "Salvando..." : "💾 Salvar Tudo"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {GROUPS.map((g) => (
          <Card key={g.title}>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <span>{g.icon}</span> {g.title}
                </span>
              }
              subtitle={g.hint}
            />
            <div className="space-y-4 p-5">
              {g.fields.map((f) => (
                <Field key={f.key} label={f.label}>
                  <div className="relative">
                    <Input
                      type={f.type === "percent" ? "number" : "text"}
                      step="0.01"
                      value={form[f.key] ?? ""}
                      onChange={(e) => set(f.key, e.target.value)}
                    />
                    {f.suffix && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        {f.suffix}
                      </span>
                    )}
                  </div>
                </Field>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Sistema de Precificação"
          subtitle="Como o motor calcula o preço final"
        />
        <div className="space-y-2 p-5 text-sm text-slate-600">
          <p>
            <Badge color="violet">1</Badge>{" "}
            <strong>Categoria</strong> define o custo por página (consumíveis + custo fixo + perda).
          </p>
          <p>
            <Badge color="violet">2</Badge>{" "}
            <strong>Impressora</strong> herda a categoria e pode ter um fator multiplicador.
          </p>
          <p>
            <Badge color="violet">3</Badge>{" "}
            <strong>Produto</strong> = impressão + material + acabamento + serviço = custo base.
          </p>
          <p>
            <Badge color="violet">4</Badge>{" "}
            Produtos <strong>Unitários</strong>: preço de venda = custo base ÷ (1 − margem).
          </p>
          <p>
            <Badge color="violet">5</Badge>{" "}
            Produtos por <strong>Tiragem</strong>: preço = custo direto ÷ (1 − operação − imposto − pagamento − lucro).
          </p>
        </div>
      </Card>
    </div>
  );
}
