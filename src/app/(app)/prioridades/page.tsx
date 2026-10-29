import { PageHeader, EmptyState } from "@/components/ui";

export default function PrioridadesPage() {
  return (
    <div>
      <PageHeader
        titulo="Prioridades"
        descripcion="Afiche con lo más importante del período. Máximo 5: si entra algo urgente, se saca otra cosa."
      />
      <EmptyState
        titulo="El Afiche de prioridades se habilita en la Etapa 2"
        descripcion="Cada prioridad con qué es, por qué importa, responsable y fecha estimada."
      />
    </div>
  );
}
