"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/format";

export interface SearchOption {
  value: string;
  label: string;
  detail?: string;
  icon?: string;
}

/**
 * Seletor com busca instantânea para listas grandes (clientes, produtos,
 * serviços). Não exige biblioteca externa e suporta teclado básico.
 */
export function SearchCombobox({
  value,
  onChange,
  options,
  placeholder = "Buscar...",
  emptyLabel = "— Nenhum —",
  className,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SearchOption[];
  placeholder?: string;
  emptyLabel?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 60);
    return options
      .filter(
        (o) =>
          o.label.toLowerCase().includes(q) ||
          o.detail?.toLowerCase().includes(q)
      )
      .slice(0, 60);
  }, [options, query]);

  function choose(v: string) {
    onChange(v);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-left text-sm transition-colors hover:border-cyan-300 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/15 disabled:cursor-not-allowed disabled:bg-slate-50"
      >
        <span className="text-base">{selected?.icon || "🔎"}</span>
        <span className={cn("min-w-0 flex-1 truncate", selected ? "text-slate-700" : "text-slate-400")}>
          {selected?.label || emptyLabel}
        </span>
        <span className="text-xs text-slate-400">⌄</span>
      </button>

      {open && (
        <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs">🔍</span>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="h-9 w-full rounded-lg bg-slate-50 pl-8 pr-2 text-sm text-slate-700 outline-none ring-1 ring-slate-100 focus:bg-white focus:ring-cyan-300"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto p-1.5">
            <button
              type="button"
              onClick={() => choose("")}
              className={cn(
                "flex w-full items-center rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors",
                !value ? "bg-cyan-50 text-cyan-700" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              {emptyLabel}
            </button>
            {filtered.length === 0 ? (
              <p className="px-3 py-5 text-center text-xs text-slate-400">
                Nenhum resultado.
              </p>
            ) : (
              filtered.map((o) => (
                <button
                  type="button"
                  key={o.value}
                  onClick={() => choose(o.value)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
                    value === o.value
                      ? "bg-cyan-50 text-cyan-800"
                      : "hover:bg-slate-50"
                  )}
                >
                  <span className="text-base">{o.icon || "•"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-700">
                      {o.label}
                    </span>
                    {o.detail && (
                      <span className="block truncate text-[11px] text-slate-400">
                        {o.detail}
                      </span>
                    )}
                  </span>
                  {value === o.value && <span className="text-cyan-600">✓</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
