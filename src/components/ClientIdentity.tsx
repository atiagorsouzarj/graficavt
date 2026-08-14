import type { ReactNode } from "react";
import { cn } from "@/lib/format";
import { Badge } from "@/components/ui";

export type ClientLike = {
  id?: number | null;
  type?: string | null;
  name?: string | null;
  tradeName?: string | null;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  city?: string | null;
  state?: string | null;
  status?: string | null;
  tags?: string | null;
};

const STATUS = {
  lead: { label: "Lead", color: "amber" as const },
  ativo: { label: "Ativo", color: "green" as const },
  inativo: { label: "Inativo", color: "slate" as const },
  bloqueado: { label: "Bloqueado", color: "red" as const },
};

const cleanPhone = (value?: string | null) => String(value || "").replace(/\D/g, "");

export function clientInitials(name?: string | null) {
  const chunks = String(name || "Cliente")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (chunks.length === 1) return chunks[0].slice(0, 2).toUpperCase();
  return `${chunks[0]?.[0] || "C"}${chunks[chunks.length - 1]?.[0] || ""}`.toUpperCase();
}

export function customerDisplayName(customer?: ClientLike | null) {
  if (!customer) return "Cliente balcão";
  return customer.tradeName || customer.name || "Cliente balcão";
}

export function ClientAvatar({
  customer,
  size = "md",
  className,
}: {
  customer?: ClientLike | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "h-8 w-8 text-[10px]",
    md: "h-11 w-11 text-sm",
    lg: "h-14 w-14 text-base",
  };
  const isCompany = customer?.type === "pj";
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl font-extrabold text-white shadow-sm",
        isCompany
          ? "bg-gradient-to-br from-violet-500 to-fuchsia-500"
          : "bg-gradient-to-br from-cyan-500 to-blue-500",
        sizes[size],
        className
      )}
      aria-label={isCompany ? "Pessoa jurídica" : "Pessoa física"}
    >
      {clientInitials(customerDisplayName(customer))}
    </div>
  );
}

export function ClientIdentity({
  customer,
  variant = "compact",
  action,
  className,
}: {
  customer?: ClientLike | null;
  variant?: "compact" | "card" | "inline";
  action?: ReactNode;
  className?: string;
}) {
  const company = customer?.type === "pj";
  const status = STATUS[(customer?.status || "lead") as keyof typeof STATUS];
  const contact = customer?.whatsapp || customer?.phone;
  const location = [customer?.city, customer?.state].filter(Boolean).join(" / ");
  const tags = String(customer?.tags || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (variant === "inline") {
    return (
      <div className={cn("flex min-w-0 items-center gap-2", className)}>
        <ClientAvatar customer={customer} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-700">
            {customerDisplayName(customer)}
          </p>
          <p className="truncate text-[11px] text-slate-400">
            {company ? "Pessoa Jurídica" : "Pessoa Física"}
            {customer?.document ? ` · ${customer.document}` : ""}
          </p>
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <ClientAvatar customer={customer} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-base font-extrabold text-slate-800">
                  {customerDisplayName(customer)}
                </p>
                {company && customer?.name && customer.tradeName && (
                  <p className="truncate text-xs text-slate-400">{customer.name}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Badge color={company ? "violet" : "blue"}>{company ? "PJ" : "PF"}</Badge>
                {status && <Badge color={status.color}>{status.label}</Badge>}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-1.5 text-xs text-slate-500 sm:grid-cols-2">
              <p className="truncate">🪪 {customer?.document || "Documento não informado"}</p>
              <p className="truncate">💬 {contact || "Contato não informado"}</p>
              <p className="truncate">✉️ {customer?.email || "E-mail não informado"}</p>
              <p className="truncate">📍 {location || "Localização não informada"}</p>
            </div>
          </div>
        </div>
        {(tags.length > 0 || action) && (
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <div className="flex min-w-0 flex-wrap gap-1">
              {tags.map((tag) => (
                <span key={tag} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                  #{tag}
                </span>
              ))}
            </div>
            {action}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex min-w-0 items-center gap-3 rounded-xl border border-cyan-100 bg-gradient-to-r from-cyan-50/70 to-blue-50/40 px-3 py-2.5", className)}>
      <ClientAvatar customer={customer} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-slate-700">{customerDisplayName(customer)}</p>
          <Badge color={company ? "violet" : "blue"}>{company ? "PJ" : "PF"}</Badge>
        </div>
        <p className="truncate text-[11px] text-slate-500">
          {customer?.document || "Sem documento"}
          {contact ? ` · ${contact}` : ""}
        </p>
      </div>
      {action}
    </div>
  );
}

export function whatsappHref(customer?: ClientLike | null) {
  const phone = cleanPhone(customer?.whatsapp || customer?.phone);
  return phone.length >= 10 ? `https://wa.me/55${phone.replace(/^55/, "")}` : null;
}
