import { db } from "@/db";
import { tareas } from "@/db/schema";
import { asc } from "drizzle-orm";
import { obtenerSesion } from "@/lib/auth";
import { puedeEditar } from "@/lib/permisos";
import { listarUsuariosActivos } from "@/lib/consultas";
import { KanbanBoard, type TareaKanban } from "./KanbanBoard";

export const dynamic = "force-dynamic";

export default async function KanbanPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;

  const [filas, usuarios] = await Promise.all([
    db
      .select()
      .from(tareas)
      .orderBy(asc(tareas.orden), asc(tareas.id)),
    listarUsuariosActivos(),
  ]);

  const tareasKanban: TareaKanban[] = filas.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    descripcion: t.descripcion ?? "",
    estado: t.estado,
    prioridad: t.prioridad,
    responsableId: t.responsableId,
    segundaPersonaId: t.segundaPersonaId,
    fechaInicio: t.fechaInicio,
    fechaLimite: t.fechaLimite,
    criterioTerminado: t.criterioTerminado ?? "",
    observaciones: t.observaciones ?? "",
    orden: t.orden,
  }));

  return (
    <KanbanBoard
      tareasIniciales={tareasKanban}
      usuarios={usuarios}
      puedeEditar={puedeEditar(sesion.rol)}
    />
  );
}
