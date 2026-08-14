import Link from "next/link";
import { db } from "@/db";
import { apiIntegrations } from "@/db/schema";
import { ResourceTable, type FieldDef } from "@/components/ResourceTable";
import { Card, CardHeader, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

const fields: FieldDef[] = [
  { name: "name", label: "Nome", type: "text", showInTable: true, colSpan: 2 },
  {
    name: "type",
    label: "Tipo",
    type: "select",
    default: "whatsapp",
    showInTable: true,
    options: [
      { value: "whatsapp", label: "WhatsApp / E-mail" },
      { value: "voip", label: "VoIP" },
      { value: "portal", label: "Portal do Cliente" },
      { value: "email", label: "E-mail" },
    ],
  },
  { name: "endpoint", label: "Endpoint / API URL", type: "text", showInTable: true, colSpan: 2 },
  { name: "apiKey", label: "Token / API Key", type: "text", colSpan: 2 },
  { name: "webhook", label: "Webhook de retorno", type: "text", colSpan: 2 },
  {
    name: "active",
    label: "Ativo",
    type: "select",
    default: "true",
    options: [
      { value: "true", label: "Sim" },
      { value: "false", label: "Não" },
    ],
  },
];

const CONTRACTS = [
  {
    type: "whatsapp",
    icon: "💬",
    title: "WhatsApp & E-mail Transacional",
    desc: "Sistema externo com bots. Este ERP apenas publica eventos via API; o worker externo processa a fila de mensagens.",
    routes: ["POST /api/integrations/whatsapp", "GET /api/integrations/whatsapp"],
    env: ["WHATSAPP_API_KEY", "WHATSAPP_API_URL"],
  },
  {
    type: "voip",
    icon: "📞",
    title: "VoIP / Telefonia",
    desc: "PABX/discador em sistema separado. Click-to-call e eventos de chamada via webhook.",
    routes: ["POST /api/integrations/voip", "GET /api/integrations/voip"],
    env: ["VOIP_TOKEN", "VOIP_API_URL"],
  },
  {
    type: "portal",
    icon: "🌐",
    title: "Portal de Clientes",
    desc: "Sistema externo que consome o catálogo e envia pedidos que viram orçamentos rascunho.",
    routes: ["GET /api/portal?token=...", "POST /api/portal?token=..."],
    env: ["PORTAL_TOKEN"],
  },
];

export default async function IntegracoesPage() {
  const rows = await db.select().from(apiIntegrations);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          API & Integrações
        </h1>
        <p className="text-sm text-slate-500">
          Camadas de integração isoladas para não sobrecarregar o sistema.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {CONTRACTS.map((c) => (
          <Card key={c.type}>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <span className="text-xl">{c.icon}</span> {c.title}
                </span>
              }
              action={<Badge color="blue">endpoint pronto</Badge>}
            />
            <div className="space-y-3 p-5">
              <p className="text-xs text-slate-500">{c.desc}</p>
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase text-slate-400">
                  Rotas
                </p>
                <div className="space-y-1">
                  {c.routes.map((r) => (
                    <code
                      key={r}
                      className="block rounded bg-slate-900 px-2 py-1 text-[11px] text-emerald-400"
                    >
                      {r}
                    </code>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase text-slate-400">
                  Variáveis de ambiente
                </p>
                <div className="flex flex-wrap gap-1">
                  {c.env.map((e) => (
                    <code
                      key={e}
                      className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
                    >
                      {e}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <ResourceTable
        resource="integrations"
        title="Credenciais & Conexões"
        description="Cadastre as credenciais dos sistemas externos."
        fields={fields}
        rows={rows}
        searchKeys={["name", "type", "endpoint"]}
        newLabel="Nova Integração"
        emptyIcon="🔌"
      />
    </div>
  );
}
