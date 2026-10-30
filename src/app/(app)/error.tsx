"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error en la página:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertTriangle size={24} />
        </div>
        <h1 className="text-lg font-semibold text-slate-900">
          Algo salió mal
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Ocurrió un error al cargar esta sección. Puede ser un problema temporal
          de conexión con la base de datos.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={() => reset()}>Reintentar</Button>
          <Button variant="secondary" onClick={() => (window.location.href = "/")}>
            Ir al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
