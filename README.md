# Planing Datos RRHH

Tablero de control de actividades para el equipo de Datos RRHH. Permite gestionar
tareas (Kanban/Planner), backlog de pedidos, prioridades del período, reuniones,
glosario de conceptos, definición de terminado y un repositorio de archivos
(enlaces a Google Drive con control de versiones).

## Stack

- **Next.js 15** (App Router) + React 19 + TypeScript
- **Tailwind CSS** para estilos
- **Neon Postgres** como base de datos
- **Drizzle ORM** para el acceso a datos
- Autenticación propia con **CUIL + contraseña** (sesión en cookie JWT, `jose`)
- Deploy pensado para **Vercel**

## Roles

| Rol               | Permisos                                                       |
| ----------------- | -------------------------------------------------------------- |
| **Administrador** | Todo + gestión de usuarios y configuración                     |
| **Líder**         | Todo lo funcional + vista de "Carga del equipo" y coordinación |
| **Miembro**       | Crea y edita tareas, backlog, reuniones, conceptos, archivos   |
| **Consulta**      | Solo lectura                                                   |

## Puesta en marcha (local)

1. **Instalar dependencias**

   ```bash
   npm install
   ```

2. **Configurar variables de entorno**

   Copiá `.env.example` a `.env.local` y completá:

   ```
   DATABASE_URL="postgresql://...(tu connection string pooled de Neon)..."
   AUTH_SECRET="una-cadena-larga-y-aleatoria"
   ```

   - El `DATABASE_URL` lo sacás del panel de Neon → _Connection Details_.
     Usá la cadena **pooled** (incluye `-pooler` en el host).
   - Para `AUTH_SECRET` podés generar uno con: `openssl rand -base64 32`

3. **Crear las tablas en la base**

   ```bash
   npm run db:generate   # genera la migración SQL a partir del schema
   npm run db:migrate    # la aplica en Neon
   ```

   > Alternativa rápida en desarrollo: `npm run db:push` (sincroniza el schema
   > directo sin generar archivos de migración).

4. **Crear el usuario administrador inicial**

   ```bash
   npm run db:seed
   ```

   Crea un admin con:
   - CUIL: `20000000001`
   - Contraseña: `admin1234`

   Podés personalizarlo con variables `SEED_ADMIN_CUIL` y `SEED_ADMIN_PASS`.
   **Cambiá la contraseña desde "Mi perfil" después del primer ingreso.**

5. **Levantar la app**

   ```bash
   npm run dev
   ```

   Abrí http://localhost:3000 e ingresá con el admin.
   Desde **Administración** das de alta al resto del equipo.

## Deploy en Vercel

1. Subí el proyecto a un repositorio de Git (GitHub/GitLab).
2. En Vercel, _Add New Project_ → importá el repo.
3. En _Settings → Environment Variables_ cargá `DATABASE_URL` y `AUTH_SECRET`
   (los mismos valores que en `.env.local`, apuntando a tu base de Neon).
4. Deploy. Vercel detecta Next.js automáticamente.
5. La primera vez, corré las migraciones y el seed contra la base de Neon
   (podés hacerlo desde tu máquina con el `.env.local` apuntando a la misma base).

## Nota importante: red corporativa (TLS)

Esta máquina está detrás de un proxy corporativo que inspecciona el tráfico TLS
y reemplaza el certificado de los servidores. Por eso `npm install` fallaba con
`UNABLE_TO_VERIFY_LEAF_SIGNATURE` y quedaba colgado.

Solución aplicada (temporal): el archivo `.npmrc` del proyecto incluye
`strict-ssl=false` para que npm pueda instalar. Para los comandos de base de
datos que conectan a Neon, si aparece el mismo error, anteponé la variable:

```bash
# Linux/Mac/Git-Bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npm run db:migrate

# PowerShell
$env:NODE_TLS_REJECT_UNAUTHORIZED=0; npm run db:migrate
```

**Solución recomendada y segura** (hablar con el área de sistemas): obtené el
certificado de la CA interna (`.crt`) y configurá la variable de entorno del
sistema `NODE_EXTRA_CA_CERTS` apuntando a ese archivo. Con eso podés quitar
`strict-ssl=false` del `.npmrc` y no necesitás desactivar la verificación TLS.

> En Vercel este problema no existe: el build corre en su infraestructura, no en
> la red corporativa.

## Estructura del proyecto

```
src/
  app/
    (app)/              Páginas internas (requieren sesión) con sidebar
      page.tsx          Dashboard
      kanban/           Kanban / Planner
      backlog/          Backlog
      prioridades/      Afiche de prioridades
      reuniones/        Reuniones semanales
      conceptos/        Tabla de conceptos
      definicion-terminado/
      archivos/         Conocimiento compartido (Drive)
      equipo/           Integrantes
      carga-equipo/     Vista de coordinación (líder+)
      admin/            Gestión de usuarios (admin)
      perfil/           Mi perfil (datos + contraseña)
    api/                Endpoints (auth, perfil, usuarios, ...)
    login/              Página de login
  components/           UI reutilizable y navegación
  db/                   Schema, conexión, migración y seed (Drizzle)
  lib/                  auth, permisos, utilidades
```

## Etapas de construcción

- **Etapa 1 (actual):** base del proyecto, login, roles, perfil, administración de
  usuarios y estructura de todas las páginas.
- **Etapa 2:** Kanban/Planner + Backlog + Prioridades + Carga del equipo.
- **Etapa 3:** Reuniones + Conceptos + Definición de terminado.
- **Etapa 4:** Archivos (Drive con versiones) + Equipo + Dashboard con datos reales.
