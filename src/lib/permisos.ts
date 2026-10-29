import type { Rol } from "./auth";

// Jerarquia de roles: admin > lider > miembro > consulta
const NIVEL: Record<Rol, number> = {
  admin: 4,
  lider: 3,
  miembro: 2,
  consulta: 1,
};

export function tieneNivel(rol: Rol, minimo: Rol): boolean {
  return NIVEL[rol] >= NIVEL[minimo];
}

// Puede crear/editar contenido de trabajo (tareas, backlog, reuniones, etc.)
export function puedeEditar(rol: Rol): boolean {
  return tieneNivel(rol, "miembro");
}

// Potestades de coordinacion (reasignar, priorizar, vista de carga del equipo)
export function puedeCoordinar(rol: Rol): boolean {
  return tieneNivel(rol, "lider");
}

// Administracion del sistema (usuarios, roles, config)
export function puedeAdministrar(rol: Rol): boolean {
  return tieneNivel(rol, "admin");
}

export const ETIQUETA_ROL: Record<Rol, string> = {
  admin: "Administrador",
  lider: "Líder",
  miembro: "Miembro",
  consulta: "Consulta",
};
