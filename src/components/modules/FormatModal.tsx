"use client";

import { useState } from "react";
import { Button, Field, Input, Modal, Select } from "@/components/ui";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

export function FormatModal({
  initial,
  mode,
  saving,
  onClose,
  onSave,
}: {
  initial?: AnyRow;
  mode: string;
  saving: boolean;
  onClose: () => void;
  onSave: (form: Record<string, string>) => void;
}) {
  const is3D = mode === "grama";
  const [f, setF] = useState<Record<string, string>>({
    name: initial?.name || "",
    widthMm: String(Number(initial?.widthMm || 0)),
    heightMm: String(Number(initial?.heightMm || 0)),
    areaFactor: String(Number(initial?.areaFactor || (is3D ? 15 : 1))),
    inkCoverage: String(Math.round(Number(initial?.inkCoverage || (is3D ? 1 : 0.3)) * 100)),
    isPhoto: String(initial?.isPhoto ?? false),
  });
  const set = (key: string, value: string) => setF((old) => ({ ...old, [key]: value }));

  return (
    <Modal
      open
      onClose={onClose}
      icon={is3D ? "🧊" : mode === "etiqueta" ? "🏷️" : "📐"}
      title={initial ? "Editar formato" : "Novo formato"}
      subtitle={
        is3D
          ? "3D é precificado por peso do filamento, não por folha."
          : mode === "etiqueta"
          ? "Informe o tamanho físico da etiqueta."
          : "Formato, área relativa e cobertura de tinta."
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={is3D ? "Nome da faixa de peso" : "Nome do formato"} className="sm:col-span-2">
          <Input
            value={f.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder={is3D ? "Ex.: Peça média (~30g)" : mode === "etiqueta" ? "Ex.: Etiqueta 50x50mm" : "Ex.: A3+ (SRA3)"}
          />
        </Field>
        {is3D ? (
          <Field label="Peso estimado (g)" hint="Usado como referência de custo por grama" className="sm:col-span-2">
            <Input type="number" step="0.1" value={f.areaFactor} onChange={(e) => set("areaFactor", e.target.value)} />
          </Field>
        ) : (
          <>
            <Field label="Largura (mm)"><Input type="number" step="0.1" value={f.widthMm} onChange={(e) => set("widthMm", e.target.value)} /></Field>
            <Field label="Altura (mm)"><Input type="number" step="0.1" value={f.heightMm} onChange={(e) => set("heightMm", e.target.value)} /></Field>
            <Field label="Fator de área" hint="A4=1 · A3=2 · A3+=2,55"><Input type="number" step="0.01" value={f.areaFactor} onChange={(e) => set("areaFactor", e.target.value)} /></Field>
            <Field label="Cobertura de tinta (%)"><Input type="number" min="0" max="100" step="1" value={f.inkCoverage} onChange={(e) => set("inkCoverage", e.target.value)} /></Field>
            <Field label="É fotográfico?" className="sm:col-span-2">
              <Select value={f.isPhoto} onChange={(e) => set("isPhoto", e.target.value)}>
                <option value="false">Não</option><option value="true">Sim — normalmente 100% de cobertura</option>
              </Select>
            </Field>
          </>
        )}
      </div>
      <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => onSave(f)} disabled={saving || !f.name}>{saving ? "Salvando..." : "Salvar Formato"}</Button>
      </div>
    </Modal>
  );
}
