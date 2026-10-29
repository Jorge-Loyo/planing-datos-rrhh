# Planing Datos RRHH — convenciones del proyecto

Tablero de control de actividades para el equipo de Datos RRHH (área del GCBA).

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS (tema con color `brand`)
- Neon Postgres + Drizzle ORM (schema en `src/db/schema.ts`)
- Auth propia: CUIL + contraseña, sesión en cookie JWT (`jose`), hashing con bcryptjs
- Deploy en Vercel

## Convenciones

- Todo en español: UI, nombres de tablas/columnas, mensajes, comentarios.
- Rutas internas bajo el route group `src/app/(app)/` (requieren sesión, tienen sidebar).
- Las APIs van en `src/app/api/<recurso>/route.ts`.
- Validar permisos SIEMPRE en el servidor (no alcanza con ocultar el menú).
  Usar los helpers de `src/lib/permisos.ts`.
- Componentes UI reutilizables en `src/components/ui.tsx`.
- Fechas: usar helpers de `src/lib/utils.ts` (formatearFecha, diasRestantes).

## Roles (jerarquía)

admin > lider > miembro > consulta

- admin: todo + gestión de usuarios y config.
- lider: todo lo funcional + vista "Carga del equipo" + coordinar (reasignar, priorizar).
- miembro: crea/edita tareas, backlog, reuniones, conceptos, archivos.
- consulta: solo lectura.

## Red corporativa

Proxy con inspección TLS. `.npmrc` tiene `strict-ssl=false`. Para scripts que
conectan a Neon, anteponer `NODE_TLS_REJECT_UNAUTHORIZED=0` si aparece
`UNABLE_TO_VERIFY_LEAF_SIGNATURE`. No commitear secretos (.env.local está en .gitignore).

## Etapas

1. (hecha) Base: login, roles, perfil, admin de usuarios, estructura de páginas.
2. (hecha) Kanban/Planner (drag&drop HTML5 nativo) + Backlog (con promover a tarea) + Prioridades (afiche máx 5) + Carga del equipo.
3. Reuniones + Conceptos + Definición de terminado.
4. Archivos (Drive con versiones) + Equipo + Dashboard con datos reales.

## Notas de implementación

- Drag & drop del Kanban: API nativa de HTML5 (sin librerías), por la red corporativa que complica npm. API en `/api/tareas` y `/api/tareas/mover`.
- Etiquetas/estados centralizados en `src/lib/dominio.ts`. Helpers de datos en `src/lib/consultas.ts`.
- Dev local corre en el puerto 3100 (el 3000 lo ocupa wslrelay.exe de WSL).
- Para correr: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx next dev -p 3100`.

## Modelo de datos (resumen)

usuarios, backlog, prioridades, tareas, reuniones, conceptos, tipos_entregable,
criterios_terminado, recursos, versiones_recurso. Ver `src/db/schema.ts`.
