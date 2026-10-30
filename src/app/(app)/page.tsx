import { obtenerSesion } from "@/lib/auth";
import { db } from "@/db";
import { tareas, prioridades, pedidos } from "@/db/schema";
import { eq, ne } from "drizzle-orm";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { formatearFecha, diasRestantes } from "@/lib/utils";
import {
  ETIQUETA_ESTADO,
  COLOR_ESTADO,
  ETIQUETA_PRIORIDAD,
} from "@/lib/dominio";
import Link from "next/link";
import {
  KanbanSquare,
  Inbox,
  Flag,
  CalendarDays,
  BookOpen,
  FolderOpen,
  AlertTriangle,
  Send,
} from "lucide-react";

export const dynamic = "force-dynamic";

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

  // Contadores y listas reales
  const [todasTareas, prioridadesActivas, pedidosAbiertos] = await Promise.all([
    db.select().from(tareas),
    db.select().from(prioridades).where(eq(prioridades.activa, true)),
    db.select().from(pedidos).where(ne(pedidos.estado, "resuelto")),
  ]);

  const enCurso = todasTareas.filter((t) => t.estado === "en_curso").length;
  const bloqueadas = todasTareas.filter((t) => t.estado === "bloqueada");

  // Próximas fechas límite (tareas no cerradas con fecha), ordenadas
  const proximas = todasTareas
    .filter((t) => t.estado !== "lista" && t.fechaLimite)
    .sort((a, b) => (a.fechaLimite! < b.fechaLimite! ? -1 : 1))
    .slice(0, 6);

  const metricas = [
    { label: "Tareas en curso", valor: enCurso, color: "text-brand-600" },
    { label: "Tareas bloqueadas", valor: bloqueadas.length, color: "text-red-600" },
    { label: "Prioridades activas", valor: prioridadesActivas.length, color: "text-slate-900" },
    { label: "Pedidos pendientes", valor: pedidosAbiertos.length, color: "text-yellow-700" },
  ];

  return (
    <div>
      <PageHeader
        titulo={`Hola${nombre ? ", " + nombre : ""}`}
        descripcion="Resumen del tablero del equipo de Datos RRHH."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricas.map((m) => (
          <Card key={m.label}>
            <div className="text-sm text-slate-500">{m.label}</div>
            <div className={`mt-1 text-3xl font-semibold ${m.color}`}>{m.valor}</div>
          </Card>
        ))}
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* Próximas fechas límite */}
        <div>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Próximas fechas límite
          </h2>
          {proximas.length === 0 ? (
            <EmptyState titulo="Sin fechas límite próximas" />
          ) : (
            <Card className="p-0">
              <ul className="divide-y divide-slate-100">
                {proximas.map((t) => {
                  const dias = diasRestantes(t.fechaLimite);
                  return (
                    <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                      <Badge color={COLOR_ESTADO[t.estado]}>
                        {ETIQUETA_ESTADO[t.estado]}
                      </Badge>
                      <span className="flex-1 truncate text-sm text-slate-800">
                        {t.titulo}
                      </span>
                      <span
                        className={
                          "text-xs " +
                          (dias !== null && dias < 0
                            ? "text-red-600"
                            : dias !== null && dias <= 3
                            ? "text-yellow-700"
                            : "text-slate-500")
                        }
                      >
                        {formatearFecha(t.fechaLimite)}
                        {dias !== null &&
                          (dias < 0 ? ` (${Math.abs(dias)}d venc.)` : ` (${dias}d)`)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>

        {/* Bloqueos */}
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <AlertTriangle size={18} className="text-red-500" /> Tareas bloqueadas
          </h2>
          {bloqueadas.length === 0 ? (
            <EmptyState titulo="No hay tareas bloqueadas" />
          ) : (
            <Card className="p-0">
              <ul className="divide-y divide-slate-100">
                {bloqueadas.slice(0, 6).map((t) => (
                  <li key={t.id} className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-800">{t.titulo}</div>
                    {t.observaciones && (
                      <div className="text-xs text-slate-500">{t.observaciones}</div>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      {/* Pedidos pendientes */}
      {pedidosAbiertos.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Send size={18} className="text-yellow-600" /> Pedidos pendientes
          </h2>
          <Card className="p-0">
            <ul className="divide-y divide-slate-100">
              {pedidosAbiertos.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex-1 truncate text-sm text-slate-800">
                    {p.descripcion}
                  </span>
                  {p.fechaNecesaria && (
                    <span className="text-xs text-slate-500">
                      Necesario: {formatearFecha(p.fechaNecesaria)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* Prioridades activas resumidas */}
      {prioridadesActivas.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Prioridades del período
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {prioridadesActivas
              .sort((a, b) => a.nivel.localeCompare(b.nivel))
              .map((p) => (
                <Card key={p.id} className="border-l-4 border-l-brand-500">
                  <div className="text-xs font-semibold text-brand-600">
                    {ETIQUETA_PRIORIDAD[p.nivel]}
                  </div>
                  <div className="mt-0.5 text-sm font-medium text-slate-900">
                    {p.queEs}
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

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
