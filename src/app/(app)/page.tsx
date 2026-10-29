import { obtenerSesion } from "@/lib/auth";
import { PageHeader, Card } from "@/components/ui";
import Link from "next/link";
import {
  KanbanSquare,
  Inbox,
  Flag,
  CalendarDays,
  BookOpen,
  FolderOpen,
} from "lucide-react";

const ACCESOS = [
  { href: "/kanban", label: "Kanban / Planner", icon: KanbanSquare, desc: "Tareas en marcha" },
  { href: "/backlog", label: "Backlog", icon: Inbox, desc: "Pedidos pendientes" },
  { href: "/prioridades", label: "Prioridades", icon: Flag, desc: "El afiche del período" },
  { href: "/reuniones", label: "Reuniones", icon: CalendarDays, desc: "Coordinación semanal" },
  { href: "/conceptos", label: "Conceptos", icon: BookOpen, desc: "Glosario del equipo" },
  { href: "/archivos", label: "Archivos", icon: FolderOpen, desc: "Recursos en Drive" },
];

export default async function DashboardPage() {
  const sesion = await obtenerSesion();
  const nombre = sesion?.nombre || "";

  return (
    <div>
      <PageHeader
        titulo={`Hola${nombre ? ", " + nombre : ""}`}
        descripcion="Resumen del tablero. Los indicadores se completarán a medida que carguen datos."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Tareas en curso", valor: "—" },
          { label: "Tareas bloqueadas", valor: "—" },
          { label: "Prioridades activas", valor: "—" },
          { label: "Pedidos en backlog", valor: "—" },
        ].map((m) => (
          <Card key={m.label}>
            <div className="text-sm text-slate-500">{m.label}</div>
            <div className="mt-1 text-3xl font-semibold text-slate-900">{m.valor}</div>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-semibold text-slate-900">Accesos rápidos</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACCESOS.map((a) => {
          const Icon = a.icon;
          return (
            <Link key={a.href} href={a.href}>
              <Card className="transition hover:border-brand-300 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{a.label}</div>
                    <div className="text-sm text-slate-500">{a.desc}</div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
