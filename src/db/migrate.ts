import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { migrate } from "drizzle-orm/neon-http/migrator";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Falta DATABASE_URL en .env.local");
  }
  const sql = neon(connectionString);
  const db = drizzle(sql);
  console.log("Aplicando migraciones...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migraciones aplicadas correctamente.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error al migrar:", err);
  process.exit(1);
});
