// Consultas de SERVIDOR (tocan la base de datos). No importar desde componentes
// con "use client": arrastraría el driver de la base al navegador.
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import type { UsuarioMin } from "@/lib/usuarios";

export type { UsuarioMin } from "@/lib/usuarios";
export { nombreUsuario } from "@/lib/usuarios";

// Lista de usuarios activos para selects de responsable/segunda persona.
export async function listarUsuariosActivos(): Promise<UsuarioMin[]> {
  const filas = await db
    .select({
      id: usuarios.id,
      nombre: usuarios.nombre,
      apellido: usuarios.apellido,
      cuil: usuarios.cuil,
    })
    .from(usuarios)
    .where(eq(usuarios.activo, true))
    .orderBy(asc(usuarios.apellido), asc(usuarios.nombre));
  return filas;
}
