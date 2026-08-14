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
