"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Card, Badge, PageHeader } from "@/components/ui";
import { formatearFecha } from "@/lib/utils";
import {
  ESCALAS,
  ETIQUETA_ESCALA,
  ETIQUETA_ESTADO_BACKLOG,
  COLOR_ESTADO_BACKLOG,
  type Escala,
  type EstadoBacklog,
} from "@/lib/dominio";
import { Plus, Trash2, ArrowUpRight } from "lucide-react";

export interface ItemBacklogUI {
  id: number;
  codigo: string;
  pedido: string;
  areaSolicitante: string;
  decisionQueApoya: string;
  impacto: Escala | null;
  esfuerzo: Escala | null;
  estado: EstadoBacklog;
  fechaIngreso: string;
}

export function BacklogTabla({
  itemsIniciales,
  puedeEditar,
  puedeCoordinar,
}: {
  itemsIniciales: ItemBacklogUI[];
  puedeEditar: boolean;
  puedeCoordinar: boolean;
}) {
  const router = useRouter();
  const [items] = useState(itemsIniciales);
  const [form, setForm] = useState(false);
  const [pedido, setPedido] = useState("");
  const [areaSolicitante, setArea] = useState("");
  const [decisionQueApoya, setDecision] = useState("");
  const [impacto, setImpacto] = useState<string>("");
  const [esfuerzo, setEsfuerzo] = useState<string>("");
  const [error, setError] = useState("");

  const selectCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/backlog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pedido,
        areaSolicitante,
        decisionQueApoya,
        impacto: impacto || null,
        esfuerzo: esfuerzo || null,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setPedido("");
      setArea("");
      setDecision("");
      setImpacto("");
      setEsfuerzo("");
      setForm(false);
      router.refresh();
    } else {
      setError(data.error || "No se pudo crear.");
    }
  }

  async function cambiarEstado(id: number, estado: EstadoBacklog) {
    const res = await fetch("/api/backlog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estado }),
    });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error || "No se pudo actualizar.");
      return;
    }
    router.refresh();
  }

  async function promover(id: number) {
    if (!confirm("¿Promover este pedido a una tarea del Kanban (columna Pendiente)?"))
      return;
    const res = await fetch("/api/backlog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const d = await res.json();
    if (res.ok) {
      alert("Pedido promovido a tarea. Lo vas a ver en el Kanban.");
      router.refresh();
    } else {
      alert(d.error || "No se pudo promover.");
    }
  }

  async function eliminar(id: number) {
    if (!confirm("¿Eliminar este pedido del backlog?")) return;
    await fetch(`/api/backlog?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  const ESTADOS: EstadoBacklog[] = [
    "nuevo",
    "a_evaluar",
    "aprobado",
    "descartado",
    "promovido",
  ];

  return (
    <div>
      <PageHeader
        titulo="Backlog"
        descripcion="Todo pedido entra acá (no por pasillo ni mensajes sueltos). De acá se eligen las prioridades."
      >
        {puedeEditar && (
          <Button onClick={() => setForm(!form)}>
            <Plus size={16} /> {form ? "Cancelar" : "Nuevo pedido"}
          </Button>
        )}
      </PageHeader>

      {form && (
        <Card className="mb-6">
          <form onSubmit={crear} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Pedido / idea *</Label>
              <Input
                value={pedido}
                onChange={(e) => setPedido(e.target.value)}
                placeholder="Ej: Automatizar reporte mensual de ausentismo"
                required
              />
            </div>
            <div>
              <Label>Área solicitante</Label>
              <Input value={areaSolicitante} onChange={(e) => setArea(e.target.value)} />
            </div>
            <div>
              <Label>Decisión que apoya</Label>
              <Input
                value={decisionQueApoya}
                onChange={(e) => setDecision(e.target.value)}
              />
            </div>
            <div>
              <Label>Impacto</Label>
              <select
                className={selectCls}
                value={impacto}
                onChange={(e) => setImpacto(e.target.value)}
              >
                <option value="">—</option>
                {ESCALAS.map((s) => (
                  <option key={s} value={s}>
                    {ETIQUETA_ESCALA[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Esfuerzo</Label>
              <select
                className={selectCls}
                value={esfuerzo}
                onChange={(e) => setEsfuerzo(e.target.value)}
              >
                <option value="">—</option>
                {ESCALAS.map((s) => (
                  <option key={s} value={s}>
                    {ETIQUETA_ESCALA[s]}
                  </option>
                ))}
              </select>
            </div>
            {error && (
              <div className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="sm:col-span-2">
              <Button type="submit">Agregar al backlog</Button>
            </div>
          </form>
        </Card>
      )}

      {items.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-slate-500">
            El backlog está vacío. {puedeEditar && "Agregá el primer pedido con el botón de arriba."}
          </p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Pedido</th>
                <th className="px-4 py-3 font-medium">Área</th>
                <th className="px-4 py-3 font-medium">Impacto</th>
                <th className="px-4 py-3 font-medium">Esfuerzo</th>
                <th className="px-4 py-3 font-medium">Ingreso</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                {(puedeEditar || puedeCoordinar) && (
                  <th className="px-4 py-3 font-medium">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b border-slate-100 align-top">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {it.codigo}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{it.pedido}</div>
                    {it.decisionQueApoya && (
                      <div className="text-xs text-slate-500">
                        Apoya: {it.decisionQueApoya}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {it.areaSolicitante || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {it.impacto ? ETIQUETA_ESCALA[it.impacto] : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {it.esfuerzo ? ETIQUETA_ESCALA[it.esfuerzo] : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatearFecha(it.fechaIngreso)}
                  </td>
                  <td className="px-4 py-3">
                    {puedeEditar ? (
                      <select
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                        value={it.estado}
                        onChange={(e) =>
                          cambiarEstado(it.id, e.target.value as EstadoBacklog)
                        }
                      >
                        {ESTADOS.map((s) => (
                          <option key={s} value={s}>
                            {ETIQUETA_ESTADO_BACKLOG[s]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Badge color={COLOR_ESTADO_BACKLOG[it.estado]}>
                        {ETIQUETA_ESTADO_BACKLOG[it.estado]}
                      </Badge>
                    )}
                  </td>
                  {(puedeEditar || puedeCoordinar) && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {puedeCoordinar && it.estado !== "promovido" && (
                          <button
                            onClick={() => promover(it.id)}
                            className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                            title="Promover a tarea del Kanban"
                          >
                            <ArrowUpRight size={14} /> A tarea
                          </button>
                        )}
                        {puedeEditar && (
                          <button
                            onClick={() => eliminar(it.id)}
                            className="text-slate-400 hover:text-red-600"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
