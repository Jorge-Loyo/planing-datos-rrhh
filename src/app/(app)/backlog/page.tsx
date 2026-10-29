import { PageHeader, EmptyState } from "@/components/ui";

export default function BacklogPage() {
  return (
    <div>
      <PageHeader
        titulo="Backlog"
        descripcion="Lista ordenada de todo lo pendiente. Todo pedido entra acá; de acá se eligen las prioridades."
      />
      <EmptyState
        titulo="El Backlog se habilita en la Etapa 2"
        descripcion="Cada ítem con solicitante, decisión que apoya, impacto y esfuerzo. Se revisa y reordena periódicamente."
      />
    </div>
  );
}
