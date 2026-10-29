import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth";
import { puedeCoordinar } from "@/lib/permisos";
import { db } from "@/db";
import { tareas, usuarios } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { formatearFecha, diasRestantes } from "@/lib/utils";
import { nombreUsuario } from "@/lib/consultas";
import {
  ETIQUETA_ESTADO,
  COLOR_ESTADO,
  type EstadoTarea,
} from "@/lib/dominio";

export const dynamic = "force-dynamic";

export default async function CargaEquipoPage() {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeCoordinar(sesion.rol)) {
    redirect("/");
  }

  // Usuarios activos + tareas no cerradas (pendiente, en_curso, bloqueada)
  const [personas, tareasActivas] = await Promise.all([
    db.select().from(usuarios).where(eq(usuarios.activo, true)),
    db
      .select()
      .from(tareas)
      .where(inArray(tareas.estado, ["pendiente", "en_curso", "bloqueada"])),
  ]);

  // Agrupar por responsable
  const porPersona = new Map<number, typeof tareasActivas>();
  const sinAsignar: typeof tareasActivas = [];
  for (const t of tareasActivas) {
    if (t.responsableId == null) {
      sinAsignar.push(t);
    } else {
      const arr = porPersona.get(t.responsableId) ?? [];
      arr.push(t);
      porPersona.set(t.responsableId, arr);
    }
  }

  function contarPorEstado(lista: typeof tareasActivas, estado: EstadoTarea) {
    return lista.filter((t) => t.estado === estado).length;
  }

  const hayTareas = tareasActivas.length > 0;

  return (
    <div>
      <PageHeader
        titulo="Carga del equipo"
        descripcion="Qué hace cada persona, para coordinar y no duplicar esfuerzo. Objetivo: coordinar, no controlar."
      />

      {!hayTareas ? (
        <EmptyState
          titulo="No hay tareas activas"
          descripcion="Cuando el equipo cargue tareas en el Kanban, vas a ver acá la carga de cada persona."
        />
      ) : (
        <div className="space-y-4">
          {personas.map((p) => {
            const lista = porPersona.get(p.id) ?? [];
            const bloqueadas = contarPorEstado(lista, "bloqueada");
            return (
              <Card key={p.id}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-600">
                      {(p.nombre || p.apellido || p.cuil).slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">
                        {nombreUsuario(p)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {lista.length} tarea{lista.length === 1 ? "" : "s"} activa
                        {lista.length === 1 ? "" : "s"}
                        {bloqueadas > 0 && (
                          <span className="ml-2 text-red-600">
                            · {bloqueadas} bloqueada{bloqueadas === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {lista.length === 0 ? (
                  <p className="text-sm text-slate-400">Sin tareas activas.</p>
                ) : (
                  <div className="space-y-2">
                    {lista
                      .sort((a, b) => a.estado.localeCompare(b.estado))
                      .map((t) => {
                        const dias = diasRestantes(t.fechaLimite);
                        return (
                          <div
                            key={t.id}
                            className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2"
                          >
                            <Badge color={COLOR_ESTADO[t.estado]}>
                              {ETIQUETA_ESTADO[t.estado]}
                            </Badge>
                            <span className="text-sm text-slate-800">{t.titulo}</span>
                            {t.fechaLimite && (
                              <span
                                className={
                                  "ml-auto text-xs " +
                                  (dias !== null && dias < 0
                                    ? "text-red-600"
                                    : "text-slate-500")
                                }
                              >
                                {formatearFecha(t.fechaLimite)}
                                {dias !== null &&
                                  (dias < 0
                                    ? ` (${Math.abs(dias)}d vencida)`
                                    : ` (${dias}d)`)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </Card>
            );
          })}

          {sinAsignar.length > 0 && (
            <Card className="border-dashed">
              <div className="mb-2 font-medium text-slate-700">
                Sin asignar ({sinAsignar.length})
              </div>
              <div className="space-y-2">
                {sinAsignar.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 rounded-lg bg-yellow-50 px-3 py-2"
                  >
                    <Badge color={COLOR_ESTADO[t.estado]}>
                      {ETIQUETA_ESTADO[t.estado]}
                    </Badge>
                    <span className="text-sm text-slate-800">{t.titulo}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
