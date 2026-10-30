import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tareas } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { obtenerSesion } from "@/lib/auth";
import { puedeEditar, puedeCoordinar } from "@/lib/permisos";
import {
  ESTADOS_TAREA,
  PRIORIDADES,
  type EstadoTarea,
  type PrioridadTarea,
} from "@/lib/dominio";
import {
  crearBacklogParaTarea,
  sincronizarBacklogDeTarea,
} from "@/lib/sync-backlog";

function limpiarTexto(v: unknown): string {
  return String(v ?? "").trim();
}
function idOnull(v: unknown): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}
function fechaOnull(v: unknown): string | null {
  const s = limpiarTexto(v);
  return s === "" ? null : s;
}

// Crear tarea
export async function POST(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeEditar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await req.json();
  const titulo = limpiarTexto(body.titulo);
  if (!titulo) {
    return NextResponse.json(
      { error: "El título es obligatorio." },
      { status: 400 }
    );
  }

  const estado: EstadoTarea = ESTADOS_TAREA.includes(body.estado)
    ? body.estado
    : "pendiente";
  const prioridad: PrioridadTarea = PRIORIDADES.includes(body.prioridad)
    ? body.prioridad
    : "sin_prioridad";

  // Colocar al final de la columna destino
  const maxOrden = await db
    .select({ max: sql<number>`coalesce(max(${tareas.orden}), 0)` })
    .from(tareas)
    .where(eq(tareas.estado, estado));
  const orden = (maxOrden[0]?.max ?? 0) + 1;

  // Si la tarea viene de un item de backlog existente, se respeta ese vínculo.
  const backlogIdOrigen = idOnull(body.backlogId);

  const [creada] = await db
    .insert(tareas)
    .values({
      titulo,
      descripcion: limpiarTexto(body.descripcion),
      estado,
      prioridad,
      responsableId: idOnull(body.responsableId),
      segundaPersonaId: idOnull(body.segundaPersonaId),
      fechaInicio: fechaOnull(body.fechaInicio),
      fechaLimite: fechaOnull(body.fechaLimite),
      criterioTerminado: limpiarTexto(body.criterioTerminado),
      observaciones: limpiarTexto(body.observaciones),
      backlogId: backlogIdOrigen,
      orden,
      creadoPorId: sesion.id,
    })
    .returning({ id: tareas.id });

  // Opción B: si la tarea NO proviene de un item de backlog, se crea su reflejo
  // en el Backlog para que éste muestre todo lo que el equipo tiene en marcha.
  if (!backlogIdOrigen) {
    const escalas = ["alto", "medio", "bajo"];
    await crearBacklogParaTarea({
      tareaId: creada.id,
      titulo,
      descripcion: limpiarTexto(body.descripcion),
      estado,
      creadoPorId: sesion.id,
      areaSolicitante: limpiarTexto(body.areaSolicitante) || null,
      impacto: escalas.includes(body.impacto) ? body.impacto : null,
      esfuerzo: escalas.includes(body.esfuerzo) ? body.esfuerzo : null,
    });
  }

  return NextResponse.json({ ok: true, id: creada.id });
}

// Actualizar tarea (editar campos, mover de columna, reordenar)
export async function PATCH(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeEditar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await req.json();
  const id = idOnull(body.id);
  if (!id) {
    return NextResponse.json({ error: "Falta el id." }, { status: 400 });
  }

  const filas = await db.select().from(tareas).where(eq(tareas.id, id));
  const tarea = filas[0];
  if (!tarea) {
    return NextResponse.json({ error: "Tarea no encontrada." }, { status: 404 });
  }

  // Regla de coordinación: solo líder/admin pueden reasignar tareas de otros.
  // Un miembro puede editar cualquier tarea salvo cambiar el responsable de
  // una tarea que no creó y no tiene asignada (para respetar "coordinar, no controlar").
  const cambios: Record<string, unknown> = { actualizadoEn: new Date() };

  if (body.titulo !== undefined) {
    const t = limpiarTexto(body.titulo);
    if (!t)
      return NextResponse.json(
        { error: "El título no puede quedar vacío." },
        { status: 400 }
      );
    cambios.titulo = t;
  }
  if (body.descripcion !== undefined) cambios.descripcion = limpiarTexto(body.descripcion);
  if (body.estado !== undefined && ESTADOS_TAREA.includes(body.estado))
    cambios.estado = body.estado;
  if (body.prioridad !== undefined && PRIORIDADES.includes(body.prioridad))
    cambios.prioridad = body.prioridad;
  if (body.fechaInicio !== undefined) cambios.fechaInicio = fechaOnull(body.fechaInicio);
  if (body.fechaLimite !== undefined) cambios.fechaLimite = fechaOnull(body.fechaLimite);
  if (body.criterioTerminado !== undefined)
    cambios.criterioTerminado = limpiarTexto(body.criterioTerminado);
  if (body.observaciones !== undefined)
    cambios.observaciones = limpiarTexto(body.observaciones);
  if (body.orden !== undefined && Number.isInteger(Number(body.orden)))
    cambios.orden = Number(body.orden);
  if (body.segundaPersonaId !== undefined)
    cambios.segundaPersonaId = idOnull(body.segundaPersonaId);

  if (body.responsableId !== undefined) {
    const nuevoResp = idOnull(body.responsableId);
    const reasignaOtro =
      nuevoResp !== tarea.responsableId &&
      tarea.responsableId !== null &&
      tarea.responsableId !== sesion.id;
    if (reasignaOtro && !puedeCoordinar(sesion.rol)) {
      return NextResponse.json(
        {
          error:
            "Solo un líder o administrador puede reasignar una tarea de otra persona.",
        },
        { status: 403 }
      );
    }
    cambios.responsableId = nuevoResp;
  }

  await db.update(tareas).set(cambios).where(eq(tareas.id, id));

  // Mantener sincronizado el reflejo en el Backlog (estado/título)
  if (cambios.estado !== undefined || cambios.titulo !== undefined) {
    await sincronizarBacklogDeTarea(id);
  }

  return NextResponse.json({ ok: true });
}

// Eliminar tarea
export async function DELETE(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeEditar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = idOnull(searchParams.get("id"));
  if (!id) {
    return NextResponse.json({ error: "Falta el id." }, { status: 400 });
  }
  await db.delete(tareas).where(eq(tareas.id, id));
  return NextResponse.json({ ok: true });
}
