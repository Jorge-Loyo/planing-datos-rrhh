import { db } from "@/db";
import { conceptos } from "@/db/schema";
import { asc } from "drizzle-orm";
import { obtenerSesion } from "@/lib/auth";
import { puedeEditar } from "@/lib/permisos";
import { listarUsuariosActivos } from "@/lib/consultas";
import { ConceptosUI, type ConceptoUI } from "./ConceptosUI";

export const dynamic = "force-dynamic";

export default async function ConceptosPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;

  const [filas, usuarios] = await Promise.all([
    db.select().from(conceptos).orderBy(asc(conceptos.termino)),
    listarUsuariosActivos(),
  ]);

  const items: ConceptoUI[] = filas.map((c) => ({
    id: c.id,
    termino: c.termino,
    definicion: c.definicion ?? "",
    fuenteDato: c.fuenteDato ?? "",
    formulaCalculo: c.formulaCalculo ?? "",
    responsableId: c.responsableId,
    ultimaActualizacion: c.ultimaActualizacion,
  }));

  return (
    <ConceptosUI
      itemsIniciales={items}
      usuarios={usuarios}
      puedeEditar={puedeEditar(sesion.rol)}
    />
  );
}
