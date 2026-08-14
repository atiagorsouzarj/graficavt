"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppNotification = Record<string, any>;

const visual: Record<string, { icon: string; bg: string }> = {
  info: { icon: "ℹ️", bg: "bg-blue-50" },
  success: { icon: "✓", bg: "bg-emerald-50" },
  warning: { icon: "⚠️", bg: "bg-amber-50" },
  danger: { icon: "!", bg: "bg-rose-50" },
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        setItems(json.notifications || []);
        setUnread(json.unreadCount || 0);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 20000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function readAll() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "read-all" }),
    });
    await load();
  }

  async function markRead(item: AppNotification) {
    if (item.system || item.readAt) return;
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "read", id: item.id }),
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notificações"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) load();
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[1.9]" aria-hidden="true">
          <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[9px] font-extrabold leading-4 text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[390px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-extrabold text-slate-800">Notificações</p>
              <p className="text-[11px] text-slate-400">Atualização automática a cada 20 segundos</p>
            </div>
            <button onClick={readAll} className="text-xs font-bold text-cyan-600 hover:underline">Marcar lidas</button>
          </div>
          <div className="max-h-[420px] overflow-y-auto p-1.5">
            {loading ? <p className="px-4 py-8 text-center text-sm text-slate-400">Carregando...</p> : items.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-400">Tudo em ordem. Nenhuma notificação.</p> : items.map((item) => {
              const style = visual[item.type] || visual.info;
              const content = <><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${style.bg}`}>{style.icon}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="text-sm font-bold text-slate-700">{item.title}</p>{item.system && <span className="rounded bg-slate-100 px-1 text-[9px] font-bold text-slate-400">AUTO</span>}</div>{item.body && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{item.body}</p>}</div></>;
              const className = `flex gap-2.5 rounded-xl px-3 py-2.5 transition-colors ${item.readAt ? "opacity-60 hover:bg-slate-50" : "bg-cyan-50/40 hover:bg-cyan-50"}`;
              return item.href ? <Link key={String(item.id)} href={item.href} onClick={() => { markRead(item); setOpen(false); }} className={className}>{content}</Link> : <button key={String(item.id)} onClick={() => markRead(item)} className={`${className} w-full text-left`}>{content}</button>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
