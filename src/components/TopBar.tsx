"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SearchResult = Record<string, any>;

export function TopBar() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (q.trim().length < 2) { setResults([]); setOpen(false); return; }
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const json = await response.json();
        setResults(json.results || []);
        setOpen(true);
      } finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <header className="no-print sticky top-0 z-20 hidden border-b border-slate-200 bg-white/85 backdrop-blur-md lg:block">
      <div className="flex items-center gap-4 px-6 py-3">
        <div ref={ref} className="relative max-w-md flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">🔍</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => { if (results.length) setOpen(true); }}
            placeholder="Buscar pedido, cliente, produto..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-9 text-sm text-slate-700 placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/15"
          />
          {loading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-cyan-600">...</span>}
          {open && <div className="absolute z-40 mt-1 max-h-80 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">{results.length === 0 ? <p className="px-3 py-5 text-center text-xs text-slate-400">Nenhum resultado para “{q}”.</p> : results.map((result, index) => <Link key={`${result.type}-${index}`} href={result.href} onClick={() => { setOpen(false); setQ(""); }} className="flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors hover:bg-cyan-50"><span className="text-base">{result.icon}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-700">{result.label}</span><span className="block truncate text-[11px] text-slate-400">{result.type} · {result.detail}</span></span></Link>)}</div>}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5"><span className="text-sm">👑</span><span className="text-sm font-medium text-slate-700">Operador</span></div>
          <Link href="/orcamentos/new" className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 text-sm font-semibold text-white shadow-sm shadow-cyan-500/25 transition-all hover:from-cyan-400 hover:to-blue-400"><span>＋</span> Novo pedido</Link>
          <Link href="/api-integracoes" className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"><span>💬</span> WhatsApp</Link>
        </div>
      </div>
    </header>
  );
}
