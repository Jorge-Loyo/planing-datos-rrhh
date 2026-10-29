import { db } from "@/db";
import { prioridades } from "@/db/schema";
import { asc } from "drizzle-orm";
import { obtenerSesion } from "@/lib/auth";
import { puedeCoordinar } from "@/lib/permisos";
import { listarUsuariosActivos } from "@/lib/consultas";
import { AficheprioridadesUI, type PrioridadUI } from "./Afiche";

export const dynamic = "force-dynamic";

export default async function PrioridadesPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;

  const [filas, usuarios] = await Promise.all([
    db.select().from(prioridades).orderBy(asc(prioridades.nivel)),
    listarUsuariosActivos(),
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

  return (
    <AficheprioridadesUI
      itemsIniciales={items}
      usuarios={usuarios}
      puedeCoordinar={puedeCoordinar(sesion.rol)}
    />
  );
}
