import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export interface UsuarioMin {
  id: number;
  nombre: string;
  apellido: string;
  cuil: string;
}

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

export function nombreUsuario(u?: {
  nombre?: string | null;
  apellido?: string | null;
  cuil?: string | null;
} | null): string {
  if (!u) return "Sin asignar";
  const nc = `${u.nombre ?? ""} ${u.apellido ?? ""}`.trim();
  return nc || u.cuil || "Sin asignar";
}
