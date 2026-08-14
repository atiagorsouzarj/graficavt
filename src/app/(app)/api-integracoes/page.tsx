import Link from "next/link";
import { db } from "@/db";
import { apiIntegrations } from "@/db/schema";
import { ResourceTable, type FieldDef } from "@/components/ResourceTable";
import { Badge, Button, Card, CardHeader, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

const fields: FieldDef[] = [
  { name: "name", label: "Nome", type: "text", showInTable: true, colSpan: 2 },
  { name: "type", label: "Tipo", type: "select", default: "voip", showInTable: true, options: [
    { value: "voip", label: "VoIP / Telefonia" },
    { value: "portal", label: "Portal do Cliente" },
  ] },
  { name: "endpoint", label: "Endpoint / API URL", type: "text", showInTable: true, colSpan: 2 },
  { name: "apiKey", label: "Token / API Key", type: "text", colSpan: 2 },
  { name: "webhook", label: "Webhook de retorno", type: "text", colSpan: 2 },
  { name: "active", label: "Ativo", type: "select", default: "true", options: [{ value: "true", label: "Sim" }, { value: "false", label: "Não" }] },
];

const cards = [
  { icon: "📞", title: "VoIP / Telefonia", desc: "PABX e click-to-call isolados do ERP.", routes: ["POST /api/integrations/voip", "GET /api/integrations/voip"], env: ["VOIP_TOKEN", "VOIP_API_URL"] },
  { icon: "🌐", title: "Portal do Cliente", desc: "Portal externo consome catálogo e envia pedidos sem depender dos canais de comunicação.", routes: ["GET /api/portal?token=...", "POST /api/portal?token=..."], env: ["PORTAL_TOKEN"] },
];

export default async function IntegracoesPage() {
  const rows = await db.select().from(apiIntegrations);
  return <div>
    <PageHeader eyebrow="Infraestrutura" icon="🔌" title="API & Integrações" description="VoIP, Portal do Cliente e conexões externas. WhatsApp e e-mail vivem na Central de Comunicação." action={<Link href="/comunicacoes"><Button>📡 Central de Comunicação</Button></Link>} />
    <Card className="mb-6 overflow-hidden"><CardHeader title="WhatsApp e e-mail centralizados" action={<Badge color="cyan">MÓDULO INTERNO</Badge>} /><div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-cyan-100 text-2xl">📡</div><div className="min-w-0 flex-1"><p className="font-bold text-slate-800">Central de Comunicação</p><p className="mt-1 text-sm text-slate-500">QR Code Baileys, SMTP/Resend, templates, botões interativos, regras ERP/CRM, consentimentos, inbox e outbox ficam na Central.</p></div><Link href="/comunicacoes"><Button variant="outline">Abrir central →</Button></Link></div></Card>
    <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">{cards.map((card) => <Card key={card.title}><CardHeader title={<span className="flex items-center gap-2"><span className="text-xl">{card.icon}</span>{card.title}</span>} action={<Badge color="blue">endpoint</Badge>} /><div className="space-y-3 p-5"><p className="text-xs text-slate-500">{card.desc}</p><div>{card.routes.map((route) => <code key={route} className="mb-1 block rounded bg-slate-900 px-2 py-1 text-[11px] text-emerald-400">{route}</code>)}</div><div className="flex flex-wrap gap-1">{card.env.map((env) => <code key={env} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">{env}</code>)}</div></div></Card>)}</div>
    <ResourceTable resource="integrations" title="Conexões externas" description="Cadastre VoIP e Portal. Comunicação transacional não usa esta tela." fields={fields} rows={rows.filter((row) => row.type !== "whatsapp" && row.type !== "email")} searchKeys={["name", "type", "endpoint"]} newLabel="Nova Integração" emptyIcon="🔌" />
  </div>;
}
