import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { usuarios } from "./schema";

// Crea un usuario administrador inicial para poder entrar la primera vez.
// La app arranca vacia: este es el unico dato precargado.
const ADMIN_CUIL = process.env.SEED_ADMIN_CUIL || "20000000001";
const ADMIN_PASS = process.env.SEED_ADMIN_PASS || "admin1234";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Falta DATABASE_URL en .env.local");
  }
  const sql = neon(connectionString);
  const db = drizzle(sql);

  const existente = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.cuil, ADMIN_CUIL));

  if (existente.length > 0) {
    console.log(`El usuario admin (CUIL ${ADMIN_CUIL}) ya existe. Nada que hacer.`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASS, 10);
  await db.insert(usuarios).values({
    cuil: ADMIN_CUIL,
    passwordHash,
    nombre: "Administrador",
    apellido: "",
    email: "",
    rol: "admin",
    activo: true,
  });

  console.log("Usuario administrador creado:");
  console.log("  CUIL:    ", ADMIN_CUIL);
  console.log("  Password:", ADMIN_PASS);
  console.log("Cambia la contrasena despues del primer ingreso.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error en seed:", err);
  process.exit(1);
});
