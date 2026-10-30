import { db } from "@/db";
import { backlog, tareas } from "@/db/schema";
import { desc, isNotNull } from "drizzle-orm";
import { obtenerSesion } from "@/lib/auth";
import { puedeEditar, puedeCoordinar } from "@/lib/permisos";
import { BacklogTabla, type ItemBacklogUI } from "./BacklogTabla";

export const dynamic = "force-dynamic";

export default async function BacklogPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;

  const [filas, tareasVinculadas] = await Promise.all([
    db.select().from(backlog).orderBy(desc(backlog.id)),
    db
      .select({
        id: tareas.id,
        estado: tareas.estado,
        backlogId: tareas.backlogId,
        fechaLimite: tareas.fechaLimite,
        responsableId: tareas.responsableId,
      })
      .from(tareas)
      .where(isNotNull(tareas.backlogId)),
  ]);

  // Mapa backlogId -> datos de la tarea del Kanban vinculada
  const tareaPorBacklog = new Map(
    tareasVinculadas
      .filter((t) => t.backlogId != null)
      .map((t) => [t.backlogId as number, t])
  );

  const items: ItemBacklogUI[] = filas.map((b) => {
    const tv = tareaPorBacklog.get(b.id);
    return {
      id: b.id,
      codigo: b.codigo,
      pedido: b.pedido,
      areaSolicitante: b.areaSolicitante ?? "",
      decisionQueApoya: b.decisionQueApoya ?? "",
      impacto: b.impacto,
      esfuerzo: b.esfuerzo,
      estado: b.estado,
      fechaIngreso: b.fechaIngreso,
      estadoTareaKanban: tv?.estado ?? null,
      fechaLimiteTarea: tv?.fechaLimite ?? null,
    };
  });

  return (
    <BacklogTabla
      itemsIniciales={items}
      puedeEditar={puedeEditar(sesion.rol)}
      puedeCoordinar={puedeCoordinar(sesion.rol)}
    />
  );
}
