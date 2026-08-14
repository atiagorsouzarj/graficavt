"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "@/lib/mutate";
import { Button, Input, Field, Modal, Badge } from "@/components/ui";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

const PRESET_ICONS = [
  "📁", "🖼️", "📇", "🎁", "🧵", "🧊", "🏷️", "📄", "🎨", "✂️",
  "🖨️", "📦", "🪧", "🧾", "🛠️", "💡", "🖇️", "🧷", "🌈", "⭐",
];

export function CategoryManager({
  module,
  moduleLabel,
  categories,
}: {
  module: "product" | "material" | "service" | "finishing" | "pricing_table";
  moduleLabel: string;
  categories: AnyRow[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📁");
  const [color, setColor] = useState("#06b6d4");
  const [saving, setSaving] = useState(false);

  function openNew() {
    setEditing(null);
    setName("");
    setIcon("📁");
    setColor("#06b6d4");
  }

  function openEdit(c: AnyRow) {
    setEditing(c);
    setName(c.name);
    setIcon(c.icon || "📁");
    setColor(c.color || "#06b6d4");
  }

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const data = { module, name: name.trim(), icon, color };
      if (editing) await mutate("item-categories", "update", data, editing.id);
      else await mutate("item-categories", "create", data);
      openNew();
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao salvar categoria");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Excluir categoria? Itens vinculados ficam sem categoria."))
      return;
    await mutate("item-categories", "delete", undefined, id);
    router.refresh();
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        🏷️ Categorias
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        icon="🏷️"
        title={`Categorias — ${moduleLabel}`}
        subtitle="Adicione, edite ou remova categorias livremente"
        size="lg"
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Form */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-slate-500">
              {editing ? "Editar categoria" : "Nova categoria"}
            </p>
            <div className="space-y-3">
              <Field label="Nome">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Papelaria Personalizada"
                />
              </Field>
              <Field label="Ícone">
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_ICONS.map((ic) => (
                    <button
                      key={ic}
                      onClick={() => setIcon(ic)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-all ${
                        icon === ic
                          ? "bg-cyan-100 ring-2 ring-cyan-400"
                          : "bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Cor">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-full cursor-pointer rounded-xl border border-slate-200"
                />
              </Field>
              <div className="flex gap-2 pt-1">
                {editing && (
                  <Button variant="outline" onClick={openNew} className="flex-1">
                    Cancelar edição
                  </Button>
                )}
                <Button onClick={save} disabled={saving || !name.trim()} className="flex-1">
                  {saving ? "Salvando..." : editing ? "Atualizar" : "＋ Adicionar"}
                </Button>
              </div>
            </div>
          </div>

          {/* List */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-slate-500">
              Categorias existentes ({categories.length})
            </p>
            <div className="max-h-72 space-y-1.5 overflow-y-auto">
              {categories.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-400">
                  Nenhuma categoria ainda.
                </p>
              )}
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base"
                    style={{ background: `${c.color}20` }}
                  >
                    {c.icon}
                  </span>
                  <span className="flex-1 truncate text-sm font-medium text-slate-700">
                    {c.name}
                  </span>
                  <button
                    onClick={() => openEdit(c)}
                    className="text-xs font-semibold text-cyan-600 hover:underline"
                  >
                    editar
                  </button>
                  <button
                    onClick={() => remove(c.id)}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    excluir
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function CategoryBadge({
  categories,
  categoryId,
}: {
  categories: AnyRow[];
  categoryId: number | null | undefined;
}) {
  const c = categories.find((x) => x.id === categoryId);
  if (!c) return <Badge>Sem categoria</Badge>;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset"
      style={{
        background: `${c.color}15`,
        color: c.color,
        borderColor: `${c.color}40`,
      }}
    >
      {c.icon} {c.name}
    </span>
  );
}
