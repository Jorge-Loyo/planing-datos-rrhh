CREATE TYPE "public"."escala_amb" AS ENUM('alto', 'medio', 'bajo');--> statement-breakpoint
CREATE TYPE "public"."estado_backlog" AS ENUM('nuevo', 'a_evaluar', 'aprobado', 'descartado', 'promovido');--> statement-breakpoint
CREATE TYPE "public"."estado_tarea" AS ENUM('pendiente', 'en_curso', 'bloqueada', 'lista');--> statement-breakpoint
CREATE TYPE "public"."prioridad_tarea" AS ENUM('sin_prioridad', 'p1', 'p2', 'p3', 'p4', 'p5');--> statement-breakpoint
CREATE TYPE "public"."rol_usuario" AS ENUM('admin', 'lider', 'miembro', 'consulta');--> statement-breakpoint
CREATE TYPE "public"."tipo_recurso" AS ENUM('fuente', 'script', 'documento', 'manual', 'otro');--> statement-breakpoint
CREATE TABLE "backlog" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(20) NOT NULL,
	"pedido" text NOT NULL,
	"area_solicitante" varchar(200) DEFAULT '',
	"decision_que_apoya" text DEFAULT '',
	"impacto" "escala_amb",
	"esfuerzo" "escala_amb",
	"estado" "estado_backlog" DEFAULT 'nuevo' NOT NULL,
	"fecha_ingreso" date DEFAULT now() NOT NULL,
	"creado_por_id" integer,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "backlog_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "conceptos" (
	"id" serial PRIMARY KEY NOT NULL,
	"termino" varchar(200) NOT NULL,
	"definicion" text DEFAULT '',
	"fuente_dato" text DEFAULT '',
	"formula_calculo" text DEFAULT '',
	"responsable_id" integer,
	"ultima_actualizacion" date,
	"creado_por_id" integer,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "criterios_terminado" (
	"id" serial PRIMARY KEY NOT NULL,
	"tipo_entregable_id" integer NOT NULL,
	"criterio" text NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prioridades" (
	"id" serial PRIMARY KEY NOT NULL,
	"nivel" "prioridad_tarea" NOT NULL,
	"que_es" text NOT NULL,
	"por_que_importa" text DEFAULT '',
	"responsable_id" integer,
	"fecha_estimada" date,
	"activa" boolean DEFAULT true NOT NULL,
	"creado_por_id" integer,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recursos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(250) NOT NULL,
	"tipo" "tipo_recurso" DEFAULT 'documento' NOT NULL,
	"que_contiene" text DEFAULT '',
	"responsable_id" integer,
	"creado_por_id" integer,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reuniones" (
	"id" serial PRIMARY KEY NOT NULL,
	"titulo" varchar(200) NOT NULL,
	"fecha" date NOT NULL,
	"avances" text DEFAULT '',
	"bloqueos" text DEFAULT '',
	"foco_semana" text DEFAULT '',
	"acuerdos" text DEFAULT '',
	"participantes" text DEFAULT '',
	"creado_por_id" integer,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tareas" (
	"id" serial PRIMARY KEY NOT NULL,
	"titulo" text NOT NULL,
	"descripcion" text DEFAULT '',
	"estado" "estado_tarea" DEFAULT 'pendiente' NOT NULL,
	"prioridad" "prioridad_tarea" DEFAULT 'sin_prioridad' NOT NULL,
	"responsable_id" integer,
	"segunda_persona_id" integer,
	"fecha_inicio" date,
	"fecha_limite" date,
	"criterio_terminado" text DEFAULT '',
	"observaciones" text DEFAULT '',
	"backlog_id" integer,
	"prioridad_id" integer,
	"orden" integer DEFAULT 0 NOT NULL,
	"creado_por_id" integer,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tipos_entregable" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(150) NOT NULL,
	"descripcion" text DEFAULT '',
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"cuil" varchar(20) NOT NULL,
	"password_hash" text NOT NULL,
	"nombre" varchar(120) DEFAULT '' NOT NULL,
	"apellido" varchar(120) DEFAULT '' NOT NULL,
	"email" varchar(200) DEFAULT '' NOT NULL,
	"rol" "rol_usuario" DEFAULT 'miembro' NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_cuil_unique" UNIQUE("cuil")
);
--> statement-breakpoint
CREATE TABLE "versiones_recurso" (
	"id" serial PRIMARY KEY NOT NULL,
	"recurso_id" integer NOT NULL,
	"version" varchar(50) DEFAULT 'v1' NOT NULL,
	"url_drive" text NOT NULL,
	"nota" text DEFAULT '',
	"vigente" boolean DEFAULT false NOT NULL,
	"subido_por_id" integer,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "backlog" ADD CONSTRAINT "backlog_creado_por_id_usuarios_id_fk" FOREIGN KEY ("creado_por_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conceptos" ADD CONSTRAINT "conceptos_responsable_id_usuarios_id_fk" FOREIGN KEY ("responsable_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conceptos" ADD CONSTRAINT "conceptos_creado_por_id_usuarios_id_fk" FOREIGN KEY ("creado_por_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "criterios_terminado" ADD CONSTRAINT "criterios_terminado_tipo_entregable_id_tipos_entregable_id_fk" FOREIGN KEY ("tipo_entregable_id") REFERENCES "public"."tipos_entregable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prioridades" ADD CONSTRAINT "prioridades_responsable_id_usuarios_id_fk" FOREIGN KEY ("responsable_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prioridades" ADD CONSTRAINT "prioridades_creado_por_id_usuarios_id_fk" FOREIGN KEY ("creado_por_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recursos" ADD CONSTRAINT "recursos_responsable_id_usuarios_id_fk" FOREIGN KEY ("responsable_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recursos" ADD CONSTRAINT "recursos_creado_por_id_usuarios_id_fk" FOREIGN KEY ("creado_por_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reuniones" ADD CONSTRAINT "reuniones_creado_por_id_usuarios_id_fk" FOREIGN KEY ("creado_por_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_responsable_id_usuarios_id_fk" FOREIGN KEY ("responsable_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_segunda_persona_id_usuarios_id_fk" FOREIGN KEY ("segunda_persona_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_backlog_id_backlog_id_fk" FOREIGN KEY ("backlog_id") REFERENCES "public"."backlog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_prioridad_id_prioridades_id_fk" FOREIGN KEY ("prioridad_id") REFERENCES "public"."prioridades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_creado_por_id_usuarios_id_fk" FOREIGN KEY ("creado_por_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "versiones_recurso" ADD CONSTRAINT "versiones_recurso_recurso_id_recursos_id_fk" FOREIGN KEY ("recurso_id") REFERENCES "public"."recursos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "versiones_recurso" ADD CONSTRAINT "versiones_recurso_subido_por_id_usuarios_id_fk" FOREIGN KEY ("subido_por_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;