import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pedidos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { obtenerSesion } from "@/lib/auth";
import { puedeEditar } from "@/lib/permisos";
import { ESTADOS_PEDIDO, type EstadoPedido } from "@/lib/dominio";

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

// Crear pedido
export async function POST(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeEditar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const body = await req.json();
  const descripcion = txt(body.descripcion);
  if (!descripcion) {
    return NextResponse.json(
      { error: "La descripción del pedido es obligatoria." },
      { status: 400 }
    );
  }
  const [creado] = await db
    .insert(pedidos)
    .values({
      descripcion,
      // Por defecto, el solicitante es quien lo registra (se puede cambiar)
      solicitanteId: idOnull(body.solicitanteId) ?? sesion.id,
      asignadoId: idOnull(body.asignadoId),
      estado: "pendiente",
      fechaNecesaria: fechaOnull(body.fechaNecesaria),
      nota: txt(body.nota),
      creadoPorId: sesion.id,
    })
    .returning({ id: pedidos.id });
  return NextResponse.json({ ok: true, id: creado.id });
}

// Actualizar pedido
export async function PATCH(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeEditar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const body = await req.json();
  const id = idOnull(body.id);
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });

  const cambios: Record<string, unknown> = { actualizadoEn: new Date() };
  if (body.descripcion !== undefined) {
    const d = txt(body.descripcion);
    if (!d)
      return NextResponse.json(
        { error: "La descripción no puede quedar vacía." },
        { status: 400 }
      );
    cambios.descripcion = d;
  }
  if (body.solicitanteId !== undefined)
    cambios.solicitanteId = idOnull(body.solicitanteId);
  if (body.asignadoId !== undefined) cambios.asignadoId = idOnull(body.asignadoId);
  if (body.estado !== undefined && ESTADOS_PEDIDO.includes(body.estado as EstadoPedido))
    cambios.estado = body.estado;
  if (body.fechaNecesaria !== undefined)
    cambios.fechaNecesaria = fechaOnull(body.fechaNecesaria);
  if (body.nota !== undefined) cambios.nota = txt(body.nota);

  await db.update(pedidos).set(cambios).where(eq(pedidos.id, id));
  return NextResponse.json({ ok: true });
}

// Eliminar pedido
export async function DELETE(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeEditar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = idOnull(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });
  await db.delete(pedidos).where(eq(pedidos.id, id));
  return NextResponse.json({ ok: true });
}
