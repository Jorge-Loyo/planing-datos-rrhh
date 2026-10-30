"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Label,
  Card,
  Badge,
  PageHeader,
  EmptyState,
  ReadOnlyNotice,
} from "@/components/ui";
import { useConfirm } from "@/components/confirm";
import { nombreUsuario, type UsuarioMin } from "@/lib/usuarios";
import { DIAS_SEMANA, ETIQUETA_DIA, type DiaSemana } from "@/lib/dominio";
import { Plus, Pencil, Trash2, X, Repeat, CalendarPlus } from "lucide-react";

export interface TareaFijaUI {
  id: number;
  titulo: string;
  descripcion: string;
  responsableId: number | null;
  diaSemana: DiaSemana | null;
  criterioTerminado: string;
  activa: boolean;
}

export function TareasFijasUI({
  itemsIniciales,
  usuarios,
  puedeEditar,
}: {
  itemsIniciales: TareaFijaUI[];
  usuarios: UsuarioMin[];
  puedeEditar: boolean;
}) {
  const router = useRouter();
  const confirmar = useConfirm();
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<TareaFijaUI | null>(null);
  const [generando, setGenerando] = useState(false);
  const mapaUsuarios = new Map(usuarios.map((u) => [u.id, u]));
  const activas = itemsIniciales.filter((t) => t.activa);

  async function eliminar(id: number) {
    const ok = await confirmar({
      titulo: "Eliminar tarea fija",
      mensaje: "Se eliminará la plantilla. No afecta a las tareas ya generadas.",
      textoConfirmar: "Eliminar",
      peligro: true,
    });
    if (!ok) return;
    await fetch(`/api/tareas-fijas?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function toggleActiva(t: TareaFijaUI) {
    await fetch("/api/tareas-fijas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, activa: !t.activa }),
    });
    router.refresh();
  }

  async function generar(semana: "actual" | "siguiente") {
    const cuando = semana === "actual" ? "esta semana" : "la semana que viene";
    const ok = await confirmar({
      titulo: `Generar tareas de ${cuando}`,
      mensaje: `Se crearán hasta ${activas.length} tarea(s) en el Kanban (columna Pendiente) con la fecha del día que corresponda. Las que ya se hayan generado esta semana se saltean automáticamente.`,
      textoConfirmar: "Generar",
    });
    if (!ok) return;
    setGenerando(true);
    try {
      const res = await fetch("/api/tareas-fijas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ semana }),
      });
      const data = await res.json();
      if (res.ok) {
        const extra =
          data.salteadas > 0
            ? ` (${data.salteadas} ya existían y se saltearon)`
            : "";
        alert(`Se generaron ${data.creadas} tareas en el Kanban${extra}.`);
        router.refresh();
      } else {
        alert(data.error || "No se pudieron generar.");
      }
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div>
      <PageHeader
        titulo="Tareas fijas semanales"
        descripcion="Definí las tareas recurrentes una vez y generalas en el Kanban cada semana con un clic."
      >
        {puedeEditar && (
          <Button
            onClick={() => {
              setEditando(null);
              setModal(true);
            }}
          >
            <Plus size={16} /> Nueva tarea fija
          </Button>
        )}
      </PageHeader>

      {!puedeEditar && <ReadOnlyNotice />}

      {puedeEditar && activas.length > 0 && (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-brand-50">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <CalendarPlus size={18} className="text-brand-600" />
            <span>
              Generá las <strong>{activas.length}</strong> tareas fijas activas en el
              Kanban.
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => generar("actual")}
              cargando={generando}
            >
              Generar esta semana
            </Button>
            <Button onClick={() => generar("siguiente")} cargando={generando}>
              Generar semana próxima
            </Button>
          </div>
        </Card>
      )}

      {itemsIniciales.length === 0 ? (
        <EmptyState
          titulo="No hay tareas fijas definidas"
          descripcion={
            puedeEditar
              ? "Creá las tareas recurrentes del equipo (ej. actualizar reporte de dotación los lunes)."
              : "Todavía no se definieron tareas fijas."
          }
        />
      ) : (
        <div className="space-y-2">
          {itemsIniciales.map((t) => {
            const resp = t.responsableId ? mapaUsuarios.get(t.responsableId) : null;
            return (
              <Card
                key={t.id}
                className={
                  "flex flex-wrap items-center gap-3 " + (t.activa ? "" : "opacity-60")
                }
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Repeat size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-900">{t.titulo}</div>
                  {t.descripcion && (
                    <div className="text-xs text-slate-500">{t.descripcion}</div>
                  )}
                </div>
                {t.diaSemana && <Badge color="blue">{ETIQUETA_DIA[t.diaSemana]}</Badge>}
                <span className="text-xs text-slate-500">
                  {resp ? nombreUsuario(resp) : "Sin asignar"}
                </span>
                {!t.activa && <Badge color="slate">Inactiva</Badge>}
                {puedeEditar && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleActiva(t)}
                      className="text-xs text-slate-500 hover:underline"
                    >
                      {t.activa ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      onClick={() => {
                        setEditando(t);
                        setModal(true);
                      }}
                      className="text-slate-400 hover:text-brand-600"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => eliminar(t.id)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {modal && (
        <TareaFijaModal
          tarea={editando}
          usuarios={usuarios}
          onCerrar={() => setModal(false)}
          onGuardado={() => {
            setModal(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function TareaFijaModal({
  tarea,
  usuarios,
  onCerrar,
  onGuardado,
}: {
  tarea: TareaFijaUI | null;
  usuarios: UsuarioMin[];
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const [titulo, setTitulo] = useState(tarea?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(tarea?.descripcion ?? "");
  const [responsableId, setResponsable] = useState(
    tarea?.responsableId?.toString() ?? ""
  );
  const [diaSemana, setDia] = useState<string>(tarea?.diaSemana ?? "");
  const [criterioTerminado, setCriterio] = useState(tarea?.criterioTerminado ?? "");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setGuardando(true);
    const payload = {
      titulo,
      descripcion,
      responsableId: responsableId || null,
      diaSemana: diaSemana || null,
      criterioTerminado,
    };
    try {
      const res = tarea
        ? await fetch("/api/tareas-fijas", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: tarea.id, ...payload }),
          })
        : await fetch("/api/tareas-fijas", {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-4"
      onClick={onCerrar}
    >
      <div
        className="my-8 w-full max-w-lg rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {tarea ? "Editar tarea fija" : "Nueva tarea fija"}
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
              placeholder="Ej: Actualizar reporte de dotación"
              autoFocus
              required
            />
          </div>
          <div>
            <Label>Descripción</Label>
            <textarea
              className={cls}
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Día de la semana</Label>
              <select
                className={cls}
                value={diaSemana}
                onChange={(e) => setDia(e.target.value)}
              >
                <option value="">Lunes (por defecto)</option>
                {DIAS_SEMANA.map((d) => (
                  <option key={d} value={d}>
                    {ETIQUETA_DIA[d]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Responsable</Label>
              <select
                className={cls}
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
          </div>
          <div>
            <Label>Criterio de terminado</Label>
            <textarea
              className={cls}
              rows={2}
              value={criterioTerminado}
              onChange={(e) => setCriterio(e.target.value)}
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
            <Button type="submit" cargando={guardando}>
              {tarea ? "Guardar cambios" : "Crear tarea fija"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
