import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Falta la variable de entorno DATABASE_URL. Copia .env.example a .env.local y pega tu connection string de Neon."
  );
}

const sql = neon(connectionString);

export const db = drizzle(sql, { schema });

export * as schema from "./schema";
