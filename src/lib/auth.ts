import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "planing_session";
const DURACION_SEG = 60 * 60 * 8; // 8 horas

export type Rol = "admin" | "lider" | "miembro" | "consulta";

export interface SesionPayload {
  id: number;
  cuil: string;
  nombre: string;
  apellido: string;
  rol: Rol;
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Falta AUTH_SECRET en las variables de entorno.");
  }
  return new TextEncoder().encode(secret);
}

export async function crearToken(payload: SesionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURACION_SEG}s`)
    .sign(getSecret());
}

export async function verificarToken(
  token: string
): Promise<SesionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      id: payload.id as number,
      cuil: payload.cuil as string,
      nombre: payload.nombre as string,
      apellido: payload.apellido as string,
      rol: payload.rol as Rol,
    };
  } catch {
    return null;
  }
}

export async function crearSesion(payload: SesionPayload): Promise<void> {
  const token = await crearToken(payload);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: DURACION_SEG,
    path: "/",
  });
}

export async function cerrarSesion(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function obtenerSesion(): Promise<SesionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verificarToken(token);
}

export const COOKIE_SESION = COOKIE_NAME;
