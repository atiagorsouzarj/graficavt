"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "@/lib/mutate";
import { renderTemplate, TEMPLATE_VARIABLES } from "@/lib/communication-template";
import { ClientIdentity } from "@/components/ClientIdentity";
import { SearchCombobox } from "@/components/SearchCombobox";
import { Badge, Button, Card, CardHeader, Field, Input, Modal, PageHeader, Select, Textarea } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;
type Tab = "canais" | "templates" | "regras" | "fila" | "inbox" | "consentimentos";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "canais", label: "Canais", icon: "📡" },
  { id: "templates", label: "Templates", icon: "📝" },
  { id: "regras", label: "Regras", icon: "⚙️" },
  { id: "fila", label: "Fila", icon: "📤" },
  { id: "inbox", label: "Inbox", icon: "📥" },
  { id: "consentimentos", label: "Consentimentos", icon: "🛡️" },
];

const statusColor: Record<string, "slate" | "blue" | "green" | "amber" | "red" | "cyan" | "violet"> = {
  CONNECTED: "green", READY: "green", DISABLED: "slate", QR_READY: "amber", CONNECTING: "blue", RECONNECTING: "amber", LOGGED_OUT: "red", CONFIGURATION_REQUIRED: "amber", STOPPED: "slate",
  draft: "slate", queued: "blue", processing: "amber", sent: "cyan", delivered: "green", read: "green", received: "violet", failed: "red", cancelled: "slate", suppressed: "red",
};

const EVENT_OPTIONS = [
  ["quote.sent", "Orçamento enviado"],
  ["order.confirmed", "Pedido confirmado"],
  ["art.requested", "Arte para aprovação"],
  ["delivery.in_route", "Entrega em rota"],
  ["delivery.delivered", "Entrega concluída"],
] as const;

export function CommunicationCenter({ data }: { data: AnyRow }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("canais");
  const [templateModal, setTemplateModal] = useState<AnyRow | "new" | null>(null);
  const [ruleModal, setRuleModal] = useState<AnyRow | "new" | null>(null);
  const [channelModal, setChannelModal] = useState<AnyRow | "new" | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { channels, templates, rules, outbox, inbox, consents, customers, policy = {} } = data;
  const demoMode = policy.communication_demo_mode === "true";
  const stats = useMemo(() => ({
    activeChannels: channels.filter((channel: AnyRow) => channel.enabled).length,
    queued: outbox.filter((item: AnyRow) => ["queued", "processing", "draft"].includes(item.status)).length,
    failed: outbox.filter((item: AnyRow) => item.status === "failed").length,
    inboxUnread: inbox.filter((item: AnyRow) => !item.readAt).length,
  }), [channels, outbox, inbox]);

  async function actionOutbox(id: number, op: "approve" | "cancel" | "retry") {
    try { await mutate("communication-outbox", op as never, undefined, id); router.refresh(); } catch (error) { alert(error instanceof Error ? error.message : "Erro na fila."); }
  }
  async function toggleChannel(channel: AnyRow) {
    await mutate("communication-channels", "update", { enabled: !channel.enabled }, channel.id);
    router.refresh();
  }
  async function toggleRule(rule: AnyRow) {
    await mutate("communication-rules", "update", { enabled: !rule.enabled }, rule.id);
    router.refresh();
  }
  async function requestQr() {
    try {
      const response = await fetch("/api/communication/whatsapp/reset", { method: "POST" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Não foi possível solicitar QR.");
      alert("Novo QR solicitado. Se o gateway estiver em produção, o código aparecerá neste card em alguns segundos.");
      setTimeout(() => router.refresh(), 1200);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao solicitar QR.");
    }
  }

  return <div>
    <PageHeader eyebrow="Automação & Relacionamento" icon="📡" title="Central de Comunicação" description="Canais transacionais, templates versionados, regras de ERP/CRM, fila auditável e mensagens recebidas." action={<Button onClick={() => setComposeOpen(true)}>{demoMode ? "▶ Simular envio" : "＋ Enviar manualmente"}</Button>} />
    {demoMode && <div className="mb-5 flex items-start gap-3 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-cyan-50 p-4 text-sm text-violet-900"><span className="text-lg">🧪</span><div><p className="font-extrabold">Modo de demonstração seguro ativo</p><p className="mt-1 text-xs">Você pode renderizar e simular templates. Os registros aparecem como entregues na fila, mas nenhum WhatsApp, SMTP ou Resend é chamado. Desative em Painel de Controle → Política de Comunicação antes de produção real.</p></div></div>}
    <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4"><Metric label="Canais ativos" value={stats.activeChannels} icon="📡" color="cyan" /><Metric label="Fila pendente" value={stats.queued} icon="📤" color="amber" /><Metric label="Falhas" value={stats.failed} icon="⚠️" color="red" /><Metric label="Inbox não lido" value={stats.inboxUnread} icon="📥" color="violet" /></div>
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[220px_1fr]">
      <Card className="h-fit"><div className="p-2">{TABS.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition-colors ${tab === item.id ? "bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-800" : "text-slate-500 hover:bg-slate-50"}`}><span className="text-lg">{item.icon}</span>{item.label}{tab === item.id && <span className="ml-auto h-2 w-2 rounded-full bg-cyan-500" />}</button>)}</div></Card>
      <div className="space-y-6">
        {tab === "canais" && <ChannelsTab channels={channels} onEdit={setChannelModal} onCreate={() => setChannelModal("new")} onToggle={toggleChannel} onResetQr={requestQr} />}
        {tab === "templates" && <TemplatesTab templates={templates} onEdit={setTemplateModal} />}
        {tab === "regras" && <RulesTab rules={rules} templates={templates} onEdit={setRuleModal} onToggle={toggleRule} />}
        {tab === "fila" && <OutboxTab outbox={outbox} customers={customers} onAction={actionOutbox} />}
        {tab === "inbox" && <InboxTab inbox={inbox} customers={customers} />}
        {tab === "consentimentos" && <ConsentTab consents={consents} customers={customers} router={router} />}
      </div>
    </div>
    {templateModal && <TemplateModal template={templateModal === "new" ? null : templateModal} onClose={() => setTemplateModal(null)} onSaved={() => { setTemplateModal(null); router.refresh(); }} />}
    {ruleModal && <RuleModal rule={ruleModal === "new" ? null : ruleModal} templates={templates} onClose={() => setRuleModal(null)} onSaved={() => { setRuleModal(null); router.refresh(); }} />}
    {channelModal && <ChannelModal channel={channelModal === "new" ? null : channelModal} onClose={() => setChannelModal(null)} onSaved={() => { setChannelModal(null); router.refresh(); }} />}
    {composeOpen && <ComposeModal channels={channels} templates={templates} customers={customers} demoMode={demoMode} onClose={() => setComposeOpen(false)} onSaved={() => { setComposeOpen(false); router.refresh(); }} />}
  </div>;
}

function Metric({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: "cyan" | "amber" | "red" | "violet" }) { const style = { cyan: "border-cyan-100 bg-cyan-50", amber: "border-amber-100 bg-amber-50", red: "border-rose-100 bg-rose-50", violet: "border-violet-100 bg-violet-50" }; return <div className={`rounded-2xl border p-4 ${style[color]}`}><p className="text-xl">{icon}</p><p className="mt-1 text-[11px] font-bold uppercase text-slate-500">{label}</p><p className="mt-1 text-xl font-extrabold text-slate-800">{value}</p></div>; }

function ChannelsTab({
  channels,
  onEdit,
  onCreate,
  onToggle,
  onResetQr,
}: {
  channels: AnyRow[];
  onEdit: (channel: AnyRow) => void;
  onCreate: () => void;
  onToggle: (channel: AnyRow) => void;
  onResetQr: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={onCreate}>＋ Adicionar canal</Button>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {channels.map((channel) => {
          const runtime = channel.runtime || {};
          const state = runtime.state || (channel.enabled ? "STARTING" : "DISABLED");
          const isWhatsApp = channel.channel === "whatsapp";
          return (
            <Card key={channel.id} className="overflow-hidden">
              <div className={`h-1.5 ${isWhatsApp ? "bg-emerald-500" : "bg-blue-500"}`} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{isWhatsApp ? "💬" : "✉️"}</span>
                    <div><p className="text-lg font-extrabold text-slate-800">{channel.name}</p><p className="text-xs text-slate-400">{channel.provider}</p></div>
                  </div>
                  <Badge color={statusColor[state] || "slate"}>{state}</Badge>
                </div>
                <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                  <p><strong>Remetente:</strong> {channel.fromName || "Não definido"} {channel.fromAddress || channel.fromPhone ? `· ${channel.fromAddress || channel.fromPhone}` : ""}</p>
                  {channel.lastError && <p className="mt-2 text-rose-600"><strong>Último erro:</strong> {channel.lastError}</p>}
                  {runtime.workerHeartbeatAt && <p className="mt-2 text-slate-400">Heartbeat do worker: {formatDateTime(runtime.workerHeartbeatAt)}</p>}
                </div>
                {isWhatsApp && runtime.qrDataUrl && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center"><p className="mb-2 text-xs font-bold text-amber-800">QR temporário — WhatsApp → Dispositivos conectados</p><img src={runtime.qrDataUrl} alt="QR Code WhatsApp" className="mx-auto h-52 w-52 rounded-lg bg-white p-2" /><p className="mt-2 text-[10px] text-amber-700">Nunca compartilhe este QR. Ele concede acesso à sessão do número.</p></div>}
                {isWhatsApp && !runtime.qrDataUrl && state !== "CONNECTED" && <div className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-4 text-center text-xs text-slate-500"><p className="font-bold text-slate-600">QR ainda não disponível</p><p className="mt-1">Habilite o canal, inicie <code>grafcenter-whatsapp</code> no PM2 e clique em “Gerar novo QR”.</p></div>}
                {!isWhatsApp && <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800"><strong>{channel.provider === "smtp" ? "SMTP" : "Resend"}:</strong> configure o provedor em “Configurar” e inicie o worker <code>grafcenter-email</code>.</div>}
                <div className="mt-5 flex flex-wrap justify-between gap-2"><div className="flex gap-2"><Button variant={channel.enabled ? "outline" : "success"} onClick={() => onToggle(channel)}>{channel.enabled ? "Desabilitar" : "Habilitar"}</Button>{isWhatsApp && channel.enabled && <Button variant="outline" onClick={onResetQr}>🔄 Gerar novo QR</Button>}</div><Button variant="outline" onClick={() => onEdit(channel)}>Configurar</Button></div>
              </div>
            </Card>
          );
        })}
      </div>
      {channels.length === 0 && <Card><div className="p-12 text-center text-sm text-slate-400">Nenhum canal cadastrado. Adicione WhatsApp ou E-mail para começar.</div></Card>}
    </div>
  );
}
function TemplatesTab({ templates, onEdit }: { templates: AnyRow[]; onEdit: (template: AnyRow | "new") => void }) { return <Card className="overflow-hidden"><CardHeader title="Templates versionados" subtitle="Toda edição gera uma nova versão ao alterar assunto ou conteúdo." action={<Button size="sm" onClick={() => onEdit("new")}>＋ Template</Button>} /><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-slate-50 text-left text-[11px] uppercase text-slate-500"><th className="px-4 py-3">Canal</th><th className="px-4 py-3">Template</th><th className="px-4 py-3">Evento</th><th className="px-4 py-3">Versão</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" /></tr></thead><tbody className="divide-y divide-slate-50">{templates.map((template) => <tr key={template.id} className="hover:bg-cyan-50/30"><td className="px-4 py-3"><Badge color={template.channel === "whatsapp" ? "green" : "blue"}>{template.channel}</Badge></td><td className="px-4 py-3"><p className="font-bold text-slate-700">{template.name}</p><p className="text-[11px] text-slate-400">{template.key}</p></td><td className="px-4 py-3 text-slate-500">{template.category}</td><td className="px-4 py-3">v{template.version}</td><td className="px-4 py-3"><Badge color={template.active ? "green" : "slate"}>{template.active ? "ativo" : "inativo"}</Badge></td><td className="px-4 py-3 text-right"><button onClick={() => onEdit(template)} className="text-xs font-bold text-cyan-600 hover:underline">Editar / Preview</button></td></tr>)}</tbody></table></div></Card>; }

function RulesTab({ rules, templates, onEdit, onToggle }: { rules: AnyRow[]; templates: AnyRow[]; onEdit: (rule: AnyRow | "new") => void; onToggle: (rule: AnyRow) => void }) { return <Card className="overflow-hidden"><CardHeader title="Regras automáticas" subtitle="Eventos do ERP enfileiram mensagens somente com regra, canal ativo e consentimento." action={<Button size="sm" onClick={() => onEdit("new")}>＋ Regra</Button>} /><div className="divide-y divide-slate-50">{rules.map((rule) => { const template = templates.find((t) => t.id === rule.templateId); return <div key={rule.id} className="flex flex-wrap items-center gap-3 px-5 py-4"><div className="min-w-[180px]"><p className="text-sm font-bold text-slate-700">{EVENT_OPTIONS.find(([id]) => id === rule.eventType)?.[1] || rule.eventType}</p><p className="text-[11px] text-slate-400">{rule.channel} · atraso {rule.delaySeconds}s</p></div><div className="min-w-0 flex-1"><p className="truncate text-sm text-slate-600">{template?.name || "Template removido"}</p><p className="text-[11px] text-slate-400">Consentimento: {rule.requireConsent ? "obrigatório" : "dispensado"} · Aprovação: {rule.requireHumanApproval ? "manual" : "automática"}</p></div><Badge color={rule.enabled ? "green" : "slate"}>{rule.enabled ? "ativa" : "pausada"}</Badge><button onClick={() => onToggle(rule)} className="text-xs font-bold text-cyan-600 hover:underline">{rule.enabled ? "Pausar" : "Ativar"}</button><button onClick={() => onEdit(rule)} className="text-xs font-bold text-slate-600 hover:underline">Editar</button></div>; })}{rules.length === 0 && <p className="px-5 py-12 text-center text-sm text-slate-400">Nenhuma regra criada.</p>}</div></Card>; }

function OutboxTab({ outbox, customers, onAction }: { outbox: AnyRow[]; customers: AnyRow[]; onAction: (id: number, op: "approve" | "cancel" | "retry") => void }) { return <Card className="overflow-hidden"><CardHeader title="Fila transacional / Outbox" subtitle="Workers separados processam mensagens enfileiradas; nunca as rotas de ERP." /><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-slate-50 text-left text-[11px] uppercase text-slate-500"><th className="px-4 py-3">Canal</th><th className="px-4 py-3">Destinatário</th><th className="px-4 py-3">Evento</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Tent.</th><th className="px-4 py-3" /></tr></thead><tbody className="divide-y divide-slate-50">{outbox.map((item) => { const customer = customers.find((c) => c.id === item.customerId); return <tr key={item.id} className="hover:bg-cyan-50/30"><td className="px-4 py-3"><Badge color={item.channel === "whatsapp" ? "green" : "blue"}>{item.channel}</Badge></td><td className="px-4 py-3">{customer ? <ClientIdentity customer={customer} variant="inline" /> : <span className="text-xs text-slate-500">{item.recipient}</span>}</td><td className="px-4 py-3 text-slate-500">{item.eventType || "manual"}</td><td className="px-4 py-3"><Badge color={statusColor[item.status] || "slate"}>{item.status}</Badge>{item.lastError && <p className="mt-1 max-w-[180px] truncate text-[10px] text-rose-600">{item.lastError}</p>}</td><td className="px-4 py-3 text-slate-500">{item.attempts}/{item.maxAttempts}</td><td className="px-4 py-3 text-right">{item.status === "draft" && <button onClick={() => onAction(item.id, "approve")} className="mr-2 text-xs font-bold text-emerald-600 hover:underline">Aprovar</button>}{["queued", "draft", "processing"].includes(item.status) && <button onClick={() => onAction(item.id, "cancel")} className="mr-2 text-xs font-bold text-rose-600 hover:underline">Cancelar</button>}{item.status === "failed" && <button onClick={() => onAction(item.id, "retry")} className="text-xs font-bold text-cyan-600 hover:underline">Tentar novamente</button>}</td></tr>; })}</tbody></table></div></Card>; }

function InboxTab({ inbox, customers }: { inbox: AnyRow[]; customers: AnyRow[] }) { return <Card className="overflow-hidden"><CardHeader title="Inbox unificado" subtitle="Mensagens recebidas são registradas no Cliente 360 e no CRM." /><div className="divide-y divide-slate-50">{inbox.length === 0 ? <p className="px-5 py-12 text-center text-sm text-slate-400">Nenhuma mensagem recebida. Inicie o gateway WhatsApp para sincronizar a inbox.</p> : inbox.map((item) => { const customer = customers.find((c) => c.id === item.customerId); return <div key={item.id} className="flex gap-3 px-5 py-4"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50">💬</div><div className="min-w-0 flex-1"><div className="flex justify-between gap-2">{customer ? <ClientIdentity customer={customer} variant="inline" /> : <p className="text-sm font-bold text-slate-700">{item.sender}</p>}<span className="text-[11px] text-slate-400">{formatDateTime(item.createdAt)}</span></div><p className="mt-2 text-sm text-slate-600">{item.body || "[sem conteúdo]"}</p></div></div>; })}</div></Card>; }

function ConsentTab({ consents, customers, router }: { consents: AnyRow[]; customers: AnyRow[]; router: ReturnType<typeof useRouter> }) { async function revoke(consent: AnyRow) { await mutate("customer-consents", "update", { status: consent.status === "granted" ? "revoked" : "granted", revokedAt: consent.status === "granted" ? new Date() : null, grantedAt: consent.status === "granted" ? consent.grantedAt : new Date() }, consent.id); router.refresh(); } return <Card className="overflow-hidden"><CardHeader title="Consentimentos" subtitle="Transacional e marketing são separados. Marketing não deve ser usado sem opt-in explícito." /><div className="divide-y divide-slate-50">{consents.map((consent) => { const customer = customers.find((c) => c.id === consent.customerId); return <div key={consent.id} className="flex flex-wrap items-center gap-3 px-5 py-3">{customer ? <ClientIdentity customer={customer} variant="inline" className="min-w-[210px] flex-1" /> : <span className="flex-1 text-sm text-slate-400">Cliente removido</span>}<Badge color={consent.channel === "whatsapp" ? "green" : "blue"}>{consent.channel}</Badge><Badge color={consent.kind === "transactional" ? "cyan" : "violet"}>{consent.kind}</Badge><Badge color={consent.status === "granted" ? "green" : "red"}>{consent.status}</Badge><button onClick={() => revoke(consent)} className="text-xs font-bold text-cyan-600 hover:underline">{consent.status === "granted" ? "Revogar" : "Conceder"}</button></div>; })}</div></Card>; }

function ChannelModal({
  channel,
  onClose,
  onSaved,
}: {
  channel: AnyRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    channel: channel?.channel || "whatsapp",
    name: channel?.name || "",
    provider: channel?.provider || "baileys",
    fromName: channel?.fromName || "",
    fromAddress: channel?.fromAddress || "",
    fromPhone: channel?.fromPhone || "",
  });
  const [saving, setSaving] = useState(false);
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const isEmail = form.channel === "email";

  async function save() {
    if (!form.name) return alert("Informe o nome do canal.");
    setSaving(true);
    try {
      const data = {
        ...form,
        provider: isEmail ? form.provider : "baileys",
        enabled: channel?.enabled || false,
        runtime: channel?.runtime || { state: "DISABLED" },
        config: channel?.config || {},
      };
      if (channel) await mutate("communication-channels", "update", data, channel.id);
      else await mutate("communication-channels", "create", data);
      onSaved();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao salvar canal.");
    } finally { setSaving(false); }
  }

  return (
    <Modal open onClose={onClose} icon={isEmail ? "✉️" : "💬"} title={channel ? `Configurar ${channel.name}` : "Adicionar canal"} subtitle="Credenciais ficam somente no ambiente do worker, nunca no banco ou navegador." size="lg">
      <div className="space-y-4">
        {!channel && <Field label="Tipo de canal"><Select value={form.channel} onChange={(e) => { const value = e.target.value; setForm((current) => ({ ...current, channel: value, provider: value === "email" ? "resend" : "baileys", name: value === "email" ? "E-mail Transacional" : "WhatsApp Transacional" })); }}><option value="whatsapp">WhatsApp</option><option value="email">E-mail</option></Select></Field>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome do canal"><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
          {isEmail ? <Field label="Provedor de e-mail"><Select value={form.provider} onChange={(e) => set("provider", e.target.value)}><option value="resend">Resend API</option><option value="smtp">SMTP próprio</option></Select></Field> : <Field label="Gateway"><div className="flex h-10 items-center rounded-xl bg-slate-50 px-3 text-sm font-semibold text-slate-600">Baileys / QR Code</div></Field>}
          <Field label="Nome do remetente"><Input value={form.fromName} onChange={(e) => set("fromName", e.target.value)} placeholder="VTDigital Art Studio" /></Field>
          {isEmail ? <Field label="E-mail remetente"><Input type="email" value={form.fromAddress} onChange={(e) => set("fromAddress", e.target.value)} placeholder="atendimento@seudominio.com.br" /></Field> : <Field label="Número WhatsApp"><Input value={form.fromPhone} onChange={(e) => set("fromPhone", e.target.value.replace(/\D/g, ""))} placeholder="5511999999999" /></Field>}
        </div>
        {isEmail && form.provider === "resend" && <ProviderHelp type="resend" />}
        {isEmail && form.provider === "smtp" && <ProviderHelp type="smtp" />}
        {!isEmail && <ProviderHelp type="whatsapp" />}
      </div>
      <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={save} disabled={saving}>{saving ? "Salvando..." : channel ? "Salvar canal" : "Criar canal"}</Button></div>
    </Modal>
  );
}

function ProviderHelp({ type }: { type: "resend" | "smtp" | "whatsapp" }) {
  if (type === "resend") return <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-900"><p className="font-bold">Configuração Resend</p><ol className="mt-2 list-decimal space-y-1 pl-4"><li>Verifique domínio e publique SPF, DKIM e DMARC.</li><li>Defina <code>RESEND_API_KEY</code> e <code>EMAIL_FROM</code> no .env.</li><li>Crie webhook para <code>/api/webhooks/resend</code> e defina <code>RESEND_WEBHOOK_SECRET</code>.</li><li>Inicie <code>grafcenter-email</code> no PM2.</li></ol></div>;
  if (type === "smtp") return <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-900"><p className="font-bold">Configuração SMTP</p><pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 text-[11px] text-cyan-300">{`SMTP_HOST=smtp.seudominio.com.br
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=atendimento@seudominio.com.br
SMTP_PASS=senha_de_aplicativo
SMTP_FROM=VTDigital Art Studio <atendimento@seudominio.com.br>`}</pre><p className="mt-2">Após salvar, reinicie <code>grafcenter-email</code>.</p></div>;
  return <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-xs text-emerald-900"><p className="font-bold">Ativação QR Code em produção</p><ol className="mt-2 list-decimal space-y-1 pl-4"><li>Salve e habilite o canal.</li><li>Crie <code>data/whatsapp-auth</code> com <code>chmod 700</code>.</li><li>Execute <code>npx pm2 start ecosystem.config.cjs --only grafcenter-whatsapp</code>.</li><li>No card do canal, clique em “Gerar novo QR”.</li><li>Leia com WhatsApp → Dispositivos conectados.</li></ol></div>;
}
function TemplateModal({ template, onClose, onSaved }: { template: AnyRow | null; onClose: () => void; onSaved: () => void }) { const [form, setForm] = useState({ channel: template?.channel || "whatsapp", kind: template?.kind || "transactional", key: template?.key || "", name: template?.name || "", category: template?.category || "orcamento", subject: template?.subject || "", body: template?.body || "", active: String(template?.active ?? true), previewData: JSON.stringify(template?.previewData || { cliente: { primeiro_nome: "João" }, empresa: { nome: "VTDigital Art Studio" }, orcamento: { numero: "ORC-2026-0001", total: "R$ 120,00", validade: "20/08/2026", itens: "• 200 Adesivos\n• Recorte eletrônico", pagamento: "PIX" }, pedido: { numero: "PED-2026-0001", prazo: "22/08/2026", total: "R$ 397,73", producao_status: "Aguardando" }, arte: { nome: "arte-v1.pdf", link: "https://exemplo.com/arte.pdf" }, entrega: { metodo: "Motoboy", previsao: "Hoje", rastreio: "" } }, null, 2) }); const [saving, setSaving] = useState(false); const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value })); let preview: AnyRow = {}; try { preview = JSON.parse(form.previewData); } catch {} const rendered = renderTemplate(form.body, preview, { html: form.channel === "email" }); async function save() { let previewData = {}; try { previewData = JSON.parse(form.previewData); } catch { return alert("Preview JSON inválido."); } if (!form.key || !form.name || !form.body) return alert("Preencha chave, nome e conteúdo."); setSaving(true); try { const data = { ...form, active: form.active === "true", previewData, variables: TEMPLATE_VARIABLES }; if (template) await mutate("message-templates", "update", data, template.id); else await mutate("message-templates", "create", data); onSaved(); } catch (error) { alert(error instanceof Error ? error.message : "Erro ao salvar template."); } finally { setSaving(false); } } return <Modal open onClose={onClose} icon="📝" title={template ? "Editar template" : "Novo template"} subtitle="Variáveis são renderizadas em tempo real; mudanças de corpo geram nova versão." size="xl"><div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_.9fr]"><div className="space-y-4"><div className="grid grid-cols-2 gap-3"><Field label="Canal"><Select value={form.channel} onChange={(e) => set("channel", e.target.value)}><option value="whatsapp">WhatsApp</option><option value="email">E-mail</option></Select></Field><Field label="Categoria"><Select value={form.category} onChange={(e) => set("category", e.target.value)}><option value="orcamento">Orçamento</option><option value="pedido">Pedido</option><option value="arte">Arte</option><option value="entrega">Entrega</option><option value="financeiro">Financeiro</option><option value="pos_venda">Pós-venda</option></Select></Field></div><Field label="Chave única"><Input value={form.key} onChange={(e) => set("key", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))} placeholder="quote_whatsapp" /></Field><Field label="Nome"><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>{form.channel === "email" && <Field label="Assunto"><Input value={form.subject} onChange={(e) => set("subject", e.target.value)} /></Field>}<Field label="Conteúdo"><Textarea rows={14} value={form.body} onChange={(e) => set("body", e.target.value)} /></Field></div><div className="space-y-4"><Field label="Dados de preview (JSON)"><Textarea rows={10} value={form.previewData} onChange={(e) => set("previewData", e.target.value)} /></Field><div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="mb-2 text-xs font-bold uppercase text-slate-500">Preview</p>{form.channel === "email" ? <div className="rounded-lg bg-white p-3" dangerouslySetInnerHTML={{ __html: rendered }} /> : <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700">{rendered}</pre>}</div><div className="rounded-xl bg-cyan-50 p-3 text-[11px] text-cyan-800"><strong>Variáveis permitidas:</strong><br />{TEMPLATE_VARIABLES.join(" · ")}</div></div></div><div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar template"}</Button></div></Modal>; }

function RuleModal({ rule, templates, onClose, onSaved }: { rule: AnyRow | null; templates: AnyRow[]; onClose: () => void; onSaved: () => void }) { const [form, setForm] = useState({ eventType: rule?.eventType || "quote.sent", channel: rule?.channel || "whatsapp", templateId: String(rule?.templateId || ""), delaySeconds: String(rule?.delaySeconds || 0), requireConsent: String(rule?.requireConsent ?? true), requireHumanApproval: String(rule?.requireHumanApproval ?? false), enabled: String(rule?.enabled ?? true) }); const [saving, setSaving] = useState(false); const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value })); const options = templates.filter((template) => template.channel === form.channel).map((template) => ({ value: String(template.id), label: template.name, detail: `${template.category} · v${template.version}`, icon: "📝" })); async function save() { if (!form.templateId) return alert("Selecione um template."); setSaving(true); try { const data = { eventType: form.eventType, channel: form.channel, templateId: Number(form.templateId), delaySeconds: Number(form.delaySeconds || 0), requireConsent: form.requireConsent === "true", requireHumanApproval: form.requireHumanApproval === "true", enabled: form.enabled === "true" }; if (rule) await mutate("communication-rules", "update", data, rule.id); else await mutate("communication-rules", "create", data); onSaved(); } catch (error) { alert(error instanceof Error ? error.message : "Erro ao salvar regra."); } finally { setSaving(false); } } return <Modal open onClose={onClose} icon="⚙️" title={rule ? "Editar regra" : "Nova regra automática"} subtitle="A regra só enfileira quando o canal está ativo e o consentimento permite."><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="Evento"><Select value={form.eventType} onChange={(e) => set("eventType", e.target.value)}>{EVENT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field><Field label="Canal"><Select value={form.channel} onChange={(e) => { set("channel", e.target.value); set("templateId", ""); }}><option value="whatsapp">WhatsApp</option><option value="email">E-mail</option></Select></Field><Field label="Template" className="sm:col-span-2"><SearchCombobox value={form.templateId} onChange={(value) => set("templateId", value)} options={options} placeholder="Buscar template..." emptyLabel="— Selecione —" /></Field><Field label="Atraso (segundos)"><Input type="number" value={form.delaySeconds} onChange={(e) => set("delaySeconds", e.target.value)} /></Field><Field label="Consentimento obrigatório"><Select value={form.requireConsent} onChange={(e) => set("requireConsent", e.target.value)}><option value="true">Sim</option><option value="false">Não</option></Select></Field><Field label="Exige aprovação humana"><Select value={form.requireHumanApproval} onChange={(e) => set("requireHumanApproval", e.target.value)}><option value="false">Não, enfileirar</option><option value="true">Sim, criar rascunho</option></Select></Field><Field label="Regra ativa"><Select value={form.enabled} onChange={(e) => set("enabled", e.target.value)}><option value="true">Ativa</option><option value="false">Pausada</option></Select></Field></div><div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar regra"}</Button></div></Modal>; }

function ComposeModal({
  channels,
  templates,
  customers,
  demoMode,
  onClose,
  onSaved,
}: {
  channels: AnyRow[];
  templates: AnyRow[];
  customers: AnyRow[];
  demoMode: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [channel, setChannel] = useState("whatsapp");
  const [customerId, setCustomerId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [requireApproval, setRequireApproval] = useState("false");
  const [deliveryMode, setDeliveryMode] = useState(demoMode ? "demo" : "production");
  const [saving, setSaving] = useState(false);
  const active = channels.filter((item) => item.enabled).map((item) => item.channel);
  const customerOptions = customers.map((customer) => ({
    value: String(customer.id),
    label: customer.tradeName || customer.name,
    detail: [customer.document, customer.whatsapp || customer.email].filter(Boolean).join(" · "),
    icon: customer.type === "pj" ? "🏢" : "👤",
  }));
  const templateOptions = templates
    .filter((template) => template.channel === channel && template.active)
    .map((template) => ({
      value: String(template.id),
      label: template.name,
      detail: `${template.category} · v${template.version}`,
      icon: "📝",
    }));

  async function send() {
    if (!templateId) return alert("Escolha um template.");
    setSaving(true);
    try {
      const endpoint = deliveryMode === "demo" ? "/api/communication/demo" : "/api/communication/send";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          customerId: customerId || null,
          templateId: Number(templateId),
          recipient,
          requireApproval: requireApproval === "true",
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Erro ao processar mensagem.");
      onSaved();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao processar mensagem.");
    } finally {
      setSaving(false);
    }
  }

  const channelEnabled = active.includes(channel);
  return (
    <Modal
      open
      onClose={onClose}
      icon={deliveryMode === "demo" ? "🧪" : "📤"}
      title={deliveryMode === "demo" ? "Simular mensagem" : "Enviar mensagem manual"}
      subtitle={deliveryMode === "demo" ? "Nenhum canal externo será chamado; a entrega aparece na fila para inspeção." : "A mensagem entra na fila transacional e será processada pelo worker do canal."}
    >
      <div className="space-y-4">
        {demoMode && (
          <Field label="Modo de teste">
            <Select value={deliveryMode} onChange={(e) => setDeliveryMode(e.target.value)}>
              <option value="demo">Simular localmente — seguro</option>
              <option value="production" disabled={!channelEnabled}>Enfileirar para produção {channelEnabled ? "" : "(canal desabilitado)"}</option>
            </Select>
          </Field>
        )}
        <Field label="Canal">
          <Select value={channel} onChange={(e) => { setChannel(e.target.value); setTemplateId(""); }}>
            <option value="whatsapp" disabled={deliveryMode === "production" && !active.includes("whatsapp")}>WhatsApp {active.includes("whatsapp") ? "" : "(desabilitado)"}</option>
            <option value="email" disabled={deliveryMode === "production" && !active.includes("email")}>E-mail {active.includes("email") ? "" : "(desabilitado)"}</option>
          </Select>
        </Field>
        <Field label="Cliente">
          <SearchCombobox
            value={customerId}
            onChange={(value) => {
              setCustomerId(value);
              const customer = customers.find((item) => String(item.id) === value);
              if (customer) setRecipient(channel === "email" ? customer.email || "" : customer.whatsapp || customer.phone || "");
            }}
            options={customerOptions}
            placeholder="Buscar cliente..."
            emptyLabel="— Destinatário avulso —"
          />
        </Field>
        <Field label="Destinatário">
          <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder={channel === "email" ? "cliente@email.com" : "5511999999999"} />
        </Field>
        <Field label="Template">
          <SearchCombobox value={templateId} onChange={setTemplateId} options={templateOptions} placeholder="Buscar template..." emptyLabel="— Selecione —" />
        </Field>
        {deliveryMode === "production" && (
          <Field label="Aprovação humana">
            <Select value={requireApproval} onChange={(e) => setRequireApproval(e.target.value)}>
              <option value="false">Enviar assim que o worker processar</option>
              <option value="true">Criar rascunho para aprovação</option>
            </Select>
          </Field>
        )}
      </div>
      <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={send} disabled={saving || !templateId || !recipient}>{saving ? "Processando..." : deliveryMode === "demo" ? "Simular template" : "Enfileirar mensagem"}</Button>
      </div>
    </Modal>
  );
}
