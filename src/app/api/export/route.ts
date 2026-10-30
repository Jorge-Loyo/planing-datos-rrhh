import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { backlog, pedidos, tareas, usuarios } from "@/db/schema";
import { obtenerSesion } from "@/lib/auth";
import {
  ETIQUETA_ESTADO,
  ETIQUETA_ESTADO_BACKLOG,
  ETIQUETA_ESTADO_PEDIDO,
} from "@/lib/dominio";

// Convierte filas a CSV (separador ; para que Excel en es-AR lo abra en columnas)
function aCSV(cabeceras: string[], filas: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lineas = [cabeceras.join(";")];
  for (const f of filas) lineas.push(f.map(esc).join(";"));
  // BOM para que Excel detecte UTF-8 (acentos)
  return "\ufeff" + lineas.join("\r\n");
}

function nombre(u: { nombre: string; apellido: string; cuil: string } | undefined) {
  if (!u) return "";
  return `${u.nombre} ${u.apellido}`.trim() || u.cuil;
}

export async function GET(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  const tipo = new URL(req.url).searchParams.get("tipo") || "";

  const listaUsuarios = await db.select().from(usuarios);
  const mapaU = new Map(listaUsuarios.map((u) => [u.id, u]));

  let csv = "";
  let archivo = "export.csv";

  if (tipo === "pedidos") {
    const filas = await db.select().from(pedidos);
    csv = aCSV(
      ["Descripción", "Solicitante", "Asignado a", "Estado", "Fecha pedido", "Fecha necesaria", "Fecha resuelto", "Nota"],
      filas.map((p) => [
        p.descripcion,
        nombre(p.solicitanteId ? mapaU.get(p.solicitanteId) : undefined),
        nombre(p.asignadoId ? mapaU.get(p.asignadoId) : undefined),
        ETIQUETA_ESTADO_PEDIDO[p.estado],
        p.fechaPedido ?? "",
        p.fechaNecesaria ?? "",
        p.fechaResuelto ?? "",
        p.nota ?? "",
      ])
    );
    archivo = "pedidos.csv";
  } else if (tipo === "backlog") {
    const filas = await db.select().from(backlog);
    csv = aCSV(
      ["Código", "Pedido", "Área", "Impacto", "Esfuerzo", "Estado", "Fecha ingreso"],
      filas.map((b) => [
        b.codigo,
        b.pedido,
        b.areaSolicitante ?? "",
        b.impacto ?? "",
        b.esfuerzo ?? "",
        ETIQUETA_ESTADO_BACKLOG[b.estado],
        b.fechaIngreso ?? "",
      ])
    );
    archivo = "backlog.csv";
  } else if (tipo === "tareas") {
    const filas = await db.select().from(tareas);
    csv = aCSV(
      ["Título", "Estado", "Responsable", "Fecha inicio", "Fecha límite", "Criterio de terminado"],
      filas.map((t) => [
        t.titulo,
        ETIQUETA_ESTADO[t.estado],
        nombre(t.responsableId ? mapaU.get(t.responsableId) : undefined),
        t.fechaInicio ?? "",
        t.fechaLimite ?? "",
        t.criterioTerminado ?? "",
      ])
    );
    archivo = "tareas.csv";
  } else {
    return NextResponse.json(
      { error: "Tipo inválido. Use tipo=pedidos|backlog|tareas." },
      { status: 400 }
    );
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${archivo}"`,
    },
  });
}
