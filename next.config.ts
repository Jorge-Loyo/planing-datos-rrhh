import type { NextConfig } from "next";

// Cabeceras de seguridad HTTP aplicadas a todas las respuestas.
const securityHeaders = [
  // Evita que el sitio se incruste en un iframe de otro dominio (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Evita que el navegador "adivine" el tipo de contenido
  { key: "X-Content-Type-Options", value: "nosniff" },
  // No filtrar el referer a otros sitios
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Limitar APIs del navegador que la app no usa
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // no revelar que corre con Next.js
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
