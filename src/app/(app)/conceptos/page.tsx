import { PageHeader, EmptyState } from "@/components/ui";

export default function ConceptosPage() {
  return (
    <div>
      <PageHeader
        titulo="Tabla de conceptos"
        descripcion="Glosario compartido de términos y de cómo se calculan los indicadores."
      />
      <EmptyState
        titulo="La Tabla de conceptos se habilita en la Etapa 3"
        descripcion="Término, definición, fuente del dato, fórmula de cálculo y responsable de mantenerlo."
      />
    </div>
  );
}
