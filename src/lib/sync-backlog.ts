// Sincronización Kanban -> Backlog (opción B).
// Cada tarea del Kanban tiene su reflejo en el Backlog. El estado del pedido
// en el Backlog sigue el estado de la tarea.
import { db } from "@/db";
import { backlog, tareas } from "@/db/schema";
import { eq, sql, inArray } from "drizzle-orm";
import type { EstadoTarea, EstadoBacklog } from "@/lib/dominio";

// Mapeo estado de tarea -> estado de backlog
export function estadoBacklogDesdeTarea(estado: EstadoTarea): EstadoBacklog {
  switch (estado) {
    case "lista":
      return "promovido"; // terminada: queda como promovida/cerrada
    case "pendiente":
      return "aprobado";
    case "en_curso":
    case "bloqueada":
    default:
      return "aprobado";
  }
}

async function proximoCodigo(): Promise<string> {
  const r = await db
    .select({ max: sql<number>`coalesce(max(${backlog.id}), 0)` })
    .from(backlog);
  const n = (r[0]?.max ?? 0) + 1;
  return `B-${String(n).padStart(3, "0")}`;
}

// Crea la entrada de backlog para una tarea recién creada en el Kanban,
// salvo que la tarea ya provenga de un item de backlog (backlogId presente).
export async function crearBacklogParaTarea(opts: {
  tareaId: number;
  titulo: string;
  descripcion?: string | null;
  estado: EstadoTarea;
  creadoPorId: number;
}): Promise<void> {
  const codigo = await proximoCodigo();
  const [item] = await db
    .insert(backlog)
    .values({
      codigo,
      pedido: opts.titulo,
      decisionQueApoya: opts.descripcion ?? "",
      estado: estadoBacklogDesdeTarea(opts.estado),
      creadoPorId: opts.creadoPorId,
    })
    .returning({ id: backlog.id });

  // Vincular la tarea con su item de backlog
  await db
    .update(tareas)
    .set({ backlogId: item.id })
    .where(eq(tareas.id, opts.tareaId));
}

// Mantiene sincronizado el backlog cuando cambia la tarea (estado/título).
export async function sincronizarBacklogDeTarea(tareaId: number): Promise<void> {
  const filas = await db.select().from(tareas).where(eq(tareas.id, tareaId));
  const tarea = filas[0];
  if (!tarea || !tarea.backlogId) return;
  await db
    .update(backlog)
    .set({
      pedido: tarea.titulo,
      estado: estadoBacklogDesdeTarea(tarea.estado),
      actualizadoEn: new Date(),
    })
    .where(eq(backlog.id, tarea.backlogId));
}

// Sincroniza el estado del backlog de varias tareas, a partir del estado destino
// conocido. Lee los backlogId en una sola consulta y actualiza solo los vinculados.
export async function sincronizarBacklogPorEstado(
  tareaIds: number[],
  estado: EstadoTarea
): Promise<void> {
  if (tareaIds.length === 0) return;
  const estadoBl = estadoBacklogDesdeTarea(estado);
  // Traer los backlogId de esas tareas en una sola consulta
  const filas = await db
    .select({ backlogId: tareas.backlogId })
    .from(tareas)
    .where(inArray(tareas.id, tareaIds));
  const backlogIds = filas
    .map((f) => f.backlogId)
    .filter((x): x is number => x != null);
  if (backlogIds.length === 0) return;
  // Un solo UPDATE para todos los backlog vinculados
  await db
    .update(backlog)
    .set({ estado: estadoBl, actualizadoEn: new Date() })
    .where(inArray(backlog.id, backlogIds));
}
