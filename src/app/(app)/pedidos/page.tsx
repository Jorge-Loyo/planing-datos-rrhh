import { db } from "@/db";
import { pedidos } from "@/db/schema";
import { desc } from "drizzle-orm";
import { obtenerSesion } from "@/lib/auth";
import { puedeEditar } from "@/lib/permisos";
import { listarUsuariosActivos } from "@/lib/consultas";
import { PedidosUI, type PedidoUI } from "./PedidosUI";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;

  const [filas, usuarios] = await Promise.all([
    db.select().from(pedidos).orderBy(desc(pedidos.id)),
    listarUsuariosActivos(),
  ]);

  const items: PedidoUI[] = filas.map((p) => ({
    id: p.id,
    descripcion: p.descripcion,
    solicitanteId: p.solicitanteId,
    asignadoId: p.asignadoId,
    estado: p.estado,
    fechaPedido: p.fechaPedido,
    fechaNecesaria: p.fechaNecesaria,
    fechaResuelto: p.fechaResuelto,
    nota: p.nota ?? "",
  }));

  return (
    <PedidosUI
      itemsIniciales={items}
      usuarios={usuarios}
      puedeEditar={puedeEditar(sesion.rol)}
    />
  );
}
