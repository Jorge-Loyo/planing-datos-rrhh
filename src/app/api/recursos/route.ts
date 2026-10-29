import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { recursos, versionesRecurso } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { obtenerSesion } from "@/lib/auth";
import { puedeEditar } from "@/lib/permisos";

const TIPOS = ["fuente", "script", "documento", "manual", "otro"] as const;
type TipoRecurso = (typeof TIPOS)[number];

function txt(v: unknown): string {
  return String(v ?? "").trim();
}
function idOnull(v: unknown): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Crear recurso (opcionalmente con su primera versión/URL de Drive)
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
  const tipo: TipoRecurso = TIPOS.includes(body.tipo) ? body.tipo : "documento";

  const [creado] = await db
    .insert(recursos)
    .values({
      nombre,
      tipo,
      queContiene: txt(body.queContiene),
      responsableId: idOnull(body.responsableId),
      creadoPorId: sesion.id,
    })
    .returning({ id: recursos.id });

  // Si vino una URL, crear la primera versión (vigente)
  const urlDrive = txt(body.urlDrive);
  if (urlDrive) {
    await db.insert(versionesRecurso).values({
      recursoId: creado.id,
      version: txt(body.version) || "v1",
      urlDrive,
      nota: txt(body.nota),
      vigente: true,
      subidoPorId: sesion.id,
    });
  }

  return NextResponse.json({ ok: true, id: creado.id });
}

// Actualizar datos del recurso
export async function PATCH(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeEditar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const body = await req.json();
  const id = idOnull(body.id);
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });

  const cambios: Record<string, unknown> = { actualizadoEn: new Date() };
  if (body.nombre !== undefined) {
    const n = txt(body.nombre);
    if (!n)
      return NextResponse.json(
        { error: "El nombre no puede quedar vacío." },
        { status: 400 }
      );
    cambios.nombre = n;
  }
  if (body.tipo !== undefined && TIPOS.includes(body.tipo)) cambios.tipo = body.tipo;
  if (body.queContiene !== undefined) cambios.queContiene = txt(body.queContiene);
  if (body.responsableId !== undefined)
    cambios.responsableId = idOnull(body.responsableId);

  await db.update(recursos).set(cambios).where(eq(recursos.id, id));
  return NextResponse.json({ ok: true });
}

// Eliminar recurso (y sus versiones en cascada)
export async function DELETE(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeEditar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = idOnull(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });
  await db.delete(recursos).where(eq(recursos.id, id));
  return NextResponse.json({ ok: true });
}

// Gestión de versiones (agregar nueva versión, marcar vigente, eliminar)
export async function PUT(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeEditar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const body = await req.json();
  const accion = body.accion;

  if (accion === "agregar_version") {
    const recursoId = idOnull(body.recursoId);
    const urlDrive = txt(body.urlDrive);
    if (!recursoId || !urlDrive) {
      return NextResponse.json(
        { error: "Falta el recurso o la URL de Drive." },
        { status: 400 }
      );
    }
    const hacerVigente = body.vigente !== false; // por defecto, la nueva es vigente
    if (hacerVigente) {
      // quitar vigencia a las demás versiones del recurso
      await db
        .update(versionesRecurso)
        .set({ vigente: false })
        .where(eq(versionesRecurso.recursoId, recursoId));
    }
    const [v] = await db
      .insert(versionesRecurso)
      .values({
        recursoId,
        version: txt(body.version) || "v1",
        urlDrive,
        nota: txt(body.nota),
        vigente: hacerVigente,
        subidoPorId: sesion.id,
      })
      .returning({ id: versionesRecurso.id });
    return NextResponse.json({ ok: true, id: v.id });
  }

  if (accion === "marcar_vigente") {
    const versionId = idOnull(body.versionId);
    const recursoId = idOnull(body.recursoId);
    if (!versionId || !recursoId) {
      return NextResponse.json({ error: "Faltan datos." }, { status: 400 });
    }
    await db
      .update(versionesRecurso)
      .set({ vigente: false })
      .where(eq(versionesRecurso.recursoId, recursoId));
    await db
      .update(versionesRecurso)
      .set({ vigente: true })
      .where(
        and(
          eq(versionesRecurso.id, versionId),
          eq(versionesRecurso.recursoId, recursoId)
        )
      );
    return NextResponse.json({ ok: true });
  }

  if (accion === "eliminar_version") {
    const versionId = idOnull(body.versionId);
    if (!versionId)
      return NextResponse.json({ error: "Falta el id de la versión." }, { status: 400 });
    await db.delete(versionesRecurso).where(eq(versionesRecurso.id, versionId));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
}
