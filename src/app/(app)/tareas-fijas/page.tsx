import { db } from "@/db";
import { tareasFijas } from "@/db/schema";
import { asc } from "drizzle-orm";
import { obtenerSesion } from "@/lib/auth";
import { puedeEditar } from "@/lib/permisos";
import { listarUsuariosActivos } from "@/lib/consultas";
import { TareasFijasUI, type TareaFijaUI } from "./TareasFijasUI";

export const dynamic = "force-dynamic";

export default async function TareasFijasPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;

  const [filas, usuarios] = await Promise.all([
    db.select().from(tareasFijas).orderBy(asc(tareasFijas.id)),
    listarUsuariosActivos(),
  ]);

  const items: TareaFijaUI[] = filas.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    descripcion: t.descripcion ?? "",
    responsableId: t.responsableId,
    diaSemana: t.diaSemana,
    criterioTerminado: t.criterioTerminado ?? "",
    activa: t.activa,
  }));

  return (
    <TareasFijasUI
      itemsIniciales={items}
      usuarios={usuarios}
      puedeEditar={puedeEditar(sesion.rol)}
    />
  );
}
