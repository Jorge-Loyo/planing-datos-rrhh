import { PageHeader, EmptyState } from "@/components/ui";

export default function ArchivosPage() {
  return (
    <div>
      <PageHeader
        titulo="Archivos / Conocimiento compartido"
        descripcion="Índice de recursos con su enlace de Google Drive y control de versiones (vigente / histórico)."
      />
      <EmptyState
        titulo="El repositorio de archivos se habilita en la Etapa 4"
        descripcion="Cada recurso con su tipo, qué contiene, enlace a Drive y versiones vigentes e históricas."
      />
    </div>
  );
}
