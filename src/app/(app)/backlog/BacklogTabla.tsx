"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Card, Badge, PageHeader, ReadOnlyNotice } from "@/components/ui";
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
import { Plus, Trash2, Search, Download } from "lucide-react";

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
}

// Peso para ordenar por impacto/esfuerzo
const PESO: Record<Escala, number> = { alto: 3, medio: 2, bajo: 1 };

type OrdenCampo = "reciente" | "impacto" | "esfuerzo";

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

  // Buscador / filtros / orden
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [orden, setOrden] = useState<OrdenCampo>("reciente");

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

  const ESTADOS: EstadoBacklog[] = [
    "nuevo",
    "a_evaluar",
    "aprobado",
    "descartado",
    "promovido",
  ];

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

      {/* Buscador, filtro y orden */}
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
            className={selectCls + " max-w-[180px]"}
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
            className={selectCls + " max-w-[180px]"}
            value={orden}
            onChange={(e) => setOrden(e.target.value as OrdenCampo)}
          >
            <option value="reciente">Más recientes</option>
            <option value="impacto">Mayor impacto</option>
            <option value="esfuerzo">Menor esfuerzo</option>
          </select>
        </div>
      )}

      {itemsIniciales.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-slate-500">
            El backlog está vacío.{" "}
            {puedeEditar && "Agregá el primer pedido con el botón de arriba."}
          </p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Pedido</th>
                <th className="px-4 py-3 font-medium">Área</th>
                <th className="px-4 py-3 font-medium">Impacto</th>
                <th className="px-4 py-3 font-medium">Esfuerzo</th>
                <th className="px-4 py-3 font-medium">Ingreso</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">En Kanban</th>
                {puedeEditar && <th className="px-4 py-3 font-medium">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {visibles.map((it) => (
                <tr key={it.id} className="border-b border-slate-100 align-top">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {it.codigo}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{it.pedido}</div>
                    {it.decisionQueApoya && (
                      <div className="text-xs text-slate-500">
                        Apoya: {it.decisionQueApoya}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {it.areaSolicitante || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {it.impacto ? ETIQUETA_ESCALA[it.impacto] : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {it.esfuerzo ? ETIQUETA_ESCALA[it.esfuerzo] : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatearFecha(it.fechaIngreso)}
                  </td>
                  <td className="px-4 py-3">
                    {puedeEditar ? (
                      <select
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                        value={it.estado}
                        onChange={(e) =>
                          cambiarEstado(it.id, e.target.value as EstadoBacklog)
                        }
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
                      <button
                        onClick={() => eliminar(it.id)}
                        className="text-slate-400 hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {visibles.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-6 text-center text-sm text-slate-400"
                  >
                    No hay pedidos que coincidan con el filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

    </div>
  );
}


