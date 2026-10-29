"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Card, Badge } from "@/components/ui";
import { ETIQUETA_ROL } from "@/lib/permisos";
import type { Rol } from "@/lib/auth";

interface UsuarioRow {
  id: number;
  cuil: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: Rol;
  activo: boolean;
}

const ROLES: Rol[] = ["admin", "lider", "miembro", "consulta"];

export function AdminUsuarios({ inicial }: { inicial: UsuarioRow[] }) {
  const router = useRouter();
  const [mostrarForm, setMostrarForm] = useState(false);
  const [cuil, setCuil] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<Rol>("miembro");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cuil, nombre, apellido, email, rol, password }),
    });
    const data = await res.json();
    if (res.ok) {
      setCuil("");
      setNombre("");
      setApellido("");
      setEmail("");
      setRol("miembro");
      setPassword("");
      setMostrarForm(false);
      router.refresh();
    } else {
      setMsg(data.error || "No se pudo crear el usuario.");
    }
  }

  async function cambiarRol(id: number, nuevoRol: Rol) {
    await fetch("/api/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, rol: nuevoRol }),
    });
    router.refresh();
  }

  async function toggleActivo(id: number, activo: boolean) {
    await fetch("/api/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, activo: !activo }),
    });
    router.refresh();
  }

  async function resetearPass(id: number) {
    const nueva = prompt("Nueva contraseña para este usuario (mínimo 8 caracteres):");
    if (!nueva) return;
    const res = await fetch("/api/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, nuevaPassword: nueva }),
    });
    const data = await res.json();
    alert(res.ok ? "Contraseña actualizada." : data.error || "Error.");
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setMostrarForm(!mostrarForm)}>
          {mostrarForm ? "Cancelar" : "Nuevo usuario"}
        </Button>
      </div>

      {mostrarForm && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Alta de usuario</h2>
          <form onSubmit={crear} className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>CUIL</Label>
              <Input value={cuil} onChange={(e) => setCuil(e.target.value)} required />
            </div>
            <div>
              <Label>Rol</Label>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                value={rol}
                onChange={(e) => setRol(e.target.value as Rol)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ETIQUETA_ROL[r]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Nombre</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div>
              <Label>Apellido</Label>
              <Input value={apellido} onChange={(e) => setApellido(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label>Contraseña inicial</Label>
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="mínimo 8 caracteres"
                required
              />
            </div>
            {msg && (
              <div className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {msg}
              </div>
            )}
            <div className="sm:col-span-2">
              <Button type="submit">Crear usuario</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-4 py-3 font-medium">CUIL</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {inicial.map((u) => (
              <tr key={u.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-mono text-xs">{u.cuil}</td>
                <td className="px-4 py-3">
                  {`${u.nombre} ${u.apellido}`.trim() || "—"}
                </td>
                <td className="px-4 py-3 text-slate-500">{u.email || "—"}</td>
                <td className="px-4 py-3">
                  <select
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                    value={u.rol}
                    onChange={(e) => cambiarRol(u.id, e.target.value as Rol)}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ETIQUETA_ROL[r]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  {u.activo ? (
                    <Badge color="green">Activo</Badge>
                  ) : (
                    <Badge color="red">Inactivo</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleActivo(u.id, u.activo)}
                      className="text-xs text-slate-600 hover:underline"
                    >
                      {u.activo ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      onClick={() => resetearPass(u.id)}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      Resetear clave
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
