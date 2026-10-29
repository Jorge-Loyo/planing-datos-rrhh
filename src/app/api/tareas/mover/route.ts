import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tareas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { obtenerSesion } from "@/lib/auth";
import { puedeEditar } from "@/lib/permisos";
import { ESTADOS_TAREA, type EstadoTarea } from "@/lib/dominio";

// Reordena/mueve tareas. Recibe el estado destino y la lista ordenada de ids
// de esa columna tras el drop. Asigna orden incremental a cada una.
export async function POST(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeEditar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await req.json();
  const estado = body.estado as EstadoTarea;
  const ids = Array.isArray(body.ids) ? body.ids.map(Number) : [];

  if (!ESTADOS_TAREA.includes(estado)) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }
  if (ids.some((n: number) => !Number.isInteger(n) || n <= 0)) {
    return NextResponse.json({ error: "Lista de ids inválida." }, { status: 400 });
  }

  // Actualiza cada tarea de la columna con su nuevo estado y orden.
  await Promise.all(
    ids.map((id: number, idx: number) =>
      db
        .update(tareas)
        .set({ estado, orden: idx, actualizadoEn: new Date() })
        .where(eq(tareas.id, id))
    )
  );

  return NextResponse.json({ ok: true });
}
