"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Label,
  Card,
  Badge,
  PageHeader,
  ReadOnlyNotice,
} from "@/components/ui";
import { useConfirm } from "@/components/confirm";
import { formatearFecha } from "@/lib/utils";
import {
  ESCALAS,
  ETIQUETA_ESCALA,
  ETIQUETA_ESTADO_BACKLOG,
  COLOR_ESTADO_BACKLOG,
  ETIQUETA_ESTADO,
  COLOR_ESTADO,
  type Escala,
  type EstadoBacklog,
  type EstadoTarea,
} from "@/lib/dominio";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Download,
  X,
  Table2,
  CalendarDays,
  GanttChartSquare,
} from "lucide-react";

export interface ItemBacklogUI {
  id: number;
  codigo: string;
  pedido: string;
  areaSolicitante: string;
  decisionQueApoya: string;
  impacto: Escala | null;
  esfuerzo: Escala | null;
  estado: EstadoBacklog;
  fechaIngreso: string;
  estadoTareaKanban: EstadoTarea | null;
  fechaLimiteTarea: string | null;
}

const PESO: Record<Escala, number> = { alto: 3, medio: 2, bajo: 1 };
type OrdenCampo = "reciente" | "impacto" | "esfuerzo";
type Vista = "grilla" | "calendario" | "gantt";

const ESTADOS: EstadoBacklog[] = [
  "nuevo",
  "a_evaluar",
  "aprobado",
  "descartado",
  "promovido",
];

export function BacklogTabla({
  itemsIniciales,
  puedeEditar,
  puedeCoordinar,
}: {
  itemsIniciales: ItemBacklogUI[];
  puedeEditar: boolean;
  puedeCoordinar: boolean;
}) {
  const router = useRouter();
  const confirmar = useConfirm();
  const [form, setForm] = useState(false);
  const [creando, setCreando] = useState(false);
  const [pedido, setPedido] = useState("");
  const [areaSolicitante, setArea] = useState("");
  const [decisionQueApoya, setDecision] = useState("");
  const [impacto, setImpacto] = useState<string>("");
  const [esfuerzo, setEsfuerzo] = useState<string>("");
  const [error, setError] = useState("");

  // Edición
  const [editando, setEditando] = useState<ItemBacklogUI | null>(null);

  // Buscador / filtros / orden / vista
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [orden, setOrden] = useState<OrdenCampo>("reciente");
  const [vista, setVista] = useState<Vista>("grilla");

  const selectCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";

  const visibles = useMemo(() => {
    let lista = itemsIniciales.filter(
      (it) =>
        it.pedido.toLowerCase().includes(busqueda.toLowerCase()) ||
        it.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
        it.areaSolicitante.toLowerCase().includes(busqueda.toLowerCase())
    );
    if (filtroEstado) lista = lista.filter((it) => it.estado === filtroEstado);
    if (orden === "impacto") {
      lista = [...lista].sort(
        (a, b) => (b.impacto ? PESO[b.impacto] : 0) - (a.impacto ? PESO[a.impacto] : 0)
      );
    } else if (orden === "esfuerzo") {
      lista = [...lista].sort(
        (a, b) => (a.esfuerzo ? PESO[a.esfuerzo] : 99) - (b.esfuerzo ? PESO[b.esfuerzo] : 99)
      );
    }
    return lista;
  }, [itemsIniciales, busqueda, filtroEstado, orden]);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreando(true);
    try {
      const res = await fetch("/api/backlog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedido,
          areaSolicitante,
          decisionQueApoya,
          impacto: impacto || null,
          esfuerzo: esfuerzo || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPedido("");
        setArea("");
        setDecision("");
        setImpacto("");
        setEsfuerzo("");
        setForm(false);
        router.refresh();
      } else {
        setError(data.error || "No se pudo crear.");
      }
    } finally {
      setCreando(false);
    }
  }

  async function cambiarEstado(id: number, estado: EstadoBacklog) {
    const res = await fetch("/api/backlog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estado }),
    });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error || "No se pudo actualizar.");
      return;
    }
    router.refresh();
  }

  async function eliminar(id: number) {
    const ok = await confirmar({
      titulo: "Eliminar pedido",
      mensaje: "Se quitará del backlog. Esta acción no se puede deshacer.",
      textoConfirmar: "Eliminar",
      peligro: true,
    });
    if (!ok) return;
    await fetch(`/api/backlog?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        titulo="Backlog"
        descripcion="Todo pedido entra acá (no por pasillo ni mensajes sueltos). De acá se eligen las prioridades."
      >
        <a
          href="/api/export?tipo=backlog"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200"
        >
          <Download size={16} /> Exportar CSV
        </a>
        {puedeEditar && (
          <Button onClick={() => setForm(!form)}>
            <Plus size={16} /> {form ? "Cancelar" : "Nuevo pedido"}
          </Button>
        )}
      </PageHeader>

      {!puedeEditar && !puedeCoordinar && <ReadOnlyNotice />}

      {form && (
        <Card className="mb-6">
          <form onSubmit={crear} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Pedido / idea *</Label>
              <Input
                value={pedido}
                onChange={(e) => setPedido(e.target.value)}
                placeholder="Ej: Automatizar reporte mensual de ausentismo"
                required
              />
            </div>
            <div>
              <Label>Área solicitante</Label>
              <Input value={areaSolicitante} onChange={(e) => setArea(e.target.value)} />
            </div>
            <div>
              <Label>Decisión que apoya</Label>
              <Input
                value={decisionQueApoya}
                onChange={(e) => setDecision(e.target.value)}
              />
            </div>
            <div>
              <Label>Impacto</Label>
              <select
                className={selectCls}
                value={impacto}
                onChange={(e) => setImpacto(e.target.value)}
              >
                <option value="">—</option>
                {ESCALAS.map((s) => (
                  <option key={s} value={s}>
                    {ETIQUETA_ESCALA[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Esfuerzo</Label>
              <select
                className={selectCls}
                value={esfuerzo}
                onChange={(e) => setEsfuerzo(e.target.value)}
              >
                <option value="">—</option>
                {ESCALAS.map((s) => (
                  <option key={s} value={s}>
                    {ETIQUETA_ESCALA[s]}
                  </option>
                ))}
              </select>
            </div>
            {error && (
              <div className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="sm:col-span-2">
              <Button type="submit" cargando={creando}>
                Agregar al backlog
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Buscador, filtros, orden y selector de vista */}
      {itemsIniciales.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              className="pl-9"
              placeholder="Buscar pedido, código o área..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <select
            className={selectCls + " max-w-[170px]"}
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((s) => (
              <option key={s} value={s}>
                {ETIQUETA_ESTADO_BACKLOG[s]}
              </option>
            ))}
          </select>
          <select
            className={selectCls + " max-w-[160px]"}
            value={orden}
            onChange={(e) => setOrden(e.target.value as OrdenCampo)}
          >
            <option value="reciente">Más recientes</option>
            <option value="impacto">Mayor impacto</option>
            <option value="esfuerzo">Menor esfuerzo</option>
          </select>
          {/* Selector de vista */}
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
            {([
              ["grilla", Table2, "Grilla"],
              ["calendario", CalendarDays, "Calendario"],
              ["gantt", GanttChartSquare, "Gantt"],
            ] as const).map(([v, Icon, label]) => (
              <button
                key={v}
                onClick={() => setVista(v)}
                title={label}
                className={
                  "flex items-center gap-1 rounded-md px-3 py-1.5 text-sm " +
                  (vista === v
                    ? "bg-brand-600 text-white"
                    : "text-slate-600 hover:bg-slate-100")
                }
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {itemsIniciales.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-slate-500">
            El backlog está vacío.{" "}
            {puedeEditar && "Agregá el primer pedido con el botón de arriba."}
          </p>
        </Card>
      ) : vista === "grilla" ? (
        <VistaGrilla
          items={visibles}
          puedeEditar={puedeEditar}
          onEstado={cambiarEstado}
          onEditar={(it) => setEditando(it)}
          onEliminar={eliminar}
        />
      ) : vista === "calendario" ? (
        <VistaCalendario items={visibles} />
      ) : (
        <VistaGantt items={visibles} />
      )}

      {editando && (
        <EditarModal
          item={editando}
          onCerrar={() => setEditando(null)}
          onGuardado={() => {
            setEditando(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vista Grilla (tabla)
// ---------------------------------------------------------------------------
function VistaGrilla({
  items,
  puedeEditar,
  onEstado,
  onEditar,
  onEliminar,
}: {
  items: ItemBacklogUI[];
  puedeEditar: boolean;
  onEstado: (id: number, e: EstadoBacklog) => void;
  onEditar: (it: ItemBacklogUI) => void;
  onEliminar: (id: number) => void;
}) {
  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="px-4 py-3 font-medium">ID</th>
            <th className="px-4 py-3 font-medium">Pedido</th>
            <th className="px-4 py-3 font-medium">Área</th>
            <th className="px-4 py-3 font-medium">Impacto</th>
            <th className="px-4 py-3 font-medium">Esfuerzo</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">En Kanban</th>
            {puedeEditar && <th className="px-4 py-3 font-medium">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="border-b border-slate-100 align-top">
              <td className="px-4 py-3 font-mono text-xs text-slate-500">{it.codigo}</td>
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{it.pedido}</div>
                {it.decisionQueApoya && (
                  <div className="text-xs text-slate-500">Apoya: {it.decisionQueApoya}</div>
                )}
              </td>
              <td className="px-4 py-3 text-slate-600">{it.areaSolicitante || "—"}</td>
              <td className="px-4 py-3">{it.impacto ? ETIQUETA_ESCALA[it.impacto] : "—"}</td>
              <td className="px-4 py-3">{it.esfuerzo ? ETIQUETA_ESCALA[it.esfuerzo] : "—"}</td>
              <td className="px-4 py-3">
                {puedeEditar ? (
                  <select
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                    value={it.estado}
                    onChange={(e) => onEstado(it.id, e.target.value as EstadoBacklog)}
                  >
                    {ESTADOS.map((s) => (
                      <option key={s} value={s}>
                        {ETIQUETA_ESTADO_BACKLOG[s]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Badge color={COLOR_ESTADO_BACKLOG[it.estado]}>
                    {ETIQUETA_ESTADO_BACKLOG[it.estado]}
                  </Badge>
                )}
              </td>
              <td className="px-4 py-3">
                {it.estadoTareaKanban ? (
                  <Badge color={COLOR_ESTADO[it.estadoTareaKanban]}>
                    {ETIQUETA_ESTADO[it.estadoTareaKanban]}
                  </Badge>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </td>
              {puedeEditar && (
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditar(it)}
                      className="text-slate-400 hover:text-brand-600"
                      title="Editar área, impacto y esfuerzo"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => onEliminar(it.id)}
                      className="text-slate-400 hover:text-red-600"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-400">
                No hay pedidos que coincidan con el filtro.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Vista Calendario (por mes, usando la fecha límite de la tarea vinculada)
// ---------------------------------------------------------------------------
function VistaCalendario({ items }: { items: ItemBacklogUI[] }) {
  const conFecha = items.filter((i) => i.fechaLimiteTarea);
  const sinFecha = items.filter((i) => !i.fechaLimiteTarea);

  // Agrupar por mes (YYYY-MM)
  const porMes = new Map<string, ItemBacklogUI[]>();
  for (const it of conFecha) {
    const mes = it.fechaLimiteTarea!.slice(0, 7);
    const arr = porMes.get(mes) ?? [];
    arr.push(it);
    porMes.set(mes, arr);
  }
  const meses = [...porMes.keys()].sort();

  const nombreMes = (ym: string) => {
    const [a, m] = ym.split("-");
    return new Date(Number(a), Number(m) - 1, 1).toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {meses.length === 0 && (
        <Card>
          <p className="text-center text-sm text-slate-500">
            No hay pedidos con fecha límite (la fecha viene de la tarea vinculada en el
            Kanban).
          </p>
        </Card>
      )}
      {meses.map((mes) => (
        <Card key={mes}>
          <h3 className="mb-3 font-semibold capitalize text-slate-900">
            {nombreMes(mes)}
          </h3>
          <div className="space-y-2">
            {porMes
              .get(mes)!
              .sort((a, b) => a.fechaLimiteTarea!.localeCompare(b.fechaLimiteTarea!))
              .map((it) => (
                <div
                  key={it.id}
                  className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2"
                >
                  <div className="w-16 shrink-0 text-center">
                    <div className="text-lg font-semibold text-brand-700">
                      {it.fechaLimiteTarea!.slice(8, 10)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {formatearFecha(it.fechaLimiteTarea).slice(3, 5)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-800">{it.pedido}</div>
                    <div className="text-xs text-slate-500">{it.codigo}</div>
                  </div>
                  {it.estadoTareaKanban && (
                    <Badge color={COLOR_ESTADO[it.estadoTareaKanban]}>
                      {ETIQUETA_ESTADO[it.estadoTareaKanban]}
                    </Badge>
                  )}
                </div>
              ))}
          </div>
        </Card>
      ))}
      {sinFecha.length > 0 && (
        <Card className="border-dashed">
          <div className="mb-2 text-sm font-medium text-slate-500">
            Sin fecha límite ({sinFecha.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {sinFecha.map((it) => (
              <span
                key={it.id}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
              >
                {it.pedido}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vista Gantt (barras simples desde fecha de ingreso hasta fecha límite)
// ---------------------------------------------------------------------------
function VistaGantt({ items }: { items: ItemBacklogUI[] }) {
  const conFecha = items.filter((i) => i.fechaLimiteTarea);
  if (conFecha.length === 0) {
    return (
      <Card>
        <p className="text-center text-sm text-slate-500">
          No hay pedidos con fecha límite para graficar. La fecha viene de la tarea
          vinculada en el Kanban.
        </p>
      </Card>
    );
  }

  // Rango temporal: del menor ingreso al mayor límite
  const dias = (d: string) => new Date(d + "T00:00:00").getTime() / 86400000;
  const inicios = conFecha.map((i) => dias(i.fechaIngreso));
  const fines = conFecha.map((i) => dias(i.fechaLimiteTarea!));
  const min = Math.min(...inicios);
  const max = Math.max(...fines);
  const rango = Math.max(1, max - min);

  return (
    <Card className="overflow-x-auto">
      <div className="min-w-[600px] space-y-2">
        {conFecha
          .sort((a, b) => dias(a.fechaLimiteTarea!) - dias(b.fechaLimiteTarea!))
          .map((it) => {
            const ini = dias(it.fechaIngreso);
            const fin = dias(it.fechaLimiteTarea!);
            const left = ((ini - min) / rango) * 100;
            const width = Math.max(3, ((fin - ini) / rango) * 100);
            const color = it.estadoTareaKanban
              ? {
                  pendiente: "bg-slate-400",
                  en_curso: "bg-brand-500",
                  bloqueada: "bg-red-500",
                  lista: "bg-green-500",
                }[it.estadoTareaKanban]
              : "bg-slate-300";
            return (
              <div key={it.id} className="flex items-center gap-3">
                <div className="w-40 shrink-0 truncate text-xs text-slate-700">
                  {it.pedido}
                </div>
                <div className="relative h-6 flex-1 rounded bg-slate-100">
                  <div
                    className={"absolute top-0 h-6 rounded " + color}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`${formatearFecha(it.fechaIngreso)} → ${formatearFecha(
                      it.fechaLimiteTarea
                    )}`}
                  />
                </div>
                <div className="w-20 shrink-0 text-right text-xs text-slate-400">
                  {formatearFecha(it.fechaLimiteTarea)}
                </div>
              </div>
            );
          })}
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Barra: desde el ingreso del pedido hasta la fecha límite de su tarea. Color según
        estado en el Kanban.
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Modal de edición (área, impacto, esfuerzo, decisión)
// ---------------------------------------------------------------------------
function EditarModal({
  item,
  onCerrar,
  onGuardado,
}: {
  item: ItemBacklogUI;
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const [pedido, setPedido] = useState(item.pedido);
  const [areaSolicitante, setArea] = useState(item.areaSolicitante);
  const [decisionQueApoya, setDecision] = useState(item.decisionQueApoya);
  const [impacto, setImpacto] = useState<string>(item.impacto ?? "");
  const [esfuerzo, setEsfuerzo] = useState<string>(item.esfuerzo ?? "");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      const res = await fetch("/api/backlog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          pedido,
          areaSolicitante,
          decisionQueApoya,
          impacto: impacto || null,
          esfuerzo: esfuerzo || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo guardar.");
        return;
      }
      onGuardado();
    } catch {
      setError("Error de conexión.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-4"
      onClick={onCerrar}
    >
      <div
        className="my-8 w-full max-w-lg rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Editar pedido {item.codigo}
          </h2>
          <button onClick={onCerrar} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={guardar} className="space-y-4 p-5">
          <div>
            <Label>Pedido</Label>
            <Input value={pedido} onChange={(e) => setPedido(e.target.value)} required />
          </div>
          <div>
            <Label>Área solicitante</Label>
            <Input value={areaSolicitante} onChange={(e) => setArea(e.target.value)} />
          </div>
          <div>
            <Label>Decisión que apoya</Label>
            <Input
              value={decisionQueApoya}
              onChange={(e) => setDecision(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Impacto</Label>
              <select className={cls} value={impacto} onChange={(e) => setImpacto(e.target.value)}>
                <option value="">—</option>
                {ESCALAS.map((s) => (
                  <option key={s} value={s}>
                    {ETIQUETA_ESCALA[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Esfuerzo</Label>
              <select className={cls} value={esfuerzo} onChange={(e) => setEsfuerzo(e.target.value)}>
                <option value="">—</option>
                {ESCALAS.map((s) => (
                  <option key={s} value={s}>
                    {ETIQUETA_ESCALA[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="secondary" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button type="submit" cargando={guardando}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
