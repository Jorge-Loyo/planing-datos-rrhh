import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tiposEntregable, criteriosTerminado } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { obtenerSesion } from "@/lib/auth";
import { puedeEditar } from "@/lib/permisos";

function txt(v: unknown): string {
  return String(v ?? "").trim();
}

// Crear tipo de entregable
export async function POST(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeEditar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const body = await req.json();
  const nombre = txt(body.nombre);
  if (!nombre) {
    return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  }
  const [creado] = await db
    .insert(tiposEntregable)
    .values({ nombre, descripcion: txt(body.descripcion) })
    .returning({ id: tiposEntregable.id });
  return NextResponse.json({ ok: true, id: creado.id });
}

// Actualizar tipo
export async function PATCH(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeEditar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const body = await req.json();
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });
  const cambios: Record<string, unknown> = {};
  if (body.nombre !== undefined) {
    const n = txt(body.nombre);
    if (!n)
      return NextResponse.json(
        { error: "El nombre no puede quedar vacío." },
        { status: 400 }
      );
    cambios.nombre = n;
  }
  if (body.descripcion !== undefined) cambios.descripcion = txt(body.descripcion);
  await db.update(tiposEntregable).set(cambios).where(eq(tiposEntregable.id, id));
  return NextResponse.json({ ok: true });
}

// Eliminar tipo (elimina sus criterios en cascada)
export async function DELETE(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeEditar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });
  await db.delete(tiposEntregable).where(eq(tiposEntregable.id, id));
  return NextResponse.json({ ok: true });
}

// Agregar criterio a un tipo (acción via PUT con subrecurso en el body)
export async function PUT(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeEditar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const body = await req.json();
  const accion = body.accion;

  if (accion === "agregar_criterio") {
    const tipoId = Number(body.tipoEntregableId);
    const criterio = txt(body.criterio);
    if (!tipoId || !criterio) {
      return NextResponse.json(
        { error: "Falta el tipo o el texto del criterio." },
        { status: 400 }
      );
    }
    const maxOrden = await db
      .select({ max: sql<number>`coalesce(max(${criteriosTerminado.orden}), 0)` })
      .from(criteriosTerminado)
      .where(eq(criteriosTerminado.tipoEntregableId, tipoId));
    const orden = (maxOrden[0]?.max ?? 0) + 1;
    const [c] = await db
      .insert(criteriosTerminado)
      .values({ tipoEntregableId: tipoId, criterio, orden })
      .returning({ id: criteriosTerminado.id });
    return NextResponse.json({ ok: true, id: c.id });
  }

  if (accion === "eliminar_criterio") {
    const criterioId = Number(body.criterioId);
    if (!criterioId)
      return NextResponse.json({ error: "Falta el id del criterio." }, { status: 400 });
    await db.delete(criteriosTerminado).where(eq(criteriosTerminado.id, criterioId));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
}
