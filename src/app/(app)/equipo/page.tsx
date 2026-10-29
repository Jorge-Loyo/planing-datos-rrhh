import { PageHeader, EmptyState } from "@/components/ui";

export default function EquipoPage() {
  return (
    <div>
      <PageHeader
        titulo="Equipo"
        descripcion="Integrantes del equipo. Sirve para asignar responsables de tareas y recursos."
      />
      <EmptyState
        titulo="La vista de Equipo se habilita en la Etapa 4"
        descripcion="Listado de integrantes con su rol. La gestión de altas se hace desde Administración."
      />
    </div>
  );
}
