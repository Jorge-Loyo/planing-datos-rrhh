import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { crearSesion } from "@/lib/auth";
import { normalizarCuil } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { cuil, password } = await req.json();

    if (!cuil || !password) {
      return NextResponse.json(
        { error: "CUIL y contraseña son obligatorios." },
        { status: 400 }
      );
    }

    const cuilNorm = normalizarCuil(String(cuil));
    const filas = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.cuil, cuilNorm));

    const usuario = filas[0];
    if (!usuario || !usuario.activo) {
      return NextResponse.json(
        { error: "CUIL o contraseña incorrectos." },
        { status: 401 }
      );
    }

    const ok = await bcrypt.compare(String(password), usuario.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "CUIL o contraseña incorrectos." },
        { status: 401 }
      );
    }

    await crearSesion({
      id: usuario.id,
      cuil: usuario.cuil,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error en login:", err);
    return NextResponse.json(
      { error: "Error del servidor. Revisá la conexión a la base de datos." },
      { status: 500 }
    );
  }
}
