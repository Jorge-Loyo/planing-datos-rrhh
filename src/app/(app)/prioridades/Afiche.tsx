"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Card, PageHeader, EmptyState } from "@/components/ui";
import { formatearFecha } from "@/lib/utils";
import { nombreUsuario, type UsuarioMin } from "@/lib/usuarios";
import { NIVELES_AFICHE, ETIQUETA_PRIORIDAD, type NivelAfiche } from "@/lib/dominio";
import { Plus, Trash2, Pencil, Archive, Flag } from "lucide-react";

export interface PrioridadUI {
  id: number;
  nivel: NivelAfiche;
  queEs: string;
  porQueImporta: string;
  responsableId: number | null;
  fechaEstimada: string | null;
  activa: boolean;
}

export function AficheprioridadesUI({
  itemsIniciales,
  usuarios,
  puedeCoordinar,
}: {
  itemsIniciales: PrioridadUI[];
  usuarios: UsuarioMin[];
  puedeCoordinar: boolean;
}) {
  const router = useRouter();
  const activas = itemsIniciales.filter((p) => p.activa);
  const archivadas = itemsIniciales.filter((p) => !p.activa);
  const mapaUsuarios = new Map(usuarios.map((u) => [u.id, u]));

  const [form, setForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [nivel, setNivel] = useState<NivelAfiche>("p1");
  const [queEs, setQueEs] = useState("");
  const [porQueImporta, setPorque] = useState("");
  const [responsableId, setResponsable] = useState("");
  const [fechaEstimada, setFecha] = useState("");
  const [error, setError] = useState("");

  const selectCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";

  function resetForm() {
    setEditId(null);
    setNivel("p1");
    setQueEs("");
    setPorque("");
    setResponsable("");
    setFecha("");
    setError("");
  }

  function abrirNueva() {
    resetForm();
    setForm(true);
  }
  function abrirEdicion(p: PrioridadUI) {
    setEditId(p.id);
    setNivel(p.nivel);
    setQueEs(p.queEs);
    setPorque(p.porQueImporta);
    setResponsable(p.responsableId?.toString() ?? "");
    setFecha(p.fechaEstimada ?? "");
    setError("");
    setForm(true);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const payload = {
      nivel,
      queEs,
      porQueImporta,
      responsableId: responsableId || null,
      fechaEstimada: fechaEstimada || null,
    };
    const res = editId
      ? await fetch("/api/prioridades", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...payload }),
        })
      : await fetch("/api/prioridades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    const data = await res.json();
    if (res.ok) {
      resetForm();
      setForm(false);
      router.refresh();
    } else {
      setError(data.error || "No se pudo guardar.");
    }
  }

  async function archivar(id: number, activa: boolean) {
    const res = await fetch("/api/prioridades", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, activa: !activa }),
    });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error || "No se pudo actualizar.");
      return;
    }
    router.refresh();
  }

  async function eliminar(id: number) {
    if (!confirm("¿Eliminar esta prioridad?")) return;
    await fetch(`/api/prioridades?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        titulo="Afiche de prioridades"
        descripcion="Lo más importante del período. Máximo 5: si entra algo urgente, se saca otra cosa."
      >
        {puedeCoordinar && (
          <Button onClick={abrirNueva} disabled={activas.length >= 5}>
            <Plus size={16} /> Nueva prioridad
          </Button>
        )}
      </PageHeader>

      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Flag size={16} className="text-brand-600" />
        <span>
          {activas.length} de 5 prioridades activas.
          {activas.length >= 5 && " Para agregar otra, archivá una primero."}
        </span>
      </div>

      {form && puedeCoordinar && (
        <Card className="mb-6">
          <form onSubmit={guardar} className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Nivel</Label>
              <select
                className={selectCls}
                value={nivel}
                onChange={(e) => setNivel(e.target.value as NivelAfiche)}
              >
                {NIVELES_AFICHE.map((n) => (
                  <option key={n} value={n}>
                    {ETIQUETA_PRIORIDAD[n]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Responsable</Label>
              <select
                className={selectCls}
                value={responsableId}
                onChange={(e) => setResponsable(e.target.value)}
              >
                <option value="">Sin asignar</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {nombreUsuario(u)}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label>¿Qué es? *</Label>
              <Input
                value={queEs}
                onChange={(e) => setQueEs(e.target.value)}
                placeholder="Ej: Tablero de dotación por hospital"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label>¿Por qué importa?</Label>
              <textarea
                className={selectCls}
                rows={2}
                value={porQueImporta}
                onChange={(e) => setPorque(e.target.value)}
                placeholder="Ej: Insumo para la planificación de cargos"
              />
            </div>
            <div>
              <Label>Fecha estimada</Label>
              <Input
                type="date"
                value={fechaEstimada}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            {error && (
              <div className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit">
                {editId ? "Guardar cambios" : "Agregar prioridad"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  resetForm();
                  setForm(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activas.length === 0 ? (
        <EmptyState
          titulo="No hay prioridades activas"
          descripcion={
            puedeCoordinar
              ? "Definí las 3 a 5 prioridades del período con el botón de arriba."
              : "Todavía no se definieron las prioridades del período."
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {activas.map((p) => {
            const resp = p.responsableId ? mapaUsuarios.get(p.responsableId) : null;
            return (
              <Card key={p.id} className="relative border-l-4 border-l-brand-500">
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                    <Flag size={12} /> {ETIQUETA_PRIORIDAD[p.nivel]}
                  </span>
                  {puedeCoordinar && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => abrirEdicion(p)}
                        className="text-slate-400 hover:text-brand-600"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => archivar(p.id, p.activa)}
                        className="text-slate-400 hover:text-yellow-600"
                        title="Archivar"
                      >
                        <Archive size={15} />
                      </button>
                      <button
                        onClick={() => eliminar(p.id)}
                        className="text-slate-400 hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="text-base font-semibold text-slate-900">{p.queEs}</h3>
                {p.porQueImporta && (
                  <p className="mt-1 text-sm text-slate-600">{p.porQueImporta}</p>
                )}
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>{resp ? nombreUsuario(resp) : "Sin responsable"}</span>
                  <span>{p.fechaEstimada ? formatearFecha(p.fechaEstimada) : ""}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {archivadas.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-slate-500">
            Archivadas ({archivadas.length})
          </h2>
          <div className="space-y-2">
            {archivadas.map((p) => (
              <Card key={p.id} className="flex items-center justify-between py-3 opacity-70">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-400">
                    {ETIQUETA_PRIORIDAD[p.nivel]}
                  </span>
                  <span className="text-sm text-slate-700">{p.queEs}</span>
                </div>
                {puedeCoordinar && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => archivar(p.id, p.activa)}
                      className="text-xs text-brand-600 hover:underline"
                      disabled={activas.length >= 5}
                    >
                      Reactivar
                    </button>
                    <button
                      onClick={() => eliminar(p.id)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
