import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Planing Datos RRHH",
  description: "Tablero de control de actividades del equipo de Datos RRHH",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
