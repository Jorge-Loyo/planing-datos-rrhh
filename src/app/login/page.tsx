"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Label, Card } from "@/components/ui";
import { LayoutDashboard } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [cuil, setCuil] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuil, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo iniciar sesión.");
        return;
      }
      const redirect = params.get("redirect") || "/";
      router.push(redirect);
      router.refresh();
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
            <LayoutDashboard size={24} />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Planing Datos RRHH</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tablero de control del equipo
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>CUIL</Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="20000000001"
              value={cuil}
              onChange={(e) => setCuil(e.target.value)}
              error={!!error}
              autoFocus
              required
            />
          </div>
          <div>
            <Label>Contraseña</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!error}
              required
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" cargando={cargando}>
            Ingresar
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
