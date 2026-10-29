import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { obtenerSesion, type Rol } from "@/lib/auth";
import { puedeAdministrar } from "@/lib/permisos";
import { normalizarCuil, cuilValido } from "@/lib/utils";

const ROLES_VALIDOS: Rol[] = ["admin", "lider", "miembro", "consulta"];

// Listar usuarios (solo admin)
export async function GET() {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeAdministrar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const filas = await db
    .select({
      id: usuarios.id,
      cuil: usuarios.cuil,
      nombre: usuarios.nombre,
      apellido: usuarios.apellido,
      email: usuarios.email,
      rol: usuarios.rol,
      activo: usuarios.activo,
    })
    .from(usuarios)
    .orderBy(usuarios.apellido);
  return NextResponse.json(filas);
}

// Crear usuario (solo admin)
export async function POST(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeAdministrar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await req.json();
  const cuil = normalizarCuil(String(body.cuil ?? ""));
  const rol = body.rol as Rol;
  const password = String(body.password ?? "");

  if (!cuilValido(cuil)) {
    return NextResponse.json(
      { error: "El CUIL no es válido (deben ser 11 dígitos con verificador correcto)." },
      { status: 400 }
    );
  }
  if (!ROLES_VALIDOS.includes(rol)) {
    return NextResponse.json({ error: "Rol inválido." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "La contraseña inicial debe tener al menos 8 caracteres." },
      { status: 400 }
    );
  }

  const existe = await db.select().from(usuarios).where(eq(usuarios.cuil, cuil));
  if (existe.length > 0) {
    return NextResponse.json(
      { error: "Ya existe un usuario con ese CUIL." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [creado] = await db
    .insert(usuarios)
    .values({
      cuil,
      passwordHash,
      nombre: String(body.nombre ?? "").trim(),
      apellido: String(body.apellido ?? "").trim(),
      email: String(body.email ?? "").trim(),
      rol,
      activo: true,
    })
    .returning({ id: usuarios.id });

  return NextResponse.json({ ok: true, id: creado.id });
}

// Actualizar usuario: rol, activo, o resetear contrasena (solo admin)
export async function PATCH(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeAdministrar(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await req.json();
  const id = Number(body.id);
  if (!id) {
    return NextResponse.json({ error: "Falta el id." }, { status: 400 });
  }

  const cambios: Record<string, unknown> = { actualizadoEn: new Date() };

  if (body.rol !== undefined) {
    if (!ROLES_VALIDOS.includes(body.rol)) {
      return NextResponse.json({ error: "Rol inválido." }, { status: 400 });
    }
    cambios.rol = body.rol;
  }
  if (body.activo !== undefined) {
    cambios.activo = Boolean(body.activo);
  }
  if (body.nuevaPassword !== undefined) {
    if (String(body.nuevaPassword).length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres." },
        { status: 400 }
      );
    }
    cambios.passwordHash = await bcrypt.hash(String(body.nuevaPassword), 10);
  }

  await db.update(usuarios).set(cambios).where(eq(usuarios.id, id));
  return NextResponse.json({ ok: true });
}
