// Etiquetas y constantes del dominio (estados, prioridades, escalas).
// Centralizado para que UI y validaciones usen los mismos valores.

export const ESTADOS_TAREA = [
  "pendiente",
  "en_curso",
  "bloqueada",
  "lista",
] as const;
export type EstadoTarea = (typeof ESTADOS_TAREA)[number];

export const ETIQUETA_ESTADO: Record<EstadoTarea, string> = {
  pendiente: "Pendiente",
  en_curso: "En curso",
  bloqueada: "Bloqueada",
  lista: "Lista",
};

// Color de badge por estado (coincide con los colores de components/ui Badge)
export const COLOR_ESTADO: Record<
  EstadoTarea,
  "slate" | "blue" | "green" | "yellow" | "red"
> = {
  pendiente: "slate",
  en_curso: "blue",
  bloqueada: "red",
  lista: "green",
};

export const PRIORIDADES = [
  "sin_prioridad",
  "p1",
  "p2",
  "p3",
  "p4",
  "p5",
] as const;
export type PrioridadTarea = (typeof PRIORIDADES)[number];

export const ETIQUETA_PRIORIDAD: Record<PrioridadTarea, string> = {
  sin_prioridad: "Sin prioridad",
  p1: "Prioridad 1",
  p2: "Prioridad 2",
  p3: "Prioridad 3",
  p4: "Prioridad 4",
  p5: "Prioridad 5",
};

// Niveles de prioridad reales del afiche (sin "sin_prioridad")
export const NIVELES_AFICHE = ["p1", "p2", "p3", "p4", "p5"] as const;
export type NivelAfiche = (typeof NIVELES_AFICHE)[number];

export const ESCALAS = ["alto", "medio", "bajo"] as const;
export type Escala = (typeof ESCALAS)[number];

export const ETIQUETA_ESCALA: Record<Escala, string> = {
  alto: "Alto",
  medio: "Medio",
  bajo: "Bajo",
};

export const ESTADOS_BACKLOG = [
  "nuevo",
  "a_evaluar",
  "aprobado",
  "descartado",
  "promovido",
] as const;
export type EstadoBacklog = (typeof ESTADOS_BACKLOG)[number];

export const ETIQUETA_ESTADO_BACKLOG: Record<EstadoBacklog, string> = {
  nuevo: "Nuevo",
  a_evaluar: "A evaluar",
  aprobado: "Aprobado",
  descartado: "Descartado",
  promovido: "Promovido a tarea",
};

export const COLOR_ESTADO_BACKLOG: Record<
  EstadoBacklog,
  "slate" | "blue" | "green" | "yellow" | "red"
> = {
  nuevo: "slate",
  a_evaluar: "yellow",
  aprobado: "blue",
  descartado: "red",
  promovido: "green",
};

export const TIPOS_RECURSO = [
  "fuente",
  "script",
  "documento",
  "manual",
  "otro",
] as const;
export type TipoRecurso = (typeof TIPOS_RECURSO)[number];

export const ETIQUETA_TIPO_RECURSO: Record<TipoRecurso, string> = {
  fuente: "Fuente",
  script: "Script",
  documento: "Documento",
  manual: "Manual",
  otro: "Otro",
};
