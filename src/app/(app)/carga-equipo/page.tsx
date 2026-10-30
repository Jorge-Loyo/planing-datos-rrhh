import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth";
import { puedeCoordinar } from "@/lib/permisos";
import { db } from "@/db";
import { tareas, usuarios, pedidos, tareasFijas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { formatearFecha, diasRestantes } from "@/lib/utils";
import { nombreUsuario } from "@/lib/usuarios";
import {
  ETIQUETA_ESTADO,
  COLOR_ESTADO,
  ETIQUETA_ESTADO_PEDIDO,
  COLOR_ESTADO_PEDIDO,
} from "@/lib/dominio";
import { KanbanSquare, Send, Repeat, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CargaEquipoPage() {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeCoordinar(sesion.rol)) {
    redirect("/");
  }

  const [personas, todasTareas, todosPedidos, todasFijas] = await Promise.all([
    db.select().from(usuarios).where(eq(usuarios.activo, true)),
    db.select().from(tareas),
    db.select().from(pedidos),
    db.select().from(tareasFijas).where(eq(tareasFijas.activa, true)),
  ]);

  // Agrupadores por persona
  function tareasActivasDe(uid: number) {
    return todasTareas.filter(
      (t) =>
        t.responsableId === uid &&
        (t.estado === "pendiente" ||
          t.estado === "en_curso" ||
          t.estado === "bloqueada")
    );
  }
  function tareasListasDe(uid: number) {
    return todasTareas.filter((t) => t.responsableId === uid && t.estado === "lista");
  }
  function pedidosAbiertosDe(uid: number) {
    return todosPedidos.filter(
      (p) => p.asignadoId === uid && p.estado !== "resuelto"
    );
  }
  function pedidosResueltosDe(uid: number) {
    return todosPedidos.filter((p) => p.asignadoId === uid && p.estado === "resuelto");
  }
  function fijasDe(uid: number) {
    return todasFijas.filter((f) => f.responsableId === uid);
  }

  // Ordenar personas por carga total (desc) para ver primero a los más cargados
  const conCarga = personas
    .map((p) => {
      const tAct = tareasActivasDe(p.id);
      const pAb = pedidosAbiertosDe(p.id);
      const fij = fijasDe(p.id);
      const cargaTotal = tAct.length + pAb.length + fij.length;
      const bloqueadas = tAct.filter((t) => t.estado === "bloqueada").length;
      return { persona: p, tAct, pAb, fij, cargaTotal, bloqueadas };
    })
    .sort((a, b) => b.cargaTotal - a.cargaTotal);

  const maxCarga = Math.max(1, ...conCarga.map((c) => c.cargaTotal));
  const hayDatos =
    todasTareas.length > 0 || todosPedidos.length > 0 || todasFijas.length > 0;

  return (
    <div>
      <PageHeader
        titulo="Carga del equipo"
        descripcion="Todo lo que tiene cada persona: tareas del Kanban, pedidos y tareas fijas. Objetivo: coordinar, no controlar."
      />

      {!hayDatos ? (
        <EmptyState
          titulo="Todavía no hay trabajo cargado"
          descripcion="Cuando el equipo cargue tareas, pedidos o tareas fijas, vas a ver acá la carga de cada persona."
        />
      ) : (
        <div className="space-y-4">
          {conCarga.map(({ persona, tAct, pAb, fij, cargaTotal, bloqueadas }) => {
            const listas = tareasListasDe(persona.id).length;
            const pedResueltos = pedidosResueltosDe(persona.id).length;
            return (
              <Card key={persona.id}>
                {/* Encabezado persona */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                      {(persona.nombre || persona.apellido || persona.cuil)
                        .slice(0, 1)
                        .toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">
                        {nombreUsuario(persona)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <KanbanSquare size={12} /> {tAct.length} tareas
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Send size={12} /> {pAb.length} pedidos
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Repeat size={12} /> {fij.length} fijas
                        </span>
                        {bloqueadas > 0 && (
                          <span className="text-red-600">· {bloqueadas} bloqueada(s)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-semibold text-slate-900">
                      {cargaTotal}
                    </div>
                    <div className="text-xs text-slate-400">ítems activos</div>
                  </div>
                </div>

                {/* Barra de carga relativa */}
                <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={
                      "h-full rounded-full " +
                      (cargaTotal >= maxCarga && maxCarga > 2
                        ? "bg-red-400"
                        : "bg-brand-500")
                    }
                    style={{ width: `${(cargaTotal / maxCarga) * 100}%` }}
                  />
                </div>

                {cargaTotal === 0 ? (
                  <p className="text-sm text-slate-400">Sin trabajo activo asignado.</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-3">
                    {/* Tareas */}
                    <div>
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <KanbanSquare size={13} /> Tareas
                      </div>
                      <div className="space-y-1.5">
                        {tAct.length === 0 && (
                          <p className="text-xs text-slate-300">—</p>
                        )}
                        {tAct.map((t) => {
                          const dias = diasRestantes(t.fechaLimite);
                          return (
                            <div
                              key={t.id}
                              className="rounded-md bg-slate-50 px-2 py-1.5 text-xs"
                            >
                              <div className="flex items-center gap-1.5">
                                <Badge color={COLOR_ESTADO[t.estado]}>
                                  {ETIQUETA_ESTADO[t.estado]}
                                </Badge>
                                <span className="truncate text-slate-700">
                                  {t.titulo}
                                </span>
                              </div>
                              {t.fechaLimite && (
                                <div
                                  className={
                                    "mt-0.5 " +
                                    (dias !== null && dias < 0
                                      ? "text-red-600"
                                      : "text-slate-400")
                                  }
                                >
                                  {formatearFecha(t.fechaLimite)}
                                  {dias !== null &&
                                    (dias < 0
                                      ? ` (${Math.abs(dias)}d venc.)`
                                      : ` (${dias}d)`)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Pedidos */}
                    <div>
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <Send size={13} /> Pedidos
                      </div>
                      <div className="space-y-1.5">
                        {pAb.length === 0 && (
                          <p className="text-xs text-slate-300">—</p>
                        )}
                        {pAb.map((p) => (
                          <div
                            key={p.id}
                            className="rounded-md bg-slate-50 px-2 py-1.5 text-xs"
                          >
                            <div className="flex items-center gap-1.5">
                              <Badge color={COLOR_ESTADO_PEDIDO[p.estado]}>
                                {ETIQUETA_ESTADO_PEDIDO[p.estado]}
                              </Badge>
                            </div>
                            <div className="mt-0.5 truncate text-slate-700">
                              {p.descripcion}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tareas fijas */}
                    <div>
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <Repeat size={13} /> Tareas fijas
                      </div>
                      <div className="space-y-1.5">
                        {fij.length === 0 && (
                          <p className="text-xs text-slate-300">—</p>
                        )}
                        {fij.map((f) => (
                          <div
                            key={f.id}
                            className="truncate rounded-md bg-slate-50 px-2 py-1.5 text-xs text-slate-700"
                          >
                            {f.titulo}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Historial / resuelto */}
                {(listas > 0 || pedResueltos > 0) && (
                  <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <CheckCircle2 size={14} className="text-green-600" />
                    <span>
                      Resuelto: {listas} tarea(s) lista(s) · {pedResueltos} pedido(s)
                      resuelto(s)
                    </span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
