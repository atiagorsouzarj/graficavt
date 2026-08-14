"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClientIdentity } from "@/components/ClientIdentity";
import { Button, Field, Modal, Select, Textarea } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

export function ReplyModal({
  item,
  customers,
  history,
  demoMode,
  onClose,
  onSent,
}: {
  item: Row;
  customers: Row[];
  history: Row[];
  demoMode: boolean;
  onClose: () => void;
  onSent: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState(demoMode ? "demo" : "production");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const customer = customers.find((c) => c.id === item.customerId) || null;
  const messages = useMemo(
    () => history.filter((message) => (item.customerId ? message.customerId === item.customerId : message.sender === item.sender)).slice(0, 20).reverse(),
    [history, item]
  );

  async function send() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const response = await fetch("/api/communication/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: item.customerId || null,
          recipient: item.sender,
          text,
          mode,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Erro ao responder.");
      onSent();
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao responder.");
    } finally {
      setSaving(false);
    }
  }

  return <Modal open onClose={onClose} icon="💬" title="Acompanhar conversa WhatsApp" subtitle={customer ? "Histórico do cliente e resposta pela Outbox." : "Conversa ainda não vinculada a um cliente."} size="lg">
    <div className="space-y-4">
      {customer ? <ClientIdentity customer={customer} variant="compact" /> : <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Número: {item.sender}</div>}
      <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl bg-[#efeae2] p-3">
        {messages.map((message) => <div key={message.id} className="rounded-xl rounded-tl-sm bg-white p-3 shadow-sm"><p className="whitespace-pre-wrap text-sm text-slate-700">{message.body || "[sem texto]"}</p><p className="mt-1 text-right text-[10px] text-slate-400">{formatDateTime(message.createdAt)}</p></div>)}
      </div>
      {demoMode && <Field label="Modo"><Select value={mode} onChange={(e) => setMode(e.target.value)}><option value="demo">Simular resposta local</option><option value="production">Enviar pelo gateway Baileys</option></Select></Field>}
      <Field label="Resposta"><Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Digite a resposta para o cliente..." /></Field>
      <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-3 text-xs text-cyan-800">A resposta será registrada na Outbox e no Cliente 360. Em produção, ela aguarda o worker Baileys; em demo, é marcada como entregue sem envio externo.</div>
    </div>
    <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={send} disabled={saving || !text.trim()}>{saving ? "Enviando..." : mode === "demo" ? "Simular resposta" : "Enviar resposta"}</Button></div>
  </Modal>;
}
