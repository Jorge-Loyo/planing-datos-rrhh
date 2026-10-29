import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { conceptos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { obtenerSesion } from "@/lib/auth";
import { puedeEditar } from "@/lib/permisos";

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

export async function POST(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeEditar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const body = await req.json();
  const termino = txt(body.termino);
  if (!termino) {
    return NextResponse.json({ error: "El término es obligatorio." }, { status: 400 });
  }
  const [creado] = await db
    .insert(conceptos)
    .values({
      termino,
      definicion: txt(body.definicion),
      fuenteDato: txt(body.fuenteDato),
      formulaCalculo: txt(body.formulaCalculo),
      responsableId: idOnull(body.responsableId),
      ultimaActualizacion: fechaOnull(body.ultimaActualizacion),
      creadoPorId: sesion.id,
    })
    .returning({ id: conceptos.id });
  return NextResponse.json({ ok: true, id: creado.id });
}

export async function PATCH(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeEditar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const body = await req.json();
  const id = idOnull(body.id);
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });

  const cambios: Record<string, unknown> = { actualizadoEn: new Date() };
  if (body.termino !== undefined) {
    const t = txt(body.termino);
    if (!t)
      return NextResponse.json(
        { error: "El término no puede quedar vacío." },
        { status: 400 }
      );
    cambios.termino = t;
  }
  if (body.definicion !== undefined) cambios.definicion = txt(body.definicion);
  if (body.fuenteDato !== undefined) cambios.fuenteDato = txt(body.fuenteDato);
  if (body.formulaCalculo !== undefined)
    cambios.formulaCalculo = txt(body.formulaCalculo);
  if (body.responsableId !== undefined)
    cambios.responsableId = idOnull(body.responsableId);
  if (body.ultimaActualizacion !== undefined)
    cambios.ultimaActualizacion = fechaOnull(body.ultimaActualizacion);

  await db.update(conceptos).set(cambios).where(eq(conceptos.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeEditar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = idOnull(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });
  await db.delete(conceptos).where(eq(conceptos.id, id));
  return NextResponse.json({ ok: true });
}
