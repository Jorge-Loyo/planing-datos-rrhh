import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reuniones } from "@/db/schema";
import { eq } from "drizzle-orm";
import { obtenerSesion } from "@/lib/auth";
import { puedeEditar } from "@/lib/permisos";

function txt(v: unknown): string {
  return String(v ?? "").trim();
}

// Crear reunión
export async function POST(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeEditar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const body = await req.json();
  const titulo = txt(body.titulo) || "Reunión semanal";
  const fecha = txt(body.fecha);
  if (!fecha) {
    return NextResponse.json({ error: "La fecha es obligatoria." }, { status: 400 });
  }
  const [creada] = await db
    .insert(reuniones)
    .values({
      titulo,
      fecha,
      avances: txt(body.avances),
      bloqueos: txt(body.bloqueos),
      focoSemana: txt(body.focoSemana),
      acuerdos: txt(body.acuerdos),
      participantes: txt(body.participantes),
      creadoPorId: sesion.id,
    })
    .returning({ id: reuniones.id });
  return NextResponse.json({ ok: true, id: creada.id });
}

// Actualizar reunión
export async function PATCH(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeEditar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const body = await req.json();
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });

  const cambios: Record<string, unknown> = { actualizadoEn: new Date() };
  if (body.titulo !== undefined) cambios.titulo = txt(body.titulo) || "Reunión semanal";
  if (body.fecha !== undefined) {
    const f = txt(body.fecha);
    if (!f)
      return NextResponse.json(
        { error: "La fecha no puede quedar vacía." },
        { status: 400 }
      );
    cambios.fecha = f;
  }
  if (body.avances !== undefined) cambios.avances = txt(body.avances);
  if (body.bloqueos !== undefined) cambios.bloqueos = txt(body.bloqueos);
  if (body.focoSemana !== undefined) cambios.focoSemana = txt(body.focoSemana);
  if (body.acuerdos !== undefined) cambios.acuerdos = txt(body.acuerdos);
  if (body.participantes !== undefined)
    cambios.participantes = txt(body.participantes);

  await db.update(reuniones).set(cambios).where(eq(reuniones.id, id));
  return NextResponse.json({ ok: true });
}

// Eliminar reunión
export async function DELETE(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeEditar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });
  await db.delete(reuniones).where(eq(reuniones.id, id));
  return NextResponse.json({ ok: true });
}
