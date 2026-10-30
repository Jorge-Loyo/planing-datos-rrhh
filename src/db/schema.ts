import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

// Roles del sistema. admin > lider > miembro > consulta
export const rolUsuarioEnum = pgEnum("rol_usuario", [
  "admin",
  "lider",
  "miembro",
  "consulta",
]);

// Estados del Kanban / Planner
export const estadoTareaEnum = pgEnum("estado_tarea", [
  "pendiente",
  "en_curso",
  "bloqueada",
  "lista",
]);

// Prioridad del afiche (1 a 5) + sin prioridad
export const prioridadEnum = pgEnum("prioridad_tarea", [
  "sin_prioridad",
  "p1",
  "p2",
  "p3",
  "p4",
  "p5",
]);

// Escalas Alto / Medio / Bajo para el backlog
export const escalaEnum = pgEnum("escala_amb", ["alto", "medio", "bajo"]);

// Estado del item de backlog
export const estadoBacklogEnum = pgEnum("estado_backlog", [
  "nuevo",
  "a_evaluar",
  "aprobado",
  "descartado",
  "promovido",
]);

// ---------------------------------------------------------------------------
// Usuarios
// ---------------------------------------------------------------------------

export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  cuil: varchar("cuil", { length: 20 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nombre: varchar("nombre", { length: 120 }).notNull().default(""),
  apellido: varchar("apellido", { length: 120 }).notNull().default(""),
  email: varchar("email", { length: 200 }).notNull().default(""),
  rol: rolUsuarioEnum("rol").notNull().default("miembro"),
  activo: boolean("activo").notNull().default(true),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  actualizadoEn: timestamp("actualizado_en", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Backlog (deposito de pedidos / ideas)
// ---------------------------------------------------------------------------

export const backlog = pgTable("backlog", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 20 }).notNull().unique(), // B-001
  pedido: text("pedido").notNull(),
  areaSolicitante: varchar("area_solicitante", { length: 200 }).default(""),
  decisionQueApoya: text("decision_que_apoya").default(""),
  impacto: escalaEnum("impacto"),
  esfuerzo: escalaEnum("esfuerzo"),
  estado: estadoBacklogEnum("estado").notNull().default("nuevo"),
  fechaIngreso: date("fecha_ingreso").notNull().defaultNow(),
  creadoPorId: integer("creado_por_id").references(() => usuarios.id),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  actualizadoEn: timestamp("actualizado_en", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Prioridades (Afiche de prioridades, maximo 5)
// ---------------------------------------------------------------------------

export const prioridades = pgTable("prioridades", {
  id: serial("id").primaryKey(),
  nivel: prioridadEnum("nivel").notNull(), // p1..p5
  queEs: text("que_es").notNull(),
  porQueImporta: text("por_que_importa").default(""),
  responsableId: integer("responsable_id").references(() => usuarios.id),
  fechaEstimada: date("fecha_estimada"),
  activa: boolean("activa").notNull().default(true),
  creadoPorId: integer("creado_por_id").references(() => usuarios.id),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  actualizadoEn: timestamp("actualizado_en", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Tareas (Planner / Kanban)
// ---------------------------------------------------------------------------

export const tareas = pgTable("tareas", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  descripcion: text("descripcion").default(""),
  estado: estadoTareaEnum("estado").notNull().default("pendiente"),
  prioridad: prioridadEnum("prioridad").notNull().default("sin_prioridad"),
  responsableId: integer("responsable_id").references(() => usuarios.id),
  segundaPersonaId: integer("segunda_persona_id").references(() => usuarios.id),
  fechaInicio: date("fecha_inicio"),
  fechaLimite: date("fecha_limite"),
  criterioTerminado: text("criterio_terminado").default(""),
  observaciones: text("observaciones").default(""),
  // Origen opcional: si la tarea nacio de un item de backlog o de una prioridad
  backlogId: integer("backlog_id").references(() => backlog.id),
  prioridadId: integer("prioridad_id").references(() => prioridades.id),
  // Orden dentro de la columna del kanban
  orden: integer("orden").notNull().default(0),
  creadoPorId: integer("creado_por_id").references(() => usuarios.id),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  actualizadoEn: timestamp("actualizado_en", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Reuniones (semanales)
// ---------------------------------------------------------------------------

export const reuniones = pgTable("reuniones", {
  id: serial("id").primaryKey(),
  titulo: varchar("titulo", { length: 200 }).notNull(),
  fecha: date("fecha").notNull(),
  avances: text("avances").default(""),
  bloqueos: text("bloqueos").default(""),
  focoSemana: text("foco_semana").default(""),
  acuerdos: text("acuerdos").default(""),
  participantes: text("participantes").default(""), // lista libre separada por comas
  creadoPorId: integer("creado_por_id").references(() => usuarios.id),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  actualizadoEn: timestamp("actualizado_en", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Tabla de conceptos (glosario)
// ---------------------------------------------------------------------------

export const conceptos = pgTable("conceptos", {
  id: serial("id").primaryKey(),
  termino: varchar("termino", { length: 200 }).notNull(),
  definicion: text("definicion").default(""),
  fuenteDato: text("fuente_dato").default(""),
  formulaCalculo: text("formula_calculo").default(""),
  responsableId: integer("responsable_id").references(() => usuarios.id),
  ultimaActualizacion: date("ultima_actualizacion"),
  creadoPorId: integer("creado_por_id").references(() => usuarios.id),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  actualizadoEn: timestamp("actualizado_en", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Definicion de terminado: tipos de entregable + criterios (checklist)
// ---------------------------------------------------------------------------

export const tiposEntregable = pgTable("tipos_entregable", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 150 }).notNull(), // Dashboard, Automatizacion, Reporte...
  descripcion: text("descripcion").default(""),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
});

export const criteriosTerminado = pgTable("criterios_terminado", {
  id: serial("id").primaryKey(),
  tipoEntregableId: integer("tipo_entregable_id")
    .notNull()
    .references(() => tiposEntregable.id, { onDelete: "cascade" }),
  criterio: text("criterio").notNull(),
  orden: integer("orden").notNull().default(0),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Archivos / Conocimiento compartido (links de Drive con versiones)
// ---------------------------------------------------------------------------

export const tipoRecursoEnum = pgEnum("tipo_recurso", [
  "fuente",
  "script",
  "documento",
  "manual",
  "otro",
]);

export const recursos = pgTable("recursos", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 250 }).notNull(),
  tipo: tipoRecursoEnum("tipo").notNull().default("documento"),
  queContiene: text("que_contiene").default(""),
  responsableId: integer("responsable_id").references(() => usuarios.id),
  creadoPorId: integer("creado_por_id").references(() => usuarios.id),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  actualizadoEn: timestamp("actualizado_en", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Cada recurso tiene N versiones; una es la vigente, el resto historico.
export const versionesRecurso = pgTable("versiones_recurso", {
  id: serial("id").primaryKey(),
  recursoId: integer("recurso_id")
    .notNull()
    .references(() => recursos.id, { onDelete: "cascade" }),
  version: varchar("version", { length: 50 }).notNull().default("v1"),
  urlDrive: text("url_drive").notNull(),
  nota: text("nota").default(""),
  vigente: boolean("vigente").notNull().default(false),
  subidoPorId: integer("subido_por_id").references(() => usuarios.id),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Tareas fijas semanales (plantillas que se generan cada semana)
// ---------------------------------------------------------------------------

export const diaSemanaEnum = pgEnum("dia_semana", [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
]);

export const tareasFijas = pgTable("tareas_fijas", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  descripcion: text("descripcion").default(""),
  responsableId: integer("responsable_id").references(() => usuarios.id),
  diaSemana: diaSemanaEnum("dia_semana"),
  criterioTerminado: text("criterio_terminado").default(""),
  activa: boolean("activa").notNull().default(true),
  creadoPorId: integer("creado_por_id").references(() => usuarios.id),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Pedidos: solicitudes emergentes que se le hacen a un integrante
// ---------------------------------------------------------------------------

export const estadoPedidoEnum = pgEnum("estado_pedido", [
  "pendiente",
  "en_proceso",
  "resuelto",
]);

export const pedidos = pgTable("pedidos", {
  id: serial("id").primaryKey(),
  descripcion: text("descripcion").notNull(),
  solicitanteId: integer("solicitante_id").references(() => usuarios.id),
  asignadoId: integer("asignado_id").references(() => usuarios.id),
  estado: estadoPedidoEnum("estado").notNull().default("pendiente"),
  fechaPedido: date("fecha_pedido").notNull().defaultNow(),
  fechaNecesaria: date("fecha_necesaria"),
  fechaResuelto: date("fecha_resuelto"),
  // Vínculo opcional a una tarea del Kanban (si el pedido deriva en una actividad)
  tareaId: integer("tarea_id").references(() => tareas.id),
  nota: text("nota").default(""),
  creadoPorId: integer("creado_por_id").references(() => usuarios.id),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  actualizadoEn: timestamp("actualizado_en", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Relaciones (para consultas con joins comodos)
// ---------------------------------------------------------------------------

export const usuariosRelations = relations(usuarios, ({ many }) => ({
  tareasResponsable: many(tareas),
}));

export const tareasRelations = relations(tareas, ({ one }) => ({
  responsable: one(usuarios, {
    fields: [tareas.responsableId],
    references: [usuarios.id],
  }),
  segundaPersona: one(usuarios, {
    fields: [tareas.segundaPersonaId],
    references: [usuarios.id],
  }),
  backlog: one(backlog, {
    fields: [tareas.backlogId],
    references: [backlog.id],
  }),
  prioridad: one(prioridades, {
    fields: [tareas.prioridadId],
    references: [prioridades.id],
  }),
}));

export const recursosRelations = relations(recursos, ({ many, one }) => ({
  versiones: many(versionesRecurso),
  responsable: one(usuarios, {
    fields: [recursos.responsableId],
    references: [usuarios.id],
  }),
}));

export const versionesRecursoRelations = relations(versionesRecurso, ({ one }) => ({
  recurso: one(recursos, {
    fields: [versionesRecurso.recursoId],
    references: [recursos.id],
  }),
}));

export const criteriosRelations = relations(criteriosTerminado, ({ one }) => ({
  tipoEntregable: one(tiposEntregable, {
    fields: [criteriosTerminado.tipoEntregableId],
    references: [tiposEntregable.id],
  }),
}));

export const tiposEntregableRelations = relations(tiposEntregable, ({ many }) => ({
  criterios: many(criteriosTerminado),
}));

// ---------------------------------------------------------------------------
// Tipos inferidos
// ---------------------------------------------------------------------------

export type Usuario = typeof usuarios.$inferSelect;
export type NuevoUsuario = typeof usuarios.$inferInsert;
export type Tarea = typeof tareas.$inferSelect;
export type NuevaTarea = typeof tareas.$inferInsert;
export type ItemBacklog = typeof backlog.$inferSelect;
export type Prioridad = typeof prioridades.$inferSelect;
export type Reunion = typeof reuniones.$inferSelect;
export type Concepto = typeof conceptos.$inferSelect;
export type Recurso = typeof recursos.$inferSelect;
export type VersionRecurso = typeof versionesRecurso.$inferSelect;
export type TipoEntregable = typeof tiposEntregable.$inferSelect;
export type CriterioTerminado = typeof criteriosTerminado.$inferSelect;
export type TareaFija = typeof tareasFijas.$inferSelect;
export type Pedido = typeof pedidos.$inferSelect;
