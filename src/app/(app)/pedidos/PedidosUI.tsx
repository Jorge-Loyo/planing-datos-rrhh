"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Label,
  Card,
  Badge,
  PageHeader,
  EmptyState,
  ReadOnlyNotice,
} from "@/components/ui";
import { useConfirm } from "@/components/confirm";
import { formatearFecha } from "@/lib/utils";
import { nombreUsuario, type UsuarioMin } from "@/lib/usuarios";
import {
  ESTADOS_PEDIDO,
  ETIQUETA_ESTADO_PEDIDO,
  COLOR_ESTADO_PEDIDO,
  type EstadoPedido,
} from "@/lib/dominio";
import { Plus, Pencil, Trash2, X, Send, ArrowRight, Download } from "lucide-react";

export interface PedidoUI {
  id: number;
  descripcion: string;
  solicitanteId: number | null;
  asignadoId: number | null;
  estado: EstadoPedido;
  fechaPedido: string;
  fechaNecesaria: string | null;
  fechaResuelto: string | null;
  nota: string;
}

export function PedidosUI({
  itemsIniciales,
  usuarios,
  puedeEditar,
}: {
  itemsIniciales: PedidoUI[];
  usuarios: UsuarioMin[];
  puedeEditar: boolean;
}) {
  const router = useRouter();
  const confirmar = useConfirm();
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<PedidoUI | null>(null);
  const [filtroAsignado, setFiltroAsignado] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const mapaUsuarios = new Map(usuarios.map((u) => [u.id, u]));

  const visibles = itemsIniciales.filter((p) => {
    if (filtroAsignado) {
      if (filtroAsignado === "sin" && p.asignadoId !== null) return false;
      if (filtroAsignado !== "sin" && p.asignadoId !== Number(filtroAsignado))
        return false;
    }
    if (filtroEstado && p.estado !== filtroEstado) return false;
    return true;
  });

  async function cambiarEstado(id: number, estado: EstadoPedido) {
    await fetch("/api/pedidos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estado }),
    });
    router.refresh();
  }

  async function eliminar(id: number) {
    const ok = await confirmar({
      titulo: "Eliminar pedido",
      mensaje: "Se eliminará el registro de este pedido. Esta acción no se puede deshacer.",
      textoConfirmar: "Eliminar",
      peligro: true,
    });
    if (!ok) return;
    await fetch(`/api/pedidos?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  const selectCls =
    "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";

  return (
    <div>
      <PageHeader
        titulo="Pedidos"
        descripcion="Solicitudes emergentes que se le hacen a un integrante. Quedan registradas con quién pide, a quién y su estado."
      >
        <a
          href="/api/export?tipo=pedidos"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200"
        >
          <Download size={16} /> Exportar CSV
        </a>
        {puedeEditar && (
          <Button
            onClick={() => {
              setEditando(null);
              setModal(true);
            }}
          >
            <Plus size={16} /> Nuevo pedido
          </Button>
        )}
      </PageHeader>

      {!puedeEditar && <ReadOnlyNotice />}

      {itemsIniciales.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            className={selectCls}
            value={filtroAsignado}
            onChange={(e) => setFiltroAsignado(e.target.value)}
          >
            <option value="">Todos los asignados</option>
            <option value="sin">Sin asignar</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {nombreUsuario(u)}
              </option>
            ))}
          </select>
          <select
            className={selectCls}
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            {ESTADOS_PEDIDO.map((e) => (
              <option key={e} value={e}>
                {ETIQUETA_ESTADO_PEDIDO[e]}
              </option>
            ))}
          </select>
        </div>
      )}

      {itemsIniciales.length === 0 ? (
        <EmptyState
          titulo="No hay pedidos registrados"
          descripcion={
            puedeEditar
              ? "Registrá el primer pedido emergente con el botón de arriba."
              : "Todavía no se registraron pedidos."
          }
        />
      ) : (
        <div className="space-y-2">
          {visibles.map((p) => {
            const solicitante = p.solicitanteId
              ? mapaUsuarios.get(p.solicitanteId)
              : null;
            const asignado = p.asignadoId ? mapaUsuarios.get(p.asignadoId) : null;
            return (
              <Card key={p.id} className="flex flex-wrap items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Send size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-900">
                    {p.descripcion}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                    <span>{solicitante ? nombreUsuario(solicitante) : "—"}</span>
                    <ArrowRight size={12} />
                    <span className="font-medium text-slate-700">
                      {asignado ? nombreUsuario(asignado) : "Sin asignar"}
                    </span>
                    <span className="ml-2">· Pedido: {formatearFecha(p.fechaPedido)}</span>
                    {p.fechaNecesaria && (
                      <span>· Necesario: {formatearFecha(p.fechaNecesaria)}</span>
                    )}
                    {p.estado === "resuelto" && p.fechaResuelto && (
                      <span className="text-green-600">
                        · Resuelto: {formatearFecha(p.fechaResuelto)}
                      </span>
                    )}
                  </div>
                  {p.nota && (
                    <div className="mt-1 text-xs text-slate-400">{p.nota}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {puedeEditar ? (
                    <select
                      className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                      value={p.estado}
                      onChange={(e) =>
                        cambiarEstado(p.id, e.target.value as EstadoPedido)
                      }
                    >
                      {ESTADOS_PEDIDO.map((e) => (
                        <option key={e} value={e}>
                          {ETIQUETA_ESTADO_PEDIDO[e]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Badge color={COLOR_ESTADO_PEDIDO[p.estado]}>
                      {ETIQUETA_ESTADO_PEDIDO[p.estado]}
                    </Badge>
                  )}
                  {puedeEditar && (
                    <>
                      <button
                        onClick={() => {
                          setEditando(p);
                          setModal(true);
                        }}
                        className="text-slate-400 hover:text-brand-600"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => eliminar(p.id)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
          {visibles.length === 0 && (
            <p className="text-sm text-slate-500">
              No hay pedidos que coincidan con el filtro.
            </p>
          )}
        </div>
      )}

      {modal && (
        <PedidoModal
          pedido={editando}
          usuarios={usuarios}
          onCerrar={() => setModal(false)}
          onGuardado={() => {
            setModal(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function PedidoModal({
  pedido,
  usuarios,
  onCerrar,
  onGuardado,
}: {
  pedido: PedidoUI | null;
  usuarios: UsuarioMin[];
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const [descripcion, setDescripcion] = useState(pedido?.descripcion ?? "");
  const [solicitanteId, setSolicitante] = useState(
    pedido?.solicitanteId?.toString() ?? ""
  );
  const [asignadoId, setAsignado] = useState(pedido?.asignadoId?.toString() ?? "");
  const [fechaNecesaria, setFecha] = useState(pedido?.fechaNecesaria ?? "");
  const [nota, setNota] = useState(pedido?.nota ?? "");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setGuardando(true);
    const payload = {
      descripcion,
      solicitanteId: solicitanteId || null,
      asignadoId: asignadoId || null,
      fechaNecesaria: fechaNecesaria || null,
      nota,
    };
    try {
      const res = pedido
        ? await fetch("/api/pedidos", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: pedido.id, ...payload }),
          })
        : await fetch("/api/pedidos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
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
            {pedido ? "Editar pedido" : "Nuevo pedido"}
          </h2>
          <button onClick={onCerrar} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={guardar} className="space-y-4 p-5">
          <div>
            <Label>¿Qué se pide? *</Label>
            <textarea
              className={cls}
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Pasar el archivo de dotación actualizado de septiembre"
              autoFocus
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Solicitante</Label>
              <select
                className={cls}
                value={solicitanteId}
                onChange={(e) => setSolicitante(e.target.value)}
              >
                <option value="">Yo (quien registra)</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {nombreUsuario(u)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Asignado a *</Label>
              <select
                className={cls}
                value={asignadoId}
                onChange={(e) => setAsignado(e.target.value)}
              >
                <option value="">Sin asignar</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {nombreUsuario(u)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label>Fecha necesaria (opcional)</Label>
            <Input
              type="date"
              value={fechaNecesaria}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <div>
            <Label>Nota (opcional)</Label>
            <Input value={nota} onChange={(e) => setNota(e.target.value)} />
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
              {pedido ? "Guardar cambios" : "Registrar pedido"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
