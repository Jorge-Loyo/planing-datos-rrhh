import { PageHeader, EmptyState } from "@/components/ui";

export default function DefinicionTerminadoPage() {
  return (
    <div>
      <PageHeader
        titulo="Definición de terminado"
        descripcion="Criterios claros para dar una tarea por cerrada, con checklist por tipo de entregable."
      />
      <EmptyState
        titulo="La Definición de terminado se habilita en la Etapa 3"
        descripcion="Checklists configurables por tipo: dashboard, automatización, reporte, etc."
      />
    </div>
  );
}
