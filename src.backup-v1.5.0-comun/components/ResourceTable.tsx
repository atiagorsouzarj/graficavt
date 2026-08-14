"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "@/lib/mutate";
import {
  Button,
  Input,
  Select,
  Textarea,
  Field,
  Modal,
  Badge,
  Card,
  EmptyState,
  PageHeader,
  type BadgeColor,
} from "@/components/ui";
import { formatMoney, formatDate } from "@/lib/format";

export type FieldType =
  | "text"
  | "number"
  | "money"
  | "percent"
  | "textarea"
  | "select"
  | "date";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  default?: string;
  colSpan?: 1 | 2;
  showInTable?: boolean;
  moneyInTable?: boolean;
  hint?: string;
}

export interface ResourceTableProps {
  resource: string;
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: string;
  fields: FieldDef[];
  rows: Record<string, unknown>[];
  searchKeys: string[];
  newLabel?: string;
  emptyIcon?: string;
  badgeField?: {
    name: string;
    map: Record<string, { label: string; color: BadgeColor }>;
  };
  groupBy?: { name: string; labels: Record<string, string> };
  /** quando true, não renderiza o PageHeader interno (a página já mostra um) */
  hideHeader?: boolean;
}

function defaultForm(fields: FieldDef[]): Record<string, string> {
  const f: Record<string, string> = {};
  for (const fd of fields) {
    if (fd.type === "select" && fd.options?.length) {
      f[fd.name] = fd.default ?? fd.options[0].value;
    } else {
      f[fd.name] = fd.default ?? "";
    }
  }
  return f;
}

export function ResourceTable({
  resource,
  title,
  description,
  eyebrow,
  icon,
  fields,
  rows,
  searchKeys,
  newLabel = "Novo",
  emptyIcon = "📭",
  badgeField,
  groupBy,
  hideHeader,
}: ResourceTableProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, string>>(defaultForm(fields));
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [groupFilter, setGroupFilter] = useState("");

  const visibleCols = fields.filter((f) => f.showInTable);

  const filtered = useMemo(() => {
    let out = rows;
    if (groupBy && groupFilter) {
      out = out.filter((r) => String(r[groupBy.name]) === groupFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((r) =>
        searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q))
      );
    }
    return out;
  }, [rows, search, searchKeys, groupBy, groupFilter]);

  const groupValues = useMemo(() => {
    if (!groupBy) return [];
    return Array.from(new Set(rows.map((r) => String(r[groupBy.name] ?? ""))));
  }, [rows, groupBy]);

  function openNew() {
    setEditing(null);
    setForm(defaultForm(fields));
    setOpen(true);
  }

  function openEdit(row: Record<string, unknown>) {
    setEditing(row);
    const f: Record<string, string> = {};
    for (const fd of fields) {
      const v = row[fd.name];
      if (v === null || v === undefined) f[fd.name] = fd.default ?? "";
      else if (fd.type === "date") f[fd.name] = String(v).slice(0, 10);
      else f[fd.name] = String(v);
    }
    setForm(f);
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    try {
      if (editing) await mutate(resource, "update", form, Number(editing.id));
      else await mutate(resource, "create", form);
      setOpen(false);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Excluir este registro?")) return;
    try {
      await mutate(resource, "delete", undefined, id);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao excluir");
    }
  }

  function renderCell(fd: FieldDef, value: unknown) {
    if (value === null || value === undefined || value === "") return "—";
    if (fd.type === "select") {
      return fd.options?.find((o) => o.value === String(value))?.label || String(value);
    }
    if (fd.moneyInTable || fd.type === "money")
      return (
        <span className="font-semibold text-slate-700">
          {formatMoney(Number(value))}
        </span>
      );
    if (fd.type === "percent") return `${Number(value)}%`;
    if (fd.type === "date") return formatDate(String(value));
    return String(value);
  }

  return (
    <div>
      {!hideHeader ? (
        <PageHeader
          title={title}
          description={description}
          eyebrow={eyebrow}
          icon={icon}
          action={
            <Button onClick={openNew}>
              <span>＋</span> {newLabel}
            </Button>
          }
        />
      ) : (
        <div className="mb-4 flex justify-end">
          <Button onClick={openNew}>
            <span>＋</span> {newLabel}
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            🔍
          </span>
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {groupBy && groupValues.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setGroupFilter("")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                !groupFilter
                  ? "bg-cyan-500 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              Todos ({rows.length})
            </button>
            {groupValues.map((g) => {
              const count = rows.filter(
                (r) => String(r[groupBy.name]) === g
              ).length;
              return (
                <button
                  key={g}
                  onClick={() => setGroupFilter(g)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    groupFilter === g
                      ? "bg-cyan-500 text-white"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {groupBy.labels[g] || g} ({count})
                </button>
              );
            })}
          </div>
        )}
        <span className="ml-auto text-xs text-slate-400">
          {filtered.length} registro{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={emptyIcon}
            title="Nenhum registro"
            description="Cadastre seu primeiro item para começar."
            action={<Button onClick={openNew}>＋ {newLabel}</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-left">
                  {visibleCols.map((c) => (
                    <th
                      key={c.name}
                      className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500"
                    >
                      {c.label}
                    </th>
                  ))}
                  {badgeField && <th className="px-4 py-3" />}
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((row) => (
                  <tr
                    key={String(row.id)}
                    className="transition-colors hover:bg-cyan-50/30"
                  >
                    {visibleCols.map((c) => (
                      <td key={c.name} className="px-4 py-3 text-slate-600">
                        {renderCell(c, row[c.name])}
                      </td>
                    ))}
                    {badgeField && (
                      <td className="px-4 py-3">
                        {(() => {
                          const v = String(row[badgeField.name] ?? "");
                          const cfg = badgeField.map[v];
                          return cfg ? (
                            <Badge color={cfg.color}>{cfg.label}</Badge>
                          ) : (
                            <Badge>{v}</Badge>
                          );
                        })()}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(row)}
                          className="rounded-lg px-2.5 py-1 text-xs font-semibold text-cyan-700 transition-colors hover:bg-cyan-50"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => remove(Number(row.id))}
                          className="rounded-lg px-2.5 py-1 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Editar ${title}` : `Novo — ${title}`}
        subtitle={description}
        icon={icon}
        size="lg"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((fd) => (
            <div key={fd.name} className={fd.colSpan === 2 ? "sm:col-span-2" : ""}>
              <Field label={fd.label} hint={fd.hint}>
                {fd.type === "textarea" ? (
                  <Textarea
                    rows={3}
                    value={form[fd.name]}
                    onChange={(e) =>
                      setForm({ ...form, [fd.name]: e.target.value })
                    }
                  />
                ) : fd.type === "select" ? (
                  <Select
                    value={form[fd.name]}
                    onChange={(e) =>
                      setForm({ ...form, [fd.name]: e.target.value })
                    }
                  >
                    {fd.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    type={
                      fd.type === "number" ||
                      fd.type === "money" ||
                      fd.type === "percent"
                        ? "number"
                        : fd.type === "date"
                        ? "date"
                        : "text"
                    }
                    step={
                      fd.type === "money"
                        ? "0.0001"
                        : fd.type === "percent"
                        ? "0.01"
                        : "any"
                    }
                    value={form[fd.name]}
                    onChange={(e) =>
                      setForm({ ...form, [fd.name]: e.target.value })
                    }
                  />
                )}
              </Field>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
