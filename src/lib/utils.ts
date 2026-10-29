import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Valida un CUIL/CUIT argentino (11 digitos, con digito verificador).
export function cuilValido(cuil: string): boolean {
  const limpio = cuil.replace(/[\s-]/g, "");
  if (!/^\d{11}$/.test(limpio)) return false;
  const mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const digitos = limpio.split("").map(Number);
  const suma = mult.reduce((acc, m, i) => acc + m * digitos[i], 0);
  let dv = 11 - (suma % 11);
  if (dv === 11) dv = 0;
  if (dv === 10) dv = 9;
  return dv === digitos[10];
}

export function normalizarCuil(cuil: string): string {
  return cuil.replace(/[\s-]/g, "");
}

export function formatearFecha(fecha?: string | Date | null): string {
  if (!fecha) return "—";
  const d = typeof fecha === "string" ? new Date(fecha + "T00:00:00") : fecha;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Dias restantes hasta la fecha limite (null si no hay fecha)
export function diasRestantes(fechaLimite?: string | null): number | null {
  if (!fechaLimite) return null;
  const limite = new Date(fechaLimite + "T00:00:00");
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diff = Math.round((limite.getTime() - hoy.getTime()) / 86400000);
  return diff;
}
