"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Card } from "@/components/ui";
import { ETIQUETA_ROL } from "@/lib/permisos";
import type { Rol } from "@/lib/auth";

export function PerfilForm({
  inicial,
}: {
  inicial: {
    cuil: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: Rol;
  };
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState(inicial.nombre);
  const [apellido, setApellido] = useState(inicial.apellido);
  const [email, setEmail] = useState(inicial.email);
  const [msgDatos, setMsgDatos] = useState("");

  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [msgPass, setMsgPass] = useState("");

  async function guardarDatos(e: React.FormEvent) {
    e.preventDefault();
    setMsgDatos("");
    const res = await fetch("/api/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, apellido, email }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsgDatos("Datos guardados correctamente.");
      router.refresh();
    } else {
      setMsgDatos(data.error || "No se pudo guardar.");
    }
  }

  async function cambiarPass(e: React.FormEvent) {
    e.preventDefault();
    setMsgPass("");
    if (nueva !== repetir) {
      setMsgPass("La nueva contraseña y su repetición no coinciden.");
      return;
    }
    const res = await fetch("/api/perfil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actual, nueva }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsgPass("Contraseña actualizada correctamente.");
      setActual("");
      setNueva("");
      setRepetir("");
    } else {
      setMsgPass(data.error || "No se pudo cambiar la contraseña.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Datos personales</h2>
        <form onSubmit={guardarDatos} className="space-y-4">
          <div>
            <Label>CUIL</Label>
            <Input value={inicial.cuil} disabled className="bg-slate-50" />
            <p className="mt-1 text-xs text-slate-500">
              El CUIL no se puede modificar. Rol actual: {ETIQUETA_ROL[inicial.rol]}.
            </p>
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
          {msgDatos && <p className="text-sm text-brand-700">{msgDatos}</p>}
          <Button type="submit">Guardar datos</Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Cambiar contraseña
        </h2>
        <form onSubmit={cambiarPass} className="space-y-4">
          <div>
            <Label>Contraseña actual</Label>
            <Input
              type="password"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
            />
          </div>
          <div>
            <Label>Nueva contraseña</Label>
            <Input
              type="password"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">Mínimo 8 caracteres.</p>
          </div>
          <div>
            <Label>Repetir nueva contraseña</Label>
            <Input
              type="password"
              value={repetir}
              onChange={(e) => setRepetir(e.target.value)}
            />
          </div>
          {msgPass && <p className="text-sm text-brand-700">{msgPass}</p>}
          <Button type="submit">Cambiar contraseña</Button>
        </form>
      </Card>
    </div>
  );
}
