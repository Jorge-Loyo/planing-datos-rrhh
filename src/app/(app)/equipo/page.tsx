import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { asc } from "drizzle-orm";
import { obtenerSesion } from "@/lib/auth";
import { puedeAdministrar } from "@/lib/permisos";
import { PageHeader, Card, Badge } from "@/components/ui";
import { ETIQUETA_ROL } from "@/lib/permisos";
import { nombreUsuario } from "@/lib/usuarios";
import Link from "next/link";
import type { Rol } from "@/lib/auth";

export const dynamic = "force-dynamic";

const COLOR_ROL: Record<Rol, "slate" | "blue" | "green" | "yellow" | "red"> = {
  admin: "red",
  lider: "blue",
  miembro: "green",
  consulta: "slate",
};

export default async function EquipoPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;

  const filas = await db
    .select()
    .from(usuarios)
    .orderBy(asc(usuarios.apellido), asc(usuarios.nombre));

  const activos = filas.filter((u) => u.activo);
  const inactivos = filas.filter((u) => !u.activo);
  const esAdmin = puedeAdministrar(sesion.rol);

  return (
    <div>
      <PageHeader
        titulo="Equipo"
        descripcion="Integrantes del equipo. Se usa para asignar responsables de tareas y recursos."
      >
        {esAdmin && (
          <Link
            href="/admin"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Gestionar usuarios
          </Link>
        )}
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activos.map((u) => (
          <Card key={u.id} className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
              {(u.nombre || u.apellido || u.cuil).slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate font-medium text-slate-900">
                {nombreUsuario(u)}
              </div>
              <div className="mt-0.5">
                <Badge color={COLOR_ROL[u.rol]}>{ETIQUETA_ROL[u.rol]}</Badge>
              </div>
              {u.email && (
                <div className="mt-1 truncate text-xs text-slate-500">{u.email}</div>
              )}
              <div className="mt-0.5 font-mono text-xs text-slate-400">{u.cuil}</div>
            </div>
          </Card>
        ))}
      </div>

      {activos.length === 0 && (
        <Card>
          <p className="text-center text-sm text-slate-500">
            No hay integrantes activos todavía.
          </p>
        </Card>
      )}

      {inactivos.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-slate-500">
            Inactivos ({inactivos.length})
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {inactivos.map((u) => (
              <Card key={u.id} className="flex items-center gap-2 py-3 opacity-60">
                <span className="text-sm text-slate-600">{nombreUsuario(u)}</span>
                <Badge color="slate">{ETIQUETA_ROL[u.rol]}</Badge>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
