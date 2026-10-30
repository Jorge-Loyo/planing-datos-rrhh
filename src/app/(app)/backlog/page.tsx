import { db } from "@/db";
import { backlog, tareas } from "@/db/schema";
import { desc, isNotNull } from "drizzle-orm";
import { obtenerSesion } from "@/lib/auth";
import { puedeEditar, puedeCoordinar } from "@/lib/permisos";
import { listarUsuariosActivos } from "@/lib/consultas";
import { BacklogTabla, type ItemBacklogUI } from "./BacklogTabla";

export const dynamic = "force-dynamic";

export default async function BacklogPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;

  const [filas, usuarios, tareasVinculadas] = await Promise.all([
    db.select().from(backlog).orderBy(desc(backlog.id)),
    listarUsuariosActivos(),
    db
      .select({
        id: tareas.id,
        estado: tareas.estado,
        backlogId: tareas.backlogId,
      })
      .from(tareas)
      .where(isNotNull(tareas.backlogId)),
  ]);

  // Mapa backlogId -> estado de la tarea del Kanban
  const estadoTareaPorBacklog = new Map(
    tareasVinculadas
      .filter((t) => t.backlogId != null)
      .map((t) => [t.backlogId as number, t.estado])
  );

  const items: ItemBacklogUI[] = filas.map((b) => ({
    id: b.id,
    codigo: b.codigo,
    pedido: b.pedido,
    areaSolicitante: b.areaSolicitante ?? "",
    decisionQueApoya: b.decisionQueApoya ?? "",
    impacto: b.impacto,
    esfuerzo: b.esfuerzo,
    estado: b.estado,
    fechaIngreso: b.fechaIngreso,
    estadoTareaKanban: estadoTareaPorBacklog.get(b.id) ?? null,
  }));

  return (
    <BacklogTabla
      itemsIniciales={items}
      usuarios={usuarios}
      puedeEditar={puedeEditar(sesion.rol)}
      puedeCoordinar={puedeCoordinar(sesion.rol)}
    />
  );
}
