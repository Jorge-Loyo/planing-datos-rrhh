import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth";
import { Sidebar } from "@/components/nav";
import { ConfirmProvider } from "@/components/confirm";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    redirect("/login");
  }

  return (
    <ConfirmProvider>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar
          usuario={{
            nombre: sesion.nombre,
            apellido: sesion.apellido,
            rol: sesion.rol,
          }}
        />
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-7xl p-4 md:p-8">{children}</div>
        </main>
      </div>
    </ConfirmProvider>
  );
}
