import { PageHeader, EmptyState } from "@/components/ui";

export default function ReunionesPage() {
  return (
    <div>
      <PageHeader
        titulo="Reuniones"
        descripcion="Registro de la reunión semanal: qué se avanzó, qué está trabado, qué se hace esta semana."
      />
      <EmptyState
        titulo="El registro de reuniones se habilita en la Etapa 3"
        descripcion="Vas a poder documentar avances, bloqueos, foco de la semana y acuerdos."
      />
    </div>
  );
}
