import { NextRequest, NextResponse } from "next/server";
import { verificarToken, COOKIE_SESION } from "@/lib/auth";

// Rutas publicas (no requieren sesion)
const RUTAS_PUBLICAS = ["/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Dejar pasar assets y API de auth
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_SESION)?.value;
  const sesion = token ? await verificarToken(token) : null;

  const esPublica = RUTAS_PUBLICAS.some((r) => pathname.startsWith(r));

  // Si no hay sesion y la ruta no es publica -> al login
  if (!sesion && !esPublica) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Si hay sesion y va al login -> al dashboard
  if (sesion && esPublica) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
