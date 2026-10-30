import { db } from "@/db";
import { prioridades, tareas } from "@/db/schema";
import { asc, ne, inArray, and } from "drizzle-orm";
import { obtenerSesion } from "@/lib/auth";
import { puedeCoordinar } from "@/lib/permisos";
import { listarUsuariosActivos } from "@/lib/consultas";
import {
  AficheprioridadesUI,
  type PrioridadUI,
  type TareaPriorizadaUI,
} from "./Afiche";

export const dynamic = "force-dynamic";

export default async function PrioridadesPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;

  const [filas, usuarios, tareasPri] = await Promise.all([
    db.select().from(prioridades).orderBy(asc(prioridades.nivel)),
    listarUsuariosActivos(),
    // Tareas del Kanban con prioridad asignada y que siguen activas (no "lista")
    db
      .select({
        id: tareas.id,
        titulo: tareas.titulo,
        prioridad: tareas.prioridad,
        estado: tareas.estado,
        responsableId: tareas.responsableId,
        fechaLimite: tareas.fechaLimite,
      })
      .from(tareas)
      .where(
        and(
          ne(tareas.prioridad, "sin_prioridad"),
          inArray(tareas.estado, ["pendiente", "en_curso", "bloqueada"])
        )
      ),
  ]);

  const items: PrioridadUI[] = filas
    .filter((p) => p.nivel !== "sin_prioridad")
    .map((p) => ({
      id: p.id,
      nivel: p.nivel as PrioridadUI["nivel"],
      queEs: p.queEs,
      porQueImporta: p.porQueImporta ?? "",
      responsableId: p.responsableId,
      fechaEstimada: p.fechaEstimada,
      activa: p.activa,
    }));

  const tareasPriorizadas: TareaPriorizadaUI[] = tareasPri
    .filter((t) => t.prioridad !== "sin_prioridad")
    .map((t) => ({
      id: t.id,
      titulo: t.titulo,
      nivel: t.prioridad as TareaPriorizadaUI["nivel"],
      estado: t.estado,
      responsableId: t.responsableId,
      fechaLimite: t.fechaLimite,
    }));

  return (
    <AficheprioridadesUI
      itemsIniciales={items}
      tareasPriorizadas={tareasPriorizadas}
      usuarios={usuarios}
      puedeCoordinar={puedeCoordinar(sesion.rol)}
    />
  );
}
