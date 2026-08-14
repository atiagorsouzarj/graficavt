"use client";

import Link from "next/link";
import { useState } from "react";

export function TopBar() {
  const [q, setQ] = useState("");

  return (
    <header className="no-print sticky top-0 z-20 hidden border-b border-slate-200 bg-white/85 backdrop-blur-md lg:block">
      <div className="flex items-center gap-4 px-6 py-3">
        {/* Search */}
        <div className="relative max-w-md flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            🔍
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar pedido, cliente, produto..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/15"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Operator */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5">
            <span className="text-sm">👑</span>
            <span className="text-sm font-medium text-slate-700">Operador</span>
          </div>

          <Link
            href="/orcamentos/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 text-sm font-semibold text-white shadow-sm shadow-cyan-500/25 transition-all hover:from-cyan-400 hover:to-blue-400"
          >
            <span>＋</span> Novo pedido
          </Link>

          <Link
            href="/api-integracoes"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <span>💬</span> WhatsApp
          </Link>
        </div>
      </div>
    </header>
  );
}
