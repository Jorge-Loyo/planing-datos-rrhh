import { PageHeader, EmptyState } from "@/components/ui";

const COLUMNAS = [
  { estado: "pendiente", titulo: "Pendiente" },
  { estado: "en_curso", titulo: "En curso" },
  { estado: "bloqueada", titulo: "Bloqueada" },
  { estado: "lista", titulo: "Lista" },
];

export default function KanbanPage() {
  return (
    <div>
      <PageHeader
        titulo="Kanban / Planner"
        descripcion="Tablero único donde vive todo lo que el equipo tiene en marcha."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNAS.map((c) => (
          <div key={c.estado} className="rounded-xl bg-slate-100 p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-slate-700">{c.titulo}</h3>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">
                0
              </span>
            </div>
            <div className="space-y-2">
              <div className="rounded-lg border border-dashed border-slate-300 bg-white/60 p-4 text-center text-xs text-slate-400">
                Sin tareas
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <EmptyState
          titulo="El Kanban se habilita en la Etapa 2"
          descripcion="Acá vas a poder crear tareas, asignar responsables y arrastrarlas entre columnas."
        />
      </div>
    </div>
  );
}
