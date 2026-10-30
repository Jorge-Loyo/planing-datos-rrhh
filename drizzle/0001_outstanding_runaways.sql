CREATE TYPE "public"."dia_semana" AS ENUM('lunes', 'martes', 'miercoles', 'jueves', 'viernes');--> statement-breakpoint
CREATE TABLE "tareas_fijas" (
	"id" serial PRIMARY KEY NOT NULL,
	"titulo" text NOT NULL,
	"descripcion" text DEFAULT '',
	"responsable_id" integer,
	"dia_semana" "dia_semana",
	"criterio_terminado" text DEFAULT '',
	"activa" boolean DEFAULT true NOT NULL,
	"creado_por_id" integer,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tareas_fijas" ADD CONSTRAINT "tareas_fijas_responsable_id_usuarios_id_fk" FOREIGN KEY ("responsable_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tareas_fijas" ADD CONSTRAINT "tareas_fijas_creado_por_id_usuarios_id_fk" FOREIGN KEY ("creado_por_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;