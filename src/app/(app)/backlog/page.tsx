import { db } from "@/db";
import { backlog } from "@/db/schema";
import { desc } from "drizzle-orm";
import { obtenerSesion } from "@/lib/auth";
import { puedeEditar, puedeCoordinar } from "@/lib/permisos";
import { listarUsuariosActivos } from "@/lib/consultas";
import { BacklogTabla, type ItemBacklogUI } from "./BacklogTabla";

export const dynamic = "force-dynamic";

export default async function BacklogPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;

  const [filas, usuarios] = await Promise.all([
    db.select().from(backlog).orderBy(desc(backlog.id)),
    listarUsuariosActivos(),
  ]);

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
