import { obtenerSesion } from "@/lib/auth";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/ui";
import { PerfilForm } from "./PerfilForm";

export default async function PerfilPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;

  const filas = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.id, sesion.id));
  const usuario = filas[0];

  return (
    <div>
      <PageHeader
        titulo="Mi perfil"
        descripcion="Editá tus datos personales y tu contraseña."
      />
      <PerfilForm
        inicial={{
          cuil: usuario.cuil,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          rol: usuario.rol,
        }}
      />
    </div>
  );
}
