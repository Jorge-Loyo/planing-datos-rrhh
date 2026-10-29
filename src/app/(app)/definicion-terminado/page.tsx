import { db } from "@/db";
import { tiposEntregable, criteriosTerminado } from "@/db/schema";
import { asc } from "drizzle-orm";
import { obtenerSesion } from "@/lib/auth";
import { puedeEditar } from "@/lib/permisos";
import { DefinicionUI, type TipoEntregableUI } from "./DefinicionUI";

export const dynamic = "force-dynamic";

export default async function DefinicionTerminadoPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;

  const [tipos, criterios] = await Promise.all([
    db.select().from(tiposEntregable).orderBy(asc(tiposEntregable.nombre)),
    db
      .select()
      .from(criteriosTerminado)
      .orderBy(asc(criteriosTerminado.orden), asc(criteriosTerminado.id)),
  ]);

  const items: TipoEntregableUI[] = tipos.map((t) => ({
    id: t.id,
    nombre: t.nombre,
    descripcion: t.descripcion ?? "",
    criterios: criterios
      .filter((c) => c.tipoEntregableId === t.id)
      .map((c) => ({ id: c.id, criterio: c.criterio })),
  }));

  return (
    <DefinicionUI itemsIniciales={items} puedeEditar={puedeEditar(sesion.rol)} />
  );
}
