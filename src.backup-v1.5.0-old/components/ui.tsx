"use client";

import { cn } from "@/lib/format";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useEffect } from "react";

/* ---------------- Card ---------------- */
export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------------- Button ---------------- */
type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline" | "success";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 shadow-sm shadow-cyan-500/25",
  secondary: "bg-slate-800 text-white hover:bg-slate-700",
  success:
    "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400 shadow-sm shadow-emerald-500/25",
  ghost: "text-slate-600 hover:bg-slate-100",
  danger: "bg-rose-500 text-white hover:bg-rose-400 shadow-sm shadow-rose-500/20",
  outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ---------------- Inputs ---------------- */
const fieldBase =
  "w-full rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/15 transition-colors";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, "h-10 px-3", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "px-3 py-2", className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldBase, "h-10 px-3", className)} {...props}>
      {children}
    </select>
  );
}

export function Field({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

/* ---------------- Badge ---------------- */
export type BadgeColor =
  | "slate"
  | "green"
  | "amber"
  | "red"
  | "blue"
  | "violet"
  | "cyan";

export function Badge({
  children,
  color = "slate",
  className,
}: {
  children: ReactNode;
  color?: BadgeColor;
  className?: string;
}) {
  const colors: Record<BadgeColor, string> = {
    slate: "bg-slate-100 text-slate-600 ring-slate-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    red: "bg-rose-50 text-rose-700 ring-rose-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    violet: "bg-violet-50 text-violet-700 ring-violet-200",
    cyan: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        colors[color],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ---------------- Stat ---------------- */
export type StatAccent = "blue" | "cyan" | "amber" | "rose" | "emerald" | "violet";

export function Stat({
  label,
  value,
  icon,
  trend,
  accent = "cyan",
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  trend?: ReactNode;
  accent?: StatAccent;
}) {
  const accents: Record<StatAccent, string> = {
    blue: "from-blue-500 to-indigo-500 shadow-blue-500/25",
    cyan: "from-cyan-400 to-blue-500 shadow-cyan-500/25",
    amber: "from-amber-400 to-orange-500 shadow-amber-500/25",
    rose: "from-rose-400 to-pink-500 shadow-rose-500/25",
    emerald: "from-emerald-400 to-teal-500 shadow-emerald-500/25",
    violet: "from-violet-500 to-fuchsia-500 shadow-violet-500/25",
  };
  return (
    <Card className="p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <p className="mt-1.5 truncate text-2xl font-extrabold text-slate-800">
            {value}
          </p>
          {trend && <div className="mt-1 text-xs text-slate-400">{trend}</div>}
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xl shadow-lg",
              accents[accent]
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ---------------- Modal ---------------- */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const widths = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-3 backdrop-blur-sm sm:p-6">
      <div
        className={cn(
          "animate-in relative flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]",
          widths[size]
        )}
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-5 py-4">
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 text-lg ring-1 ring-cyan-100">
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- Empty state ---------------- */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && <div className="mb-3 text-4xl opacity-50">{icon}</div>}
      <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ---------------- Page header ---------------- */
export function PageHeader({
  title,
  description,
  icon,
  eyebrow,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  eyebrow?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-600">
            {eyebrow}
          </p>
        )}
        <h1 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-slate-800">
          {icon && <span className="text-2xl">{icon}</span>}
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/* ---------------- Info banner ---------------- */
export function InfoBanner({
  children,
  icon = "💡",
}: {
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50/80 to-blue-50/40 px-4 py-3">
      <span className="text-base leading-5">{icon}</span>
      <div className="text-[13px] leading-relaxed text-slate-600">{children}</div>
    </div>
  );
}
