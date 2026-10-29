import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { obtenerSesion, crearSesion } from "@/lib/auth";

// Actualizar datos de perfil (nombre, apellido, email)
export async function PATCH(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { nombre, apellido, email } = await req.json();

  await db
    .update(usuarios)
    .set({
      nombre: String(nombre ?? "").trim(),
      apellido: String(apellido ?? "").trim(),
      email: String(email ?? "").trim(),
      actualizadoEn: new Date(),
    })
    .where(eq(usuarios.id, sesion.id));

  // Refrescar la sesion con el nombre nuevo
  await crearSesion({
    ...sesion,
    nombre: String(nombre ?? "").trim(),
    apellido: String(apellido ?? "").trim(),
  });

  return NextResponse.json({ ok: true });
}

// Cambiar contrasena
export async function PUT(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { actual, nueva } = await req.json();

  if (!actual || !nueva) {
    return NextResponse.json(
      { error: "Completá la contraseña actual y la nueva." },
      { status: 400 }
    );
  }
  if (String(nueva).length < 8) {
    return NextResponse.json(
      { error: "La nueva contraseña debe tener al menos 8 caracteres." },
      { status: 400 }
    );
  }

  const filas = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.id, sesion.id));
  const usuario = filas[0];
  if (!usuario) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }

  const ok = await bcrypt.compare(String(actual), usuario.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "La contraseña actual es incorrecta." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(String(nueva), 10);
  await db
    .update(usuarios)
    .set({ passwordHash, actualizadoEn: new Date() })
    .where(eq(usuarios.id, sesion.id));

  return NextResponse.json({ ok: true });
}
