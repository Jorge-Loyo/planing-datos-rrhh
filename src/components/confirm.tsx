"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { Button } from "@/components/ui";
import { AlertTriangle } from "lucide-react";

interface OpcionesConfirm {
  titulo: string;
  mensaje?: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  peligro?: boolean; // botón rojo para acciones destructivas
}

type FnConfirmar = (opciones: OpcionesConfirm) => Promise<boolean>;

const ConfirmContext = createContext<FnConfirmar | null>(null);

// Hook para pedir confirmación: const confirmar = useConfirm(); if (await confirmar({...}))
export function useConfirm(): FnConfirmar {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm debe usarse dentro de <ConfirmProvider>");
  }
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<{
    opciones: OpcionesConfirm;
    resolver: (v: boolean) => void;
  } | null>(null);

  const confirmar = useCallback<FnConfirmar>((opciones) => {
    return new Promise<boolean>((resolve) => {
      setEstado({ opciones, resolver: resolve });
    });
  }, []);

  function responder(valor: boolean) {
    estado?.resolver(valor);
    setEstado(null);
  }

  return (
    <ConfirmContext.Provider value={confirmar}>
      {children}
      {estado && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onClick={() => responder(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div
                className={
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full " +
                  (estado.opciones.peligro
                    ? "bg-red-100 text-red-600"
                    : "bg-brand-50 text-brand-600")
                }
              >
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-slate-900">
                  {estado.opciones.titulo}
                </h3>
                {estado.opciones.mensaje && (
                  <p className="mt-1 text-sm text-slate-600">
                    {estado.opciones.mensaje}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => responder(false)}>
                {estado.opciones.textoCancelar ?? "Cancelar"}
              </Button>
              <Button
                variant={estado.opciones.peligro ? "danger" : "primary"}
                onClick={() => responder(true)}
                autoFocus
              >
                {estado.opciones.textoConfirmar ?? "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
