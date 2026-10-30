import { db } from "@/db";
import { tareas, tiposEntregable, criteriosTerminado } from "@/db/schema";
import { asc } from "drizzle-orm";
import { obtenerSesion } from "@/lib/auth";
import { puedeEditar } from "@/lib/permisos";
import { listarUsuariosActivos } from "@/lib/consultas";
import { KanbanBoard, type TareaKanban, type TipoEntregableMin } from "./KanbanBoard";

export const dynamic = "force-dynamic";

export default async function KanbanPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;

  const [filas, usuarios, tipos, criterios] = await Promise.all([
    db
      .select()
      .from(tareas)
      .orderBy(asc(tareas.orden), asc(tareas.id)),
    listarUsuariosActivos(),
    db.select().from(tiposEntregable).orderBy(asc(tiposEntregable.nombre)),
    db
      .select()
      .from(criteriosTerminado)
      .orderBy(asc(criteriosTerminado.orden), asc(criteriosTerminado.id)),
  ]);

  const tiposEntregableMin: TipoEntregableMin[] = tipos.map((t) => ({
    id: t.id,
    nombre: t.nombre,
    criterios: criterios
      .filter((c) => c.tipoEntregableId === t.id)
      .map((c) => c.criterio),
  }));

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
      tiposEntregable={tiposEntregableMin}
      puedeEditar={puedeEditar(sesion.rol)}
    />
  );
}
