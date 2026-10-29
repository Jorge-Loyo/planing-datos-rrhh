import { db } from "@/db";
import { recursos, versionesRecurso } from "@/db/schema";
import { desc, asc } from "drizzle-orm";
import { obtenerSesion } from "@/lib/auth";
import { puedeEditar } from "@/lib/permisos";
import { listarUsuariosActivos } from "@/lib/consultas";
import { ArchivosUI, type RecursoUI } from "./ArchivosUI";

export const dynamic = "force-dynamic";

export default async function ArchivosPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;

  const [recs, versiones, usuarios] = await Promise.all([
    db.select().from(recursos).orderBy(desc(recursos.id)),
    db
      .select()
      .from(versionesRecurso)
      .orderBy(desc(versionesRecurso.vigente), desc(versionesRecurso.id)),
    listarUsuariosActivos(),
  ]);

  const items: RecursoUI[] = recs.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    tipo: r.tipo,
    queContiene: r.queContiene ?? "",
    responsableId: r.responsableId,
    versiones: versiones
      .filter((v) => v.recursoId === r.id)
      .map((v) => ({
        id: v.id,
        version: v.version,
        urlDrive: v.urlDrive,
        nota: v.nota ?? "",
        vigente: v.vigente,
        creadoEn: v.creadoEn ? new Date(v.creadoEn).toISOString() : null,
      })),
  }));

  return (
    <ArchivosUI
      itemsIniciales={items}
      usuarios={usuarios}
      puedeEditar={puedeEditar(sesion.rol)}
    />
  );
}
