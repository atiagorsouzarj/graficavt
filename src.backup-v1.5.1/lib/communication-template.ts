/**
 * Renderizador simples, previsível e seguro de templates.
 * Sintaxe aceita: {{cliente.nome}}, {{pedido.numero}}, {{empresa.nome}}
 * Variáveis são HTML-escapadas para e-mail; no WhatsApp o escape não altera
 * a legibilidade de texto comum.
 */

export type TemplateContext = Record<string, unknown>;

function valueAtPath(context: TemplateContext, path: string): unknown {
  return path
    .trim()
    .split(".")
    .reduce<unknown>((current, key) => {
      if (current && typeof current === "object") {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, context);
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderTemplate(
  source: string,
  context: TemplateContext,
  options: { html?: boolean } = {}
): string {
  return String(source || "").replace(/{{\s*([a-zA-Z0-9_.]+)\s*}}/g, (_match, path) => {
    const value = valueAtPath(context, path);
    const text = value === null || value === undefined ? "" : String(value);
    return options.html ? escapeHtml(text) : text;
  });
}

export type InteractiveButton = {
  type: "url" | "reply" | "list";
  label: string;
  url?: string;
  id?: string;
  sections?: { title: string; rows: { title: string; description?: string; id: string }[] }[];
};

export type InteractiveTemplate = {
  footer?: string;
  buttons?: InteractiveButton[];
};

/** Renderiza ações do template preservando IDs para o bot/inbox. */
export function renderInteractiveTemplate(
  interactive: unknown,
  context: TemplateContext
): InteractiveTemplate | null {
  if (!interactive || typeof interactive !== "object") return null;
  const raw = interactive as InteractiveTemplate;
  const buttons = (raw.buttons || []).map((button) => ({
    ...button,
    label: renderTemplate(button.label || "", context),
    url: button.url ? renderTemplate(button.url, context) : undefined,
    id: button.id ? renderTemplate(button.id, context) : undefined,
    sections: button.sections?.map((section) => ({
      title: renderTemplate(section.title || "", context),
      rows: section.rows.map((row) => ({
        title: renderTemplate(row.title || "", context),
        description: row.description ? renderTemplate(row.description, context) : undefined,
        id: renderTemplate(row.id || "", context),
      })),
    })),
  }));
  return { footer: raw.footer ? renderTemplate(raw.footer, context) : undefined, buttons };
}

export function extractTemplateVariables(source: string): string[] {
  const matches = String(source || "").matchAll(/{{\s*([a-zA-Z0-9_.]+)\s*}}/g);
  return Array.from(new Set(Array.from(matches, (match) => match[1])));
}

export const TEMPLATE_VARIABLES = [
  "cliente.nome",
  "cliente.primeiro_nome",
  "cliente.documento",
  "cliente.whatsapp",
  "empresa.nome",
  "empresa.email",
  "empresa.whatsapp",
  "empresa.site",
  "orcamento.numero",
  "orcamento.total",
  "orcamento.validade",
  "orcamento.link",
  "pedido.numero",
  "pedido.total",
  "pedido.prazo",
  "pedido.producao_status",
  "arte.link",
  "arte.nome",
  "entrega.metodo",
  "entrega.instrucao",
  "entrega.rastreio",
  "entrega.previsao",
] as const;
