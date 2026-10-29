"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Card, PageHeader, EmptyState } from "@/components/ui";
import { formatearFecha } from "@/lib/utils";
import { nombreUsuario, type UsuarioMin } from "@/lib/consultas";
import { Plus, Pencil, Trash2, X, Search } from "lucide-react";

export interface ConceptoUI {
  id: number;
  termino: string;
  definicion: string;
  fuenteDato: string;
  formulaCalculo: string;
  responsableId: number | null;
  ultimaActualizacion: string | null;
}

export function ConceptosUI({
  itemsIniciales,
  usuarios,
  puedeEditar,
}: {
  itemsIniciales: ConceptoUI[];
  usuarios: UsuarioMin[];
  puedeEditar: boolean;
}) {
  const router = useRouter();
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<ConceptoUI | null>(null);
  const [filtro, setFiltro] = useState("");
  const mapaUsuarios = new Map(usuarios.map((u) => [u.id, u]));

  const filtrados = itemsIniciales.filter(
    (c) =>
      c.termino.toLowerCase().includes(filtro.toLowerCase()) ||
      c.definicion.toLowerCase().includes(filtro.toLowerCase())
  );

  async function eliminar(id: number) {
    if (!confirm("¿Eliminar este concepto?")) return;
    await fetch(`/api/conceptos?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        titulo="Tabla de conceptos"
        descripcion="Glosario de términos e indicadores, para que no den números distintos según quién calcule."
      >
        {puedeEditar && (
          <Button
            onClick={() => {
              setEditando(null);
              setModal(true);
            }}
          >
            <Plus size={16} /> Nuevo concepto
          </Button>
        )}
      </PageHeader>

      {itemsIniciales.length > 0 && (
        <div className="mb-4 relative max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            className="pl-9"
            placeholder="Buscar término o definición..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
      )}

      {itemsIniciales.length === 0 ? (
        <EmptyState
          titulo="El glosario está vacío"
          descripcion={
            puedeEditar
              ? "Agregá el primer término (dotación, cargo ocupado/vacante, fecha de corte, etc.)."
              : "Todavía no se cargaron conceptos."
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtrados.map((c) => {
            const resp = c.responsableId ? mapaUsuarios.get(c.responsableId) : null;
            return (
              <Card key={c.id}>
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="text-base font-semibold text-slate-900">
                    {c.termino}
                  </h3>
                  {puedeEditar && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditando(c);
                          setModal(true);
                        }}
                        className="text-slate-400 hover:text-brand-600"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => eliminar(c.id)}
                        className="text-slate-400 hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
                {c.definicion && (
                  <p className="text-sm text-slate-700">{c.definicion}</p>
                )}
                <dl className="mt-3 space-y-1 text-xs">
                  {c.fuenteDato && (
                    <Fila etiqueta="Fuente del dato" valor={c.fuenteDato} />
                  )}
                  {c.formulaCalculo && (
                    <Fila etiqueta="Fórmula de cálculo" valor={c.formulaCalculo} />
                  )}
                  <Fila
                    etiqueta="Responsable"
                    valor={resp ? nombreUsuario(resp) : "—"}
                  />
                  {c.ultimaActualizacion && (
                    <Fila
                      etiqueta="Última actualización"
                      valor={formatearFecha(c.ultimaActualizacion)}
                    />
                  )}
                </dl>
              </Card>
            );
          })}
          {filtrados.length === 0 && (
            <p className="text-sm text-slate-500">
              No hay conceptos que coincidan con la búsqueda.
            </p>
          )}
        </div>
      )}

      {modal && (
        <ConceptoModal
          concepto={editando}
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

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 font-medium text-slate-400">{etiqueta}:</dt>
      <dd className="text-slate-600">{valor}</dd>
    </div>
  );
}

function ConceptoModal({
  concepto,
  usuarios,
  onCerrar,
  onGuardado,
}: {
  concepto: ConceptoUI | null;
  usuarios: UsuarioMin[];
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const [termino, setTermino] = useState(concepto?.termino ?? "");
  const [definicion, setDefinicion] = useState(concepto?.definicion ?? "");
  const [fuenteDato, setFuente] = useState(concepto?.fuenteDato ?? "");
  const [formulaCalculo, setFormula] = useState(concepto?.formulaCalculo ?? "");
  const [responsableId, setResponsable] = useState(
    concepto?.responsableId?.toString() ?? ""
  );
  const [ultimaActualizacion, setUltima] = useState(
    concepto?.ultimaActualizacion ?? ""
  );
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const ta = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setGuardando(true);
    const payload = {
      termino,
      definicion,
      fuenteDato,
      formulaCalculo,
      responsableId: responsableId || null,
      ultimaActualizacion: ultimaActualizacion || null,
    };
    try {
      const res = concepto
        ? await fetch("/api/conceptos", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: concepto.id, ...payload }),
          })
        : await fetch("/api/conceptos", {
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
        className="my-8 w-full max-w-xl rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {concepto ? "Editar concepto" : "Nuevo concepto"}
          </h2>
          <button onClick={onCerrar} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={guardar} className="space-y-4 p-5">
          <div>
            <Label>Término *</Label>
            <Input
              value={termino}
              onChange={(e) => setTermino(e.target.value)}
              placeholder="Ej: Dotación"
              autoFocus
              required
            />
          </div>
          <div>
            <Label>Definición</Label>
            <textarea
              className={ta}
              rows={3}
              value={definicion}
              onChange={(e) => setDefinicion(e.target.value)}
            />
          </div>
          <div>
            <Label>Fuente del dato</Label>
            <Input value={fuenteDato} onChange={(e) => setFuente(e.target.value)} />
          </div>
          <div>
            <Label>Fórmula de cálculo (si es indicador)</Label>
            <textarea
              className={ta}
              rows={2}
              value={formulaCalculo}
              onChange={(e) => setFormula(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Responsable de mantenerlo</Label>
              <select
                className={ta}
                value={responsableId}
                onChange={(e) => setResponsable(e.target.value)}
              >
                <option value="">Sin asignar</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {nombreUsuario(u)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Última actualización</Label>
              <Input
                type="date"
                value={ultimaActualizacion}
                onChange={(e) => setUltima(e.target.value)}
              />
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
            <Button type="submit" disabled={guardando}>
              {guardando ? "Guardando..." : concepto ? "Guardar cambios" : "Crear concepto"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
