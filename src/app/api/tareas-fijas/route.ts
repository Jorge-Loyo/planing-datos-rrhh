import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tareasFijas, tareas } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { obtenerSesion } from "@/lib/auth";
import { puedeEditar } from "@/lib/permisos";
import { crearBacklogParaTarea } from "@/lib/sync-backlog";

const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes"] as const;
type Dia = (typeof DIAS)[number];

function txt(v: unknown): string {
  return String(v ?? "").trim();
}
function idOnull(v: unknown): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Crear plantilla de tarea fija
export async function POST(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeEditar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const body = await req.json();
  const titulo = txt(body.titulo);
  if (!titulo) {
    return NextResponse.json({ error: "El título es obligatorio." }, { status: 400 });
  }
  const diaSemana = DIAS.includes(body.diaSemana) ? (body.diaSemana as Dia) : null;
  const [creada] = await db
    .insert(tareasFijas)
    .values({
      titulo,
      descripcion: txt(body.descripcion),
      responsableId: idOnull(body.responsableId),
      diaSemana,
      criterioTerminado: txt(body.criterioTerminado),
      activa: true,
      creadoPorId: sesion.id,
    })
    .returning({ id: tareasFijas.id });
  return NextResponse.json({ ok: true, id: creada.id });
}

// Actualizar plantilla
export async function PATCH(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeEditar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const body = await req.json();
  const id = idOnull(body.id);
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });

  const cambios: Record<string, unknown> = {};
  if (body.titulo !== undefined) {
    const t = txt(body.titulo);
    if (!t)
      return NextResponse.json(
        { error: "El título no puede quedar vacío." },
        { status: 400 }
      );
    cambios.titulo = t;
  }
  if (body.descripcion !== undefined) cambios.descripcion = txt(body.descripcion);
  if (body.responsableId !== undefined)
    cambios.responsableId = idOnull(body.responsableId);
  if (body.diaSemana !== undefined)
    cambios.diaSemana = DIAS.includes(body.diaSemana) ? body.diaSemana : null;
  if (body.criterioTerminado !== undefined)
    cambios.criterioTerminado = txt(body.criterioTerminado);
  if (body.activa !== undefined) cambios.activa = Boolean(body.activa);

  await db.update(tareasFijas).set(cambios).where(eq(tareasFijas.id, id));
  return NextResponse.json({ ok: true });
}

// Eliminar plantilla
export async function DELETE(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeEditar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = idOnull(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });
  await db.delete(tareasFijas).where(eq(tareasFijas.id, id));
  return NextResponse.json({ ok: true });
}

// Devuelve el lunes de la semana actual (o de la siguiente si offset=1)
function lunesDeLaSemana(offsetSemanas = 0): Date {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dow = hoy.getDay(); // 0=domingo, 1=lunes...
  const diffALunes = dow === 0 ? -6 : 1 - dow;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diffALunes + offsetSemanas * 7);
  return lunes;
}

function fechaISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const OFFSET_DIA: Record<Dia, number> = {
  lunes: 0,
  martes: 1,
  miercoles: 2,
  jueves: 3,
  viernes: 4,
};

// Generar las tareas de la semana a partir de las plantillas activas.
// body: { semana: "actual" | "siguiente" }
export async function PUT(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeEditar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const body = await req.json();
  const offset = body.semana === "siguiente" ? 1 : 0;
  const lunes = lunesDeLaSemana(offset);

  const plantillas = await db
    .select()
    .from(tareasFijas)
    .where(eq(tareasFijas.activa, true));

  if (plantillas.length === 0) {
    return NextResponse.json(
      { error: "No hay tareas fijas activas para generar." },
      { status: 400 }
    );
  }

  const maxOrden = await db
    .select({ max: sql<number>`coalesce(max(${tareas.orden}), 0)` })
    .from(tareas)
    .where(eq(tareas.estado, "pendiente"));
  let orden = (maxOrden[0]?.max ?? 0) + 1;

  // Traer las tareas ya existentes de esa semana generadas desde fijas, para no duplicar.
  const todasTareas = await db
    .select({
      titulo: tareas.titulo,
      fechaLimite: tareas.fechaLimite,
      observaciones: tareas.observaciones,
    })
    .from(tareas);
  const yaGeneradas = new Set(
    todasTareas
      .filter((t) => (t.observaciones ?? "").includes("tarea fija semanal"))
      .map((t) => `${t.titulo}__${t.fechaLimite}`)
  );

  let creadas = 0;
  let salteadas = 0;
  for (const p of plantillas) {
    const dia = (p.diaSemana ?? "lunes") as Dia;
    const fecha = new Date(lunes);
    fecha.setDate(lunes.getDate() + (OFFSET_DIA[dia] ?? 0));
    const fechaLimite = fechaISO(fecha);

    // Si ya existe la misma tarea fija para esa fecha, saltear
    if (yaGeneradas.has(`${p.titulo}__${fechaLimite}`)) {
      salteadas++;
      continue;
    }

    const [tarea] = await db
      .insert(tareas)
      .values({
        titulo: p.titulo,
        descripcion: p.descripcion ?? "",
        estado: "pendiente",
        responsableId: p.responsableId,
        fechaLimite,
        criterioTerminado: p.criterioTerminado ?? "",
        observaciones: "Generada desde tarea fija semanal",
        orden: orden++,
        creadoPorId: sesion.id,
      })
      .returning({ id: tareas.id });

    // Reflejo en el Backlog (opción B)
    await crearBacklogParaTarea({
      tareaId: tarea.id,
      titulo: p.titulo,
      descripcion: p.descripcion ?? "",
      estado: "pendiente",
      creadoPorId: sesion.id,
    });
    creadas++;
  }

  return NextResponse.json({
    ok: true,
    creadas,
    salteadas,
    lunes: fechaISO(lunes),
  });
}
