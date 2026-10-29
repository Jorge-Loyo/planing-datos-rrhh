"use client";

import { useState } from "react";
import { Button, Input, Label } from "@/components/ui";
import { nombreUsuario, type UsuarioMin } from "@/lib/consultas";
import {
  ESTADOS_TAREA,
  ETIQUETA_ESTADO,
  PRIORIDADES,
  ETIQUETA_PRIORIDAD,
} from "@/lib/dominio";
import type { TareaKanban } from "./KanbanBoard";
import { X } from "lucide-react";

export function TareaModal({
  tarea,
  usuarios,
  onCerrar,
  onGuardado,
}: {
  tarea: TareaKanban | null;
  usuarios: UsuarioMin[];
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const [titulo, setTitulo] = useState(tarea?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(tarea?.descripcion ?? "");
  const [estado, setEstado] = useState(tarea?.estado ?? "pendiente");
  const [prioridad, setPrioridad] = useState(tarea?.prioridad ?? "sin_prioridad");
  const [responsableId, setResponsableId] = useState(
    tarea?.responsableId?.toString() ?? ""
  );
  const [segundaPersonaId, setSegundaPersonaId] = useState(
    tarea?.segundaPersonaId?.toString() ?? ""
  );
  const [fechaInicio, setFechaInicio] = useState(tarea?.fechaInicio ?? "");
  const [fechaLimite, setFechaLimite] = useState(tarea?.fechaLimite ?? "");
  const [criterioTerminado, setCriterioTerminado] = useState(
    tarea?.criterioTerminado ?? ""
  );
  const [observaciones, setObservaciones] = useState(tarea?.observaciones ?? "");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setGuardando(true);
    const payload = {
      titulo,
      descripcion,
      estado,
      prioridad,
      responsableId: responsableId || null,
      segundaPersonaId: segundaPersonaId || null,
      fechaInicio: fechaInicio || null,
      fechaLimite: fechaLimite || null,
      criterioTerminado,
      observaciones,
    };
    try {
      const res = tarea
        ? await fetch("/api/tareas", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: tarea.id, ...payload }),
          })
        : await fetch("/api/tareas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo guardar.");
        return;
      }
      onGuardado();
    } catch {
      setError("Error de conexión.");
    } finally {
      setGuardando(false);
    }
  }

  const selectCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-4"
      onClick={onCerrar}
    >
      <div
        className="my-8 w-full max-w-2xl rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {tarea ? "Editar tarea" : "Nueva tarea"}
          </h2>
          <button onClick={onCerrar} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={guardar} className="space-y-4 p-5">
          <div>
            <Label>Tarea *</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Dashboard de dotación por hospital"
              autoFocus
              required
            />
          </div>

          <div>
            <Label>Descripción</Label>
            <textarea
              className={selectCls}
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Estado</Label>
              <select
                className={selectCls}
                value={estado}
                onChange={(e) => setEstado(e.target.value as typeof estado)}
              >
                {ESTADOS_TAREA.map((s) => (
                  <option key={s} value={s}>
                    {ETIQUETA_ESTADO[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Prioridad (afiche)</Label>
              <select
                className={selectCls}
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value as typeof prioridad)}
              >
                {PRIORIDADES.map((p) => (
                  <option key={p} value={p}>
                    {ETIQUETA_PRIORIDAD[p]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Responsable</Label>
              <select
                className={selectCls}
                value={responsableId}
                onChange={(e) => setResponsableId(e.target.value)}
              >
                <option value="">Sin asignar</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {nombreUsuario(u)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Segunda persona (respaldo)</Label>
              <select
                className={selectCls}
                value={segundaPersonaId}
                onChange={(e) => setSegundaPersonaId(e.target.value)}
              >
                <option value="">Sin asignar</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {nombreUsuario(u)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Fecha inicio</Label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div>
              <Label>Fecha límite</Label>
              <Input
                type="date"
                value={fechaLimite}
                onChange={(e) => setFechaLimite(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Criterio de terminado</Label>
            <textarea
              className={selectCls}
              rows={2}
              value={criterioTerminado}
              onChange={(e) => setCriterioTerminado(e.target.value)}
              placeholder="Ej: Datos validados, documentado, usuario capacitado"
            />
          </div>

          <div>
            <Label>Observaciones / bloqueos</Label>
            <textarea
              className={selectCls}
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="secondary" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              {guardando ? "Guardando..." : tarea ? "Guardar cambios" : "Crear tarea"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
