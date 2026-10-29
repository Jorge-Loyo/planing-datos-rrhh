import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prioridades } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { obtenerSesion } from "@/lib/auth";
import { puedeCoordinar } from "@/lib/permisos";
import { NIVELES_AFICHE, type NivelAfiche } from "@/lib/dominio";

function txt(v: unknown): string {
  return String(v ?? "").trim();
}
function idOnull(v: unknown): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}
function fechaOnull(v: unknown): string | null {
  const s = txt(v);
  return s === "" ? null : s;
}

// Crear prioridad. Definir prioridades es potestad de coordinación (líder/admin).
export async function POST(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeCoordinar(sesion.rol)) {
    return NextResponse.json(
      { error: "Solo un líder o administrador puede definir prioridades." },
      { status: 403 }
    );
  }
  const body = await req.json();
  const nivel = body.nivel as NivelAfiche;
  const queEs = txt(body.queEs);
  if (!NIVELES_AFICHE.includes(nivel)) {
    return NextResponse.json({ error: "Nivel inválido." }, { status: 400 });
  }
  if (!queEs) {
    return NextResponse.json(
      { error: 'El campo "qué es" es obligatorio.' },
      { status: 400 }
    );
  }

  // Regla del afiche: máximo 5 prioridades activas.
  const activas = await db
    .select({ id: prioridades.id })
    .from(prioridades)
    .where(eq(prioridades.activa, true));
  if (activas.length >= 5) {
    return NextResponse.json(
      {
        error:
          "Ya hay 5 prioridades activas. Si entra algo urgente, sacá otra primero (acordarlo en la reunión semanal).",
      },
      { status: 409 }
    );
  }

  const [creada] = await db
    .insert(prioridades)
    .values({
      nivel,
      queEs,
      porQueImporta: txt(body.porQueImporta),
      responsableId: idOnull(body.responsableId),
      fechaEstimada: fechaOnull(body.fechaEstimada),
      activa: true,
      creadoPorId: sesion.id,
    })
    .returning({ id: prioridades.id });
  return NextResponse.json({ ok: true, id: creada.id });
}

// Actualizar prioridad (editar o archivar)
export async function PATCH(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeCoordinar(sesion.rol)) {
    return NextResponse.json(
      { error: "Solo un líder o administrador puede editar prioridades." },
      { status: 403 }
    );
  }
  const body = await req.json();
  const id = idOnull(body.id);
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });

  const cambios: Record<string, unknown> = { actualizadoEn: new Date() };
  if (body.nivel !== undefined && NIVELES_AFICHE.includes(body.nivel))
    cambios.nivel = body.nivel;
  if (body.queEs !== undefined) {
    const q = txt(body.queEs);
    if (!q)
      return NextResponse.json(
        { error: 'El campo "qué es" no puede quedar vacío.' },
        { status: 400 }
      );
    cambios.queEs = q;
  }
  if (body.porQueImporta !== undefined)
    cambios.porQueImporta = txt(body.porQueImporta);
  if (body.responsableId !== undefined)
    cambios.responsableId = idOnull(body.responsableId);
  if (body.fechaEstimada !== undefined)
    cambios.fechaEstimada = fechaOnull(body.fechaEstimada);

  // Reactivar respeta el límite de 5
  if (body.activa !== undefined) {
    const activar = Boolean(body.activa);
    if (activar) {
      const activas = await db
        .select({ id: prioridades.id })
        .from(prioridades)
        .where(and(eq(prioridades.activa, true)));
      if (activas.length >= 5) {
        return NextResponse.json(
          { error: "Ya hay 5 prioridades activas. Archivá otra primero." },
          { status: 409 }
        );
      }
    }
    cambios.activa = activar;
  }

  await db.update(prioridades).set(cambios).where(eq(prioridades.id, id));
  return NextResponse.json({ ok: true });
}

// Eliminar prioridad
export async function DELETE(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeCoordinar(sesion.rol)) {
    return NextResponse.json(
      { error: "Solo un líder o administrador puede eliminar prioridades." },
      { status: 403 }
    );
  }
  const { searchParams } = new URL(req.url);
  const id = idOnull(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });
  await db.delete(prioridades).where(eq(prioridades.id, id));
  return NextResponse.json({ ok: true });
}
