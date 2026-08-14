"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/format";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}
interface NavGroup {
  title: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    title: "Visão Geral",
    items: [
      { label: "Dashboard", href: "/", icon: "📊" },
      { label: "Relatórios", href: "/relatorios", icon: "📈" },
    ],
  },
  {
    title: "Comercial",
    items: [
      { label: "PDV · Novo pedido", href: "/pdv", icon: "🧾" },
      { label: "Orçamentos", href: "/orcamentos", icon: "📋" },
      { label: "Kanban produção", href: "/kanban", icon: "🗂️" },
      { label: "Clientes (CRM)", href: "/clientes", icon: "👥" },
      { label: "Financeiro", href: "/financeiro", icon: "💰" },
    ],
  },
  {
    title: "Catálogo & Produção",
    items: [
      { label: "Produtos", href: "/produtos", icon: "🏷️" },
      { label: "Materiais / Estoque", href: "/materiais", icon: "📦" },
      { label: "Movimentação de Estoque", href: "/estoque", icon: "🔄" },
      { label: "Impressoras & Tintas", href: "/impressoras", icon: "🖨️" },
      { label: "Tabelas de preços", href: "/tabelas-precos", icon: "📊" },
      { label: "Acabamentos", href: "/acabamentos", icon: "✂️" },
      { label: "Serviços", href: "/servicos", icon: "🛠️" },
    ],
  },
  {
    title: "Comunicação",
    items: [
      { label: "Integrações", href: "/api-integracoes", icon: "🔌" },
      { label: "Painel de controle", href: "/configuracoes", icon: "⚙️" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const content = (
    <>
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 text-lg shadow-md shadow-fuchsia-500/20">
          🖨️
        </div>
        <div className="min-w-0">
          <p className="truncate bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-[15px] font-extrabold leading-tight text-transparent">
            VTDigital Art Studio
          </p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Gráfica · Papelaria · 3D
          </p>
        </div>
      </div>

      <nav className="sidebar-scroll flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
                      active
                        ? "bg-gradient-to-r from-cyan-50 to-transparent text-slate-800"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-cyan-400 to-blue-500" />
                    )}
                    <span className="text-base leading-none transition-transform duration-150 group-hover:scale-110">
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-100 px-5 py-3">
        <p className="text-[10px] text-slate-400">
          GrafCenter <span className="font-semibold text-slate-500">v1.3.0</span>
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 text-sm">
            🖨️
          </div>
          <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text font-extrabold text-transparent">
            VTDigital
          </span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500"
        >
          ☰
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white shadow-2xl">
            {content}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="no-print hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        {content}
      </aside>
    </>
  );
}
