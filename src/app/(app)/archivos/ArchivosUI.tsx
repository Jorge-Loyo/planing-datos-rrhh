"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Card, Badge, PageHeader, EmptyState } from "@/components/ui";
import { formatearFecha } from "@/lib/utils";
import { nombreUsuario, type UsuarioMin } from "@/lib/usuarios";
import {
  TIPOS_RECURSO,
  ETIQUETA_TIPO_RECURSO,
  type TipoRecurso,
} from "@/lib/dominio";
import {
  Plus,
  Trash2,
  Pencil,
  X,
  ExternalLink,
  FileStack,
  History,
  CheckCircle2,
} from "lucide-react";

export interface VersionUI {
  id: number;
  version: string;
  urlDrive: string;
  nota: string;
  vigente: boolean;
  creadoEn: string | null;
}
export interface RecursoUI {
  id: number;
  nombre: string;
  tipo: TipoRecurso;
  queContiene: string;
  responsableId: number | null;
  versiones: VersionUI[];
}

export function ArchivosUI({
  itemsIniciales,
  usuarios,
  puedeEditar,
}: {
  itemsIniciales: RecursoUI[];
  usuarios: UsuarioMin[];
  puedeEditar: boolean;
}) {
  const router = useRouter();
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<RecursoUI | null>(null);
  const [verHistorico, setVerHistorico] = useState<Record<number, boolean>>({});
  const [versionPara, setVersionPara] = useState<RecursoUI | null>(null);
  const mapaUsuarios = new Map(usuarios.map((u) => [u.id, u]));

  async function eliminarRecurso(id: number) {
    if (!confirm("¿Eliminar este recurso y todas sus versiones?")) return;
    await fetch(`/api/recursos?id=${id}`, { method: "DELETE" });
    router.refresh();
  }
  async function marcarVigente(recursoId: number, versionId: number) {
    await fetch("/api/recursos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "marcar_vigente", recursoId, versionId }),
    });
    router.refresh();
  }
  async function eliminarVersion(versionId: number) {
    if (!confirm("¿Eliminar esta versión?")) return;
    await fetch("/api/recursos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "eliminar_version", versionId }),
    });
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        titulo="Archivos / Conocimiento compartido"
        descripcion="Índice de recursos con su enlace de Google Drive y control de versiones (vigente / histórico)."
      >
        {puedeEditar && (
          <Button
            onClick={() => {
              setEditando(null);
              setModal(true);
            }}
          >
            <Plus size={16} /> Nuevo recurso
          </Button>
        )}
      </PageHeader>

      {itemsIniciales.length === 0 ? (
        <EmptyState
          titulo="No hay recursos registrados"
          descripcion={
            puedeEditar
              ? "Agregá el primer recurso con su enlace de Google Drive."
              : "Todavía no se cargaron recursos."
          }
        />
      ) : (
        <div className="space-y-4">
          {itemsIniciales.map((r) => {
            const vigente = r.versiones.find((v) => v.vigente);
            const historicas = r.versiones.filter((v) => !v.vigente);
            const resp = r.responsableId ? mapaUsuarios.get(r.responsableId) : null;
            const abierto = verHistorico[r.id];
            return (
              <Card key={r.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <FileStack size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{r.nombre}</h3>
                        <Badge color="slate">{ETIQUETA_TIPO_RECURSO[r.tipo]}</Badge>
                      </div>
                      {r.queContiene && (
                        <p className="text-sm text-slate-500">{r.queContiene}</p>
                      )}
                      <p className="mt-0.5 text-xs text-slate-400">
                        Responsable: {resp ? nombreUsuario(resp) : "—"}
                      </p>
                    </div>
                  </div>
                  {puedeEditar && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditando(r);
                          setModal(true);
                        }}
                        className="text-slate-400 hover:text-brand-600"
                        title="Editar recurso"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => eliminarRecurso(r.id)}
                        className="text-slate-400 hover:text-red-600"
                        title="Eliminar recurso"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Versión vigente */}
                <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-green-600" />
                      <span className="text-sm font-medium text-slate-800">
                        {vigente ? `Vigente · ${vigente.version}` : "Sin versión vigente"}
                      </span>
                      {vigente?.creadoEn && (
                        <span className="text-xs text-slate-500">
                          {formatearFecha(vigente.creadoEn)}
                        </span>
                      )}
                    </div>
                    {vigente && (
                      <a
                        href={vigente.urlDrive}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
                      >
                        <ExternalLink size={14} /> Abrir en Drive
                      </a>
                    )}
                  </div>
                  {vigente?.nota && (
                    <p className="mt-1 text-xs text-slate-600">{vigente.nota}</p>
                  )}
                </div>

                {/* Acciones de versiones */}
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {puedeEditar && (
                    <button
                      onClick={() => setVersionPara(r)}
                      className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                    >
                      <Plus size={13} /> Agregar versión
                    </button>
                  )}
                  {historicas.length > 0 && (
                    <button
                      onClick={() =>
                        setVerHistorico((p) => ({ ...p, [r.id]: !p[r.id] }))
                      }
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:underline"
                    >
                      <History size={13} />
                      {abierto ? "Ocultar" : "Ver"} histórico ({historicas.length})
                    </button>
                  )}
                </div>

                {/* Histórico */}
                {abierto && historicas.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {historicas.map((v) => (
                      <div
                        key={v.id}
                        className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                      >
                        <Badge color="slate">{v.version}</Badge>
                        {v.creadoEn && (
                          <span className="text-xs text-slate-500">
                            {formatearFecha(v.creadoEn)}
                          </span>
                        )}
                        {v.nota && (
                          <span className="text-xs text-slate-500">· {v.nota}</span>
                        )}
                        <div className="ml-auto flex items-center gap-2">
                          <a
                            href={v.urlDrive}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                          >
                            <ExternalLink size={13} /> Abrir
                          </a>
                          {puedeEditar && (
                            <>
                              <button
                                onClick={() => marcarVigente(r.id, v.id)}
                                className="text-xs text-green-600 hover:underline"
                              >
                                Marcar vigente
                              </button>
                              <button
                                onClick={() => eliminarVersion(v.id)}
                                className="text-slate-400 hover:text-red-600"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {modal && (
        <RecursoModal
          recurso={editando}
          usuarios={usuarios}
          onCerrar={() => setModal(false)}
          onGuardado={() => {
            setModal(false);
            router.refresh();
          }}
        />
      )}

      {versionPara && (
        <VersionModal
          recurso={versionPara}
          onCerrar={() => setVersionPara(null)}
          onGuardado={() => {
            setVersionPara(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function RecursoModal({
  recurso,
  usuarios,
  onCerrar,
  onGuardado,
}: {
  recurso: RecursoUI | null;
  usuarios: UsuarioMin[];
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const [nombre, setNombre] = useState(recurso?.nombre ?? "");
  const [tipo, setTipo] = useState<TipoRecurso>(recurso?.tipo ?? "documento");
  const [queContiene, setQueContiene] = useState(recurso?.queContiene ?? "");
  const [responsableId, setResponsable] = useState(
    recurso?.responsableId?.toString() ?? ""
  );
  // Solo al crear: primera versión
  const [urlDrive, setUrl] = useState("");
  const [version, setVersion] = useState("v1");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const ta = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      const res = recurso
        ? await fetch("/api/recursos", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: recurso.id,
              nombre,
              tipo,
              queContiene,
              responsableId: responsableId || null,
            }),
          })
        : await fetch("/api/recursos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nombre,
              tipo,
              queContiene,
              responsableId: responsableId || null,
              urlDrive,
              version,
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
        className="my-8 w-full max-w-xl rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {recurso ? "Editar recurso" : "Nuevo recurso"}
          </h2>
          <button onClick={onCerrar} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={guardar} className="space-y-4 p-5">
          <div>
            <Label>Nombre *</Label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Base de dotación mensual"
              autoFocus
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Tipo</Label>
              <select
                className={ta}
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoRecurso)}
              >
                {TIPOS_RECURSO.map((t) => (
                  <option key={t} value={t}>
                    {ETIQUETA_TIPO_RECURSO[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Responsable</Label>
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
          </div>
          <div>
            <Label>Qué contiene</Label>
            <textarea
              className={ta}
              rows={2}
              value={queContiene}
              onChange={(e) => setQueContiene(e.target.value)}
              placeholder="Ej: Planta y contratos por servicio"
            />
          </div>

          {!recurso && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-xs font-medium text-slate-500">
                Primera versión (opcional, podés agregarla después)
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Label>Enlace de Google Drive</Label>
                  <Input
                    value={urlDrive}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                  />
                </div>
                <div>
                  <Label>Versión</Label>
                  <Input value={version} onChange={(e) => setVersion(e.target.value)} />
                </div>
              </div>
            </div>
          )}

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
              {guardando ? "Guardando..." : recurso ? "Guardar cambios" : "Crear recurso"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function VersionModal({
  recurso,
  onCerrar,
  onGuardado,
}: {
  recurso: RecursoUI;
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const [urlDrive, setUrl] = useState("");
  const [version, setVersion] = useState(`v${recurso.versiones.length + 1}`);
  const [nota, setNota] = useState("");
  const [vigente, setVigente] = useState(true);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      const res = await fetch("/api/recursos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "agregar_version",
          recursoId: recurso.id,
          urlDrive,
          version,
          nota,
          vigente,
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
        className="my-8 w-full max-w-md rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Nueva versión de {recurso.nombre}
          </h2>
          <button onClick={onCerrar} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={guardar} className="space-y-4 p-5">
          <div>
            <Label>Enlace de Google Drive *</Label>
            <Input
              value={urlDrive}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              autoFocus
              required
            />
          </div>
          <div>
            <Label>Versión</Label>
            <Input value={version} onChange={(e) => setVersion(e.target.value)} />
          </div>
          <div>
            <Label>Nota (opcional)</Label>
            <Input
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ej: Corte septiembre, agregadas guardias"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={vigente}
              onChange={(e) => setVigente(e.target.checked)}
            />
            Marcar esta versión como vigente (la anterior pasa a histórico)
          </label>
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
              {guardando ? "Guardando..." : "Agregar versión"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
