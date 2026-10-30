"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card, PageHeader, EmptyState, ReadOnlyNotice } from "@/components/ui";
import { useConfirm } from "@/components/confirm";
import { Plus, Trash2, Check, X, ListChecks } from "lucide-react";

export interface CriterioUI {
  id: number;
  criterio: string;
}
export interface TipoEntregableUI {
  id: number;
  nombre: string;
  descripcion: string;
  criterios: CriterioUI[];
}

export function DefinicionUI({
  itemsIniciales,
  puedeEditar,
}: {
  itemsIniciales: TipoEntregableUI[];
  puedeEditar: boolean;
}) {
  const router = useRouter();
  const confirmar = useConfirm();
  const [nuevoTipo, setNuevoTipo] = useState(false);
  const [creandoTipo, setCreandoTipo] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState("");
  // texto del criterio en edición por cada tipo
  const [criterioTexto, setCriterioTexto] = useState<Record<number, string>>({});

  async function crearTipo(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreandoTipo(true);
    try {
      const res = await fetch("/api/tipos-entregable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, descripcion }),
      });
      const data = await res.json();
      if (res.ok) {
        setNombre("");
        setDescripcion("");
        setNuevoTipo(false);
        router.refresh();
      } else {
        setError(data.error || "No se pudo crear.");
      }
    } finally {
      setCreandoTipo(false);
    }
  }

  async function eliminarTipo(id: number) {
    const ok = await confirmar({
      titulo: "Eliminar tipo de entregable",
      mensaje: "Se eliminará junto con todos sus criterios. Esta acción no se puede deshacer.",
      textoConfirmar: "Eliminar",
      peligro: true,
    });
    if (!ok) return;
    await fetch(`/api/tipos-entregable?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function agregarCriterio(tipoId: number) {
    const texto = (criterioTexto[tipoId] ?? "").trim();
    if (!texto) return;
    await fetch("/api/tipos-entregable", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accion: "agregar_criterio",
        tipoEntregableId: tipoId,
        criterio: texto,
      }),
    });
    setCriterioTexto((prev) => ({ ...prev, [tipoId]: "" }));
    router.refresh();
  }

  async function eliminarCriterio(criterioId: number) {
    await fetch("/api/tipos-entregable", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "eliminar_criterio", criterioId }),
    });
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        titulo="Definición de terminado"
        descripcion="Criterios claros para dar una tarea por cerrada, con un checklist por tipo de entregable."
      >
        {puedeEditar && (
          <Button onClick={() => setNuevoTipo(!nuevoTipo)}>
            <Plus size={16} /> {nuevoTipo ? "Cancelar" : "Nuevo tipo"}
          </Button>
        )}
      </PageHeader>

      {!puedeEditar && <ReadOnlyNotice />}

      {nuevoTipo && puedeEditar && (
        <Card className="mb-6">
          <form onSubmit={crearTipo} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nombre del tipo
              </label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Dashboard, Automatización, Reporte"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Descripción (opcional)
              </label>
              <Input
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
            {error && (
              <div className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="sm:col-span-2">
              <Button type="submit" cargando={creandoTipo}>
                Crear tipo
              </Button>
            </div>
          </form>
        </Card>
      )}

      {itemsIniciales.length === 0 ? (
        <EmptyState
          titulo="No hay tipos de entregable definidos"
          descripcion={
            puedeEditar
              ? "Creá un tipo (Dashboard, Automatización, Reporte) y agregale sus criterios de terminado."
              : "Todavía no se definieron tipos de entregable."
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {itemsIniciales.map((t) => (
            <Card key={t.id}>
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <ListChecks size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{t.nombre}</h3>
                    {t.descripcion && (
                      <p className="text-xs text-slate-500">{t.descripcion}</p>
                    )}
                  </div>
                </div>
                {puedeEditar && (
                  <button
                    onClick={() => eliminarTipo(t.id)}
                    className="text-slate-400 hover:text-red-600"
                    title="Eliminar tipo"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <ul className="space-y-1.5">
                {t.criterios.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                  >
                    <Check size={16} className="mt-0.5 shrink-0 text-green-600" />
                    <span className="flex-1 text-slate-700">{c.criterio}</span>
                    {puedeEditar && (
                      <button
                        onClick={() => eliminarCriterio(c.id)}
                        className="text-slate-300 hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </li>
                ))}
                {t.criterios.length === 0 && (
                  <li className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-center text-xs text-slate-400">
                    Sin criterios todavía
                  </li>
                )}
              </ul>

              {puedeEditar && (
                <div className="mt-3 flex gap-2">
                  <Input
                    value={criterioTexto[t.id] ?? ""}
                    onChange={(e) =>
                      setCriterioTexto((prev) => ({
                        ...prev,
                        [t.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        agregarCriterio(t.id);
                      }
                    }}
                    placeholder="Nuevo criterio..."
                    className="text-sm"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => agregarCriterio(t.id)}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
