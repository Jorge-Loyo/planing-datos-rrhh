"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Badge, PageHeader } from "@/components/ui";
import { cn, formatearFecha, diasRestantes } from "@/lib/utils";
import { nombreUsuario, type UsuarioMin } from "@/lib/usuarios";
import {
  ESTADOS_TAREA,
  ETIQUETA_ESTADO,
  COLOR_ESTADO,
  ETIQUETA_PRIORIDAD,
  PRIORIDADES,
  type EstadoTarea,
  type PrioridadTarea,
} from "@/lib/dominio";
import { Plus, Pencil, Trash2, Clock, User as UserIcon } from "lucide-react";
import { TareaModal } from "./TareaModal";

export interface TareaKanban {
  id: number;
  titulo: string;
  descripcion: string;
  estado: EstadoTarea;
  prioridad: PrioridadTarea;
  responsableId: number | null;
  segundaPersonaId: number | null;
  fechaInicio: string | null;
  fechaLimite: string | null;
  criterioTerminado: string;
  observaciones: string;
  orden: number;
}

export interface TipoEntregableMin {
  id: number;
  nombre: string;
  criterios: string[];
}

export function KanbanBoard({
  tareasIniciales,
  usuarios,
  tiposEntregable,
  puedeEditar,
}: {
  tareasIniciales: TareaKanban[];
  usuarios: UsuarioMin[];
  tiposEntregable: TipoEntregableMin[];
  puedeEditar: boolean;
}) {
  const router = useRouter();
  const [tareas, setTareas] = useState<TareaKanban[]>(tareasIniciales);
  const [arrastrada, setArrastrada] = useState<number | null>(null);
  const [columnaSobre, setColumnaSobre] = useState<EstadoTarea | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<TareaKanban | null>(null);

  // Filtros
  const [filtroResponsable, setFiltroResponsable] = useState<string>("");
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>("");

  const mapaUsuarios = new Map(usuarios.map((u) => [u.id, u]));

  function pasaFiltro(t: TareaKanban): boolean {
    if (filtroResponsable) {
      if (filtroResponsable === "sin" && t.responsableId !== null) return false;
      if (
        filtroResponsable !== "sin" &&
        t.responsableId !== Number(filtroResponsable)
      )
        return false;
    }
    if (filtroPrioridad && t.prioridad !== filtroPrioridad) return false;
    return true;
  }

  function tareasDe(estado: EstadoTarea) {
    return tareas
      .filter((t) => t.estado === estado && pasaFiltro(t))
      .sort((a, b) => a.orden - b.orden);
  }

  const hayFiltro = filtroResponsable !== "" || filtroPrioridad !== "";

  async function persistirColumna(estado: EstadoTarea, lista: TareaKanban[]) {
    await fetch("/api/tareas/mover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado, ids: lista.map((t) => t.id) }),
    });
    router.refresh();
  }

  function onDrop(estadoDestino: EstadoTarea) {
    setColumnaSobre(null);
    if (arrastrada == null) return;
    const tarea = tareas.find((t) => t.id === arrastrada);
    if (!tarea) return;

    // Reconstruir orden: sacar de donde estaba, poner al final del destino
    const destino = tareasDe(estadoDestino).filter((t) => t.id !== arrastrada);
    const nuevaLista = [...destino, { ...tarea, estado: estadoDestino }];

    setTareas((prev) =>
      prev.map((t) =>
        t.id === arrastrada
          ? { ...t, estado: estadoDestino, orden: nuevaLista.length - 1 }
          : t
      )
    );
    setArrastrada(null);
    persistirColumna(estadoDestino, nuevaLista);
  }

  async function eliminar(id: number) {
    if (!confirm("¿Eliminar esta tarea?")) return;
    await fetch(`/api/tareas?id=${id}`, { method: "DELETE" });
    setTareas((prev) => prev.filter((t) => t.id !== id));
    router.refresh();
  }

  function abrirNueva() {
    setEditando(null);
    setModalAbierto(true);
  }
  function abrirEdicion(t: TareaKanban) {
    setEditando(t);
    setModalAbierto(true);
  }

  return (
    <div>
      <PageHeader
        titulo="Kanban / Planner"
        descripcion="Tablero único donde vive todo lo que el equipo tiene en marcha."
      >
        {puedeEditar && (
          <Button onClick={abrirNueva}>
            <Plus size={16} /> Nueva tarea
          </Button>
        )}
      </PageHeader>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          value={filtroResponsable}
          onChange={(e) => setFiltroResponsable(e.target.value)}
        >
          <option value="">Todos los responsables</option>
          <option value="sin">Sin asignar</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              {nombreUsuario(u)}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          value={filtroPrioridad}
          onChange={(e) => setFiltroPrioridad(e.target.value)}
        >
          <option value="">Todas las prioridades</option>
          {PRIORIDADES.map((p) => (
            <option key={p} value={p}>
              {ETIQUETA_PRIORIDAD[p]}
            </option>
          ))}
        </select>
        {hayFiltro && (
          <>
            <button
              onClick={() => {
                setFiltroResponsable("");
                setFiltroPrioridad("");
              }}
              className="text-sm text-slate-500 hover:underline"
            >
              Limpiar filtros
            </button>
            <span className="text-xs text-slate-400">
              (con filtros activos el arrastre está desactivado)
            </span>
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ESTADOS_TAREA.map((estado) => {
          const lista = tareasDe(estado);
          return (
            <div
              key={estado}
              onDragOver={(e) => {
                if (!puedeEditar || hayFiltro) return;
                e.preventDefault();
                setColumnaSobre(estado);
              }}
              onDragLeave={() => setColumnaSobre(null)}
              onDrop={() => !hayFiltro && onDrop(estado)}
              className={cn(
                "rounded-xl bg-slate-100 p-3 transition",
                columnaSobre === estado && "ring-2 ring-brand-400 bg-brand-50"
              )}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Badge color={COLOR_ESTADO[estado]}>
                    {ETIQUETA_ESTADO[estado]}
                  </Badge>
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">
                  {lista.length}
                </span>
              </div>

              <div className="space-y-2 min-h-[60px]">
                {lista.map((t) => {
                  const resp = t.responsableId
                    ? mapaUsuarios.get(t.responsableId)
                    : null;
                  const dias = diasRestantes(t.fechaLimite);
                  return (
                    <div
                      key={t.id}
                      draggable={puedeEditar && !hayFiltro}
                      onDragStart={() => setArrastrada(t.id)}
                      onDragEnd={() => setArrastrada(null)}
                      className={cn(
                        "group rounded-lg border border-slate-200 bg-white p-3 shadow-sm",
                        puedeEditar && "cursor-grab active:cursor-grabbing",
                        arrastrada === t.id && "opacity-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900">
                          {t.titulo}
                        </p>
                        {puedeEditar && (
                          <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                            <button
                              onClick={() => abrirEdicion(t)}
                              className="text-slate-400 hover:text-brand-600"
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => eliminar(t.id)}
                              className="text-slate-400 hover:text-red-600"
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {t.descripcion && (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                          {t.descripcion}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {t.prioridad !== "sin_prioridad" && (
                          <Badge color="blue">
                            {ETIQUETA_PRIORIDAD[t.prioridad]}
                          </Badge>
                        )}
                        {dias !== null && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
                              dias < 0
                                ? "bg-red-100 text-red-700"
                                : dias <= 3
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-slate-100 text-slate-600"
                            )}
                          >
                            <Clock size={11} />
                            {dias < 0
                              ? `${Math.abs(dias)}d vencida`
                              : `${dias}d`}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                        <UserIcon size={12} />
                        <span className="truncate">
                          {resp ? nombreUsuario(resp) : "Sin asignar"}
                        </span>
                        {t.fechaLimite && (
                          <span className="ml-auto">
                            {formatearFecha(t.fechaLimite)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {lista.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-white/50 p-4 text-center text-xs text-slate-400">
                    Sin tareas
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modalAbierto && (
        <TareaModal
          tarea={editando}
          usuarios={usuarios}
          tiposEntregable={tiposEntregable}
          onCerrar={() => setModalAbierto(false)}
          onGuardado={() => {
            setModalAbierto(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
