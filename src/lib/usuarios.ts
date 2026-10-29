// Tipos y helpers de usuario SEGUROS PARA EL CLIENTE.
// No importa nada de la base de datos, así se puede usar en componentes "use client".

export interface UsuarioMin {
  id: number;
  nombre: string;
  apellido: string;
  cuil: string;
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
