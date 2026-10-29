"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Rol } from "@/lib/auth";
import { ETIQUETA_ROL, puedeCoordinar, puedeAdministrar } from "@/lib/permisos";
import {
  LayoutDashboard,
  KanbanSquare,
  Inbox,
  Flag,
  CalendarDays,
  BookOpen,
  CheckSquare,
  FolderOpen,
  Users,
  UsersRound,
  Settings,
  LogOut,
  User as UserIcon,
  Menu,
  X,
} from "lucide-react";

interface ItemNav {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  minimoCoordinar?: boolean;
  minimoAdmin?: boolean;
}

const ITEMS: ItemNav[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/kanban", label: "Kanban / Planner", icon: KanbanSquare },
  { href: "/backlog", label: "Backlog", icon: Inbox },
  { href: "/prioridades", label: "Prioridades", icon: Flag },
  { href: "/reuniones", label: "Reuniones", icon: CalendarDays },
  { href: "/conceptos", label: "Conceptos", icon: BookOpen },
  { href: "/definicion-terminado", label: "Definición de terminado", icon: CheckSquare },
  { href: "/archivos", label: "Archivos", icon: FolderOpen },
  { href: "/equipo", label: "Equipo", icon: Users },
  { href: "/carga-equipo", label: "Carga del equipo", icon: UsersRound, minimoCoordinar: true },
  { href: "/admin", label: "Administración", icon: Settings, minimoAdmin: true },
];

export function Sidebar({
  usuario,
}: {
  usuario: { nombre: string; apellido: string; rol: Rol };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);

  const visibles = ITEMS.filter((item) => {
    if (item.minimoAdmin) return puedeAdministrar(usuario.rol);
    if (item.minimoCoordinar) return puedeCoordinar(usuario.rol);
    return true;
  });

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const nombreCompleto =
    `${usuario.nombre} ${usuario.apellido}`.trim() || "Usuario";

  return (
    <>
      {/* Barra superior mobile */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <span className="font-semibold text-slate-900">Planing Datos RRHH</span>
        <button onClick={() => setAbierto(!abierto)} className="text-slate-600">
          {abierto ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform md:static md:translate-x-0",
          abierto ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="hidden items-center gap-2 border-b border-slate-200 px-5 py-4 md:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <LayoutDashboard size={18} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-900">Planing</div>
            <div className="text-xs text-slate-500">Datos RRHH</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {visibles.map((item) => {
            const activo =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setAbierto(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                  activo
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <Link
            href="/perfil"
            onClick={() => setAbierto(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600">
              <UserIcon size={16} />
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-medium text-slate-900">
                {nombreCompleto}
              </div>
              <div className="text-xs text-slate-500">
                {ETIQUETA_ROL[usuario.rol]}
              </div>
            </div>
          </Link>
          <button
            onClick={logout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {abierto && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={() => setAbierto(false)}
        />
      )}
    </>
  );
}
