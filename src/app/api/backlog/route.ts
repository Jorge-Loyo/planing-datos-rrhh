import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { backlog, tareas } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { obtenerSesion } from "@/lib/auth";
import { puedeEditar, puedeCoordinar } from "@/lib/permisos";
import {
  ESCALAS,
  ESTADOS_BACKLOG,
  type Escala,
  type EstadoBacklog,
} from "@/lib/dominio";

function txt(v: unknown): string {
  return String(v ?? "").trim();
}
function escalaOnull(v: unknown): Escala | null {
  return ESCALAS.includes(v as Escala) ? (v as Escala) : null;
}

// Genera el próximo código B-00X
async function proximoCodigo(): Promise<string> {
  const r = await db
    .select({ max: sql<number>`coalesce(max(${backlog.id}), 0)` })
    .from(backlog);
  const n = (r[0]?.max ?? 0) + 1;
  return `B-${String(n).padStart(3, "0")}`;
}

// Crear item de backlog
export async function POST(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeEditar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const body = await req.json();
  const pedido = txt(body.pedido);
  if (!pedido) {
    return NextResponse.json(
      { error: "El pedido / idea es obligatorio." },
      { status: 400 },
    );
  }
  const codigo = await proximoCodigo();
  const [creado] = await db
    .insert(backlog)
    .values({
      codigo,
      pedido,
      areaSolicitante: txt(body.areaSolicitante),
      decisionQueApoya: txt(body.decisionQueApoya),
      impacto: escalaOnull(body.impacto),
      esfuerzo: escalaOnull(body.esfuerzo),
      estado: "nuevo",
      creadoPorId: sesion.id,
    })
    .returning({ id: backlog.id });
  return NextResponse.json({ ok: true, id: creado.id, codigo });
}

// Actualizar item
export async function PATCH(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeEditar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const body = await req.json();
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });

  const cambios: Record<string, unknown> = { actualizadoEn: new Date() };
  if (body.pedido !== undefined) {
    const p = txt(body.pedido);
    if (!p)
      return NextResponse.json(
        { error: "El pedido no puede quedar vacío." },
        { status: 400 },
      );
    cambios.pedido = p;
  }
  if (body.areaSolicitante !== undefined)
    cambios.areaSolicitante = txt(body.areaSolicitante);
  if (body.decisionQueApoya !== undefined)
    cambios.decisionQueApoya = txt(body.decisionQueApoya);
  if (body.impacto !== undefined) cambios.impacto = escalaOnull(body.impacto);
  if (body.esfuerzo !== undefined)
    cambios.esfuerzo = escalaOnull(body.esfuerzo);
  if (body.estado !== undefined && ESTADOS_BACKLOG.includes(body.estado)) {
    // Promover a prioridad/aprobar es potestad de coordinación
    if (
      (body.estado === "aprobado" || body.estado === "promovido") &&
      !puedeCoordinar(sesion.rol)
    ) {
      return NextResponse.json(
        {
          error:
            "Solo un líder o administrador puede aprobar o promover un pedido.",
        },
        { status: 403 },
      );
    }
    cambios.estado = body.estado;
  }

  await db.update(backlog).set(cambios).where(eq(backlog.id, id));
  return NextResponse.json({ ok: true });
}

// Eliminar item
export async function DELETE(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeEditar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });
  await db.delete(backlog).where(eq(backlog.id, id));
  return NextResponse.json({ ok: true });
}

// Promover un item de backlog a una tarea del Kanban
export async function PUT(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeCoordinar(sesion.rol)) {
    return NextResponse.json(
      { error: "Solo un líder o administrador puede promover a tarea." },
      { status: 403 },
    );
  }
  const body = await req.json();
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });

  const filas = await db.select().from(backlog).where(eq(backlog.id, id));
  const item = filas[0];
  if (!item) {
    return NextResponse.json({ error: "Item no encontrado." }, { status: 404 });
  }

  // Crear la tarea al final de la columna Pendiente
  const maxOrden = await db
    .select({ max: sql<number>`coalesce(max(${tareas.orden}), 0)` })
    .from(tareas)
    .where(eq(tareas.estado, "pendiente"));
  const orden = (maxOrden[0]?.max ?? 0) + 1;

  // Datos opcionales que el líder puede definir al promover
  const responsableId =
    Number.isInteger(Number(body.responsableId)) &&
    Number(body.responsableId) > 0
      ? Number(body.responsableId)
      : null;
  const fechaLimite = txt(body.fechaLimite) || null;
  const prioridadValida = ["sin_prioridad", "p1", "p2", "p3", "p4", "p5"];
  const prioridad = prioridadValida.includes(body.prioridad)
    ? body.prioridad
    : "sin_prioridad";

  const [tarea] = await db
    .insert(tareas)
    .values({
      titulo: item.pedido,
      descripcion: item.decisionQueApoya ?? "",
      estado: "pendiente",
      prioridad,
      responsableId,
      fechaLimite,
      backlogId: item.id,
      orden,
      creadoPorId: sesion.id,
    })
    .returning({ id: tareas.id });

  // Marcar el item como promovido
  await db
    .update(backlog)
    .set({ estado: "promovido", actualizadoEn: new Date() })
    .where(eq(backlog.id, id));

  return NextResponse.json({ ok: true, tareaId: tarea.id });
}

// Listado (por si se requiere vía fetch)
export async function GET() {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  const filas = await db.select().from(backlog).orderBy(desc(backlog.id));
  return NextResponse.json(filas);
}
