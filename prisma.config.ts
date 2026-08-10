import dotenv from "dotenv";

// Load .env.local first (Next.js convention), then .env as fallback
dotenv.config({ path: ".env.local" });
dotenv.config();

import { defineConfig } from "prisma/config";

function enhanceUrl(raw: string): string {
  if (!raw || raw.includes("dummy")) return raw;
  try {
    const url = new URL(raw);
    if (url.hostname.includes("neon.tech")) {
      if (!url.searchParams.has("sslmode")) url.searchParams.set("sslmode", "require");
      if (!url.searchParams.has("connect_timeout")) url.searchParams.set("connect_timeout", "60");
      if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "30");
    } else if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "30");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

function getDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL ?? "postgresql://dummy:dummy@dummy:5432/dummy";
  return enhanceUrl(raw);
}

function getDirectUrl(): string {
  if (process.env.DIRECT_URL) return enhanceUrl(process.env.DIRECT_URL);
  const raw = process.env.DATABASE_URL;
  if (!raw || raw.includes("dummy") || !raw.includes("neon.tech")) {
    return getDatabaseUrl();
  }
  try {
    const url = new URL(raw);
    if (url.hostname.includes("-pooler")) {
      url.hostname = url.hostname.replace(/-pooler\./, ".");
      return enhanceUrl(url.toString());
    }
    return enhanceUrl(raw);
  } catch {
    return getDatabaseUrl();
  }
}

// Set DIRECT_URL for schema.prisma (Prisma uses directUrl for migrations - bypasses pooler)
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = getDirectUrl();
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: getDatabaseUrl(),
    // Neon doesn't support auto-creating shadow DB. Use `prisma migrate deploy` to apply migrations.
    // For `migrate dev` (creating new migrations), create a Neon branch and set SHADOW_DATABASE_URL in .env
    ...(process.env.SHADOW_DATABASE_URL && {
      shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
    }),
  },
});
