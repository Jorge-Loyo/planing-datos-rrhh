import { db } from "@/db";
import { reuniones } from "@/db/schema";
import { desc } from "drizzle-orm";
import { obtenerSesion } from "@/lib/auth";
import { puedeEditar } from "@/lib/permisos";
import { ReunionesUI, type ReunionUI } from "./ReunionesUI";

export const dynamic = "force-dynamic";

export default async function ReunionesPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;

  const filas = await db.select().from(reuniones).orderBy(desc(reuniones.fecha));

  const items: ReunionUI[] = filas.map((r) => ({
    id: r.id,
    titulo: r.titulo,
    fecha: r.fecha,
    avances: r.avances ?? "",
    bloqueos: r.bloqueos ?? "",
    focoSemana: r.focoSemana ?? "",
    acuerdos: r.acuerdos ?? "",
    participantes: r.participantes ?? "",
  }));

  return (
    <ReunionesUI itemsIniciales={items} puedeEditar={puedeEditar(sesion.rol)} />
  );
}
