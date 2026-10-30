-- Índices de rendimiento (foreign keys y columnas filtradas con frecuencia).
-- Idempotente: se puede ejecutar varias veces sin problema.
-- Aplicar con: psql <DATABASE_URL> -f drizzle/indices-rendimiento.sql
-- o con el script scripts/crear-indices.mjs (si se conserva).

create index if not exists idx_tareas_estado on tareas (estado);
create index if not exists idx_tareas_responsable on tareas (responsable_id);
create index if not exists idx_tareas_backlog on tareas (backlog_id);
create index if not exists idx_backlog_estado on backlog (estado);
create index if not exists idx_pedidos_asignado on pedidos (asignado_id);
create index if not exists idx_pedidos_estado on pedidos (estado);
create index if not exists idx_fijas_activa on tareas_fijas (activa);
create index if not exists idx_fijas_responsable on tareas_fijas (responsable_id);
create index if not exists idx_prioridades_activa on prioridades (activa);
create index if not exists idx_versiones_recurso on versiones_recurso (recurso_id);
create index if not exists idx_criterios_tipo on criterios_terminado (tipo_entregable_id);
create index if not exists idx_usuarios_activo on usuarios (activo);
