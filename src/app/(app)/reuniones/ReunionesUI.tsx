"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Card, PageHeader, EmptyState, ReadOnlyNotice } from "@/components/ui";
import { useConfirm } from "@/components/confirm";
import { formatearFecha } from "@/lib/utils";
import { Plus, Pencil, Trash2, X, CalendarDays } from "lucide-react";

export interface ReunionUI {
  id: number;
  titulo: string;
  fecha: string;
  avances: string;
  bloqueos: string;
  focoSemana: string;
  acuerdos: string;
  participantes: string;
}

const hoyISO = () => new Date().toISOString().slice(0, 10);

export function ReunionesUI({
  itemsIniciales,
  puedeEditar,
}: {
  itemsIniciales: ReunionUI[];
  puedeEditar: boolean;
}) {
  const router = useRouter();
  const confirmar = useConfirm();
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<ReunionUI | null>(null);

  function abrirNueva() {
    setEditando(null);
    setModal(true);
  }
  function abrirEdicion(r: ReunionUI) {
    setEditando(r);
    setModal(true);
  }

  async function eliminar(id: number) {
    const ok = await confirmar({
      titulo: "Eliminar reunión",
      mensaje: "Se borrará el registro de esta reunión. Esta acción no se puede deshacer.",
      textoConfirmar: "Eliminar",
      peligro: true,
    });
    if (!ok) return;
    await fetch(`/api/reuniones?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        titulo="Reuniones"
        descripcion="Coordinación semanal de 30 minutos: qué se avanzó, qué está trabado, qué se hace esta semana."
      >
        {puedeEditar && (
          <Button onClick={abrirNueva}>
            <Plus size={16} /> Nueva reunión
          </Button>
        )}
      </PageHeader>

      {!puedeEditar && <ReadOnlyNotice />}

      {itemsIniciales.length === 0 ? (
        <EmptyState
          titulo="No hay reuniones registradas"
          descripcion={
            puedeEditar
              ? "Registrá la primera reunión con el botón de arriba."
              : "Todavía no se registraron reuniones."
          }
        />
      ) : (
        <div className="space-y-4">
          {itemsIniciales.map((r) => (
            <Card key={r.id}>
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <CalendarDays size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{r.titulo}</div>
                    <div className="text-xs text-slate-500">
                      {formatearFecha(r.fecha)}
                      {r.participantes && ` · ${r.participantes}`}
                    </div>
                  </div>
                </div>
                {puedeEditar && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => abrirEdicion(r)}
                      className="text-slate-400 hover:text-brand-600"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => eliminar(r.id)}
                      className="text-slate-400 hover:text-red-600"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Bloque titulo="Qué se avanzó" texto={r.avances} />
                <Bloque titulo="Qué está trabado" texto={r.bloqueos} color="red" />
                <Bloque titulo="Foco de la semana" texto={r.focoSemana} color="blue" />
                <Bloque titulo="Acuerdos" texto={r.acuerdos} color="green" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <ReunionModal
          reunion={editando}
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

function Bloque({
  titulo,
  texto,
  color = "slate",
}: {
  titulo: string;
  texto: string;
  color?: "slate" | "red" | "blue" | "green";
}) {
  const borde = {
    slate: "border-l-slate-300",
    red: "border-l-red-400",
    blue: "border-l-brand-400",
    green: "border-l-green-400",
  }[color];
  return (
    <div className={`border-l-4 ${borde} pl-3`}>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {titulo}
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
        {texto || <span className="text-slate-300">—</span>}
      </p>
    </div>
  );
}

function ReunionModal({
  reunion,
  onCerrar,
  onGuardado,
}: {
  reunion: ReunionUI | null;
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const [titulo, setTitulo] = useState(reunion?.titulo ?? "Reunión semanal");
  const [fecha, setFecha] = useState(reunion?.fecha ?? hoyISO());
  const [participantes, setParticipantes] = useState(reunion?.participantes ?? "");
  const [avances, setAvances] = useState(reunion?.avances ?? "");
  const [bloqueos, setBloqueos] = useState(reunion?.bloqueos ?? "");
  const [focoSemana, setFoco] = useState(reunion?.focoSemana ?? "");
  const [acuerdos, setAcuerdos] = useState(reunion?.acuerdos ?? "");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const ta = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setGuardando(true);
    const payload = {
      titulo,
      fecha,
      participantes,
      avances,
      bloqueos,
      focoSemana,
      acuerdos,
    };
    try {
      const res = reunion
        ? await fetch("/api/reuniones", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: reunion.id, ...payload }),
          })
        : await fetch("/api/reuniones", {
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
        className="my-8 w-full max-w-2xl rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {reunion ? "Editar reunión" : "Nueva reunión"}
          </h2>
          <button onClick={onCerrar} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={guardar} className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Título</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            </div>
            <div>
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <Label>Participantes</Label>
            <Input
              value={participantes}
              onChange={(e) => setParticipantes(e.target.value)}
              placeholder="Nombres separados por coma"
            />
          </div>
          <div>
            <Label>Qué se avanzó</Label>
            <textarea className={ta} rows={2} value={avances} onChange={(e) => setAvances(e.target.value)} />
          </div>
          <div>
            <Label>Qué está trabado (bloqueos)</Label>
            <textarea className={ta} rows={2} value={bloqueos} onChange={(e) => setBloqueos(e.target.value)} />
          </div>
          <div>
            <Label>Foco de la semana</Label>
            <textarea className={ta} rows={2} value={focoSemana} onChange={(e) => setFoco(e.target.value)} />
          </div>
          <div>
            <Label>Acuerdos</Label>
            <textarea className={ta} rows={2} value={acuerdos} onChange={(e) => setAcuerdos(e.target.value)} />
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
              {reunion ? "Guardar cambios" : "Crear reunión"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
