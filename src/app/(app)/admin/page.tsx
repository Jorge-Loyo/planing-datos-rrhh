import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth";
import { puedeAdministrar } from "@/lib/permisos";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { PageHeader } from "@/components/ui";
import { AdminUsuarios } from "./AdminUsuarios";

export default async function AdminPage() {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeAdministrar(sesion.rol)) {
    redirect("/");
  }

  const lista = await db
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

  return (
    <div>
      <PageHeader
        titulo="Administración"
        descripcion="Gestión de usuarios del equipo: altas, roles y estado."
      />
      <AdminUsuarios inicial={lista} />
    </div>
  );
}
