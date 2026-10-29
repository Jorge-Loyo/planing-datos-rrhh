import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth";
import { puedeCoordinar } from "@/lib/permisos";
import { PageHeader, EmptyState } from "@/components/ui";

export default async function CargaEquipoPage() {
  const sesion = await obtenerSesion();
  if (!sesion || !puedeCoordinar(sesion.rol)) {
    redirect("/");
  }

  return (
    <div>
      <PageHeader
        titulo="Carga del equipo"
        descripcion="Vista de coordinación: qué hace cada persona, para coordinar y no duplicar esfuerzo. Objetivo: coordinar, no controlar."
      />
      <EmptyState
        titulo="La vista de carga se habilita en la Etapa 2"
        descripcion="Verás las tareas activas por persona, su estado y bloqueos. Disponible para líderes y administradores."
      />
    </div>
  );
}
