import { PrismaClient } from "@prisma/client";

/** Bump when schema fields/models change so the global singleton reloads after `prisma generate`. */
const PRISMA_SCHEMA_REVISION = 9;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaRevision?: number;
};

function configureDatabaseUrl(): void {
  const raw = process.env.DATABASE_URL;
  if (!raw || raw.includes("dummy")) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[Prisma] DATABASE_URL is missing or invalid. Set it in Vercel Environment Variables."
      );
    }
    return;
  }
  try {
    const url = new URL(raw);
    const isDev = process.env.NODE_ENV !== "production";
    // In dev, Next/Turbopack can trigger many concurrent queries (RSC + API + prefetch),
    // which can easily exhaust a small pool and surface as P2024 / "Failed to fetch".
    // Neon pooler: keep Prisma's client pool small — PgBouncer handles multiplexing.
    const usesNeonPooler =
      url.hostname.includes("neon.tech") && url.hostname.includes("pooler");
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set(
        "connection_limit",
        usesNeonPooler ? (isDev ? "5" : "3") : isDev ? "10" : "5",
      );
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", isDev ? "60" : "20");
    }
    if (!url.searchParams.has("connect_timeout")) {
      // Neon cold start / wake from suspend can exceed a few seconds (Azure regions included).
      url.searchParams.set(
        "connect_timeout",
        url.hostname.includes("neon.tech") ? "60" : "15",
      );
    }
    if (url.hostname.includes("neon.tech")) {
      if (!url.searchParams.has("sslmode")) {
        url.searchParams.set("sslmode", "require");
      }
      if (url.hostname.includes("pooler") && !url.searchParams.has("pgbouncer")) {
        url.searchParams.set("pgbouncer", "true");
      }
    }
    process.env.DATABASE_URL = url.toString();
  } catch (error) {
    console.warn("[Prisma] Failed to parse DATABASE_URL:", error);
  }
}

configureDatabaseUrl();

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? process.env.PRISMA_LOG === "1"
          ? ["error", "warn"]
          : [] // Suppress E57P01 connection noise; PRISMA_LOG=1 to debug
        : ["error"],
  });
}

/** Delegates that must exist after the latest `prisma generate` (dev singleton can go stale). */
const REQUIRED_PRISMA_DELEGATES = [
  "objectifGlobalTask",
  "dossierVeilleJuridique",
  "nonConformiteJuridique",
  "projetPonctuelActivite",
  "interventionDiagnosticOffert",
] as const;

function prismaHasRequiredDelegates(client: PrismaClient): boolean {
  const record = client as unknown as Record<string, { findMany?: unknown } | undefined>;
  return REQUIRED_PRISMA_DELEGATES.every(
    (key) => typeof record[key]?.findMany === "function"
  );
}

export function invalidatePrismaClient(): void {
  const cached = globalForPrisma.prisma;
  if (cached) {
    void cached.$disconnect().catch(() => {});
  }
  globalForPrisma.prisma = undefined;
}

function resolvePrismaClient(): PrismaClient {
  if (globalForPrisma.prismaSchemaRevision !== PRISMA_SCHEMA_REVISION) {
    if (globalForPrisma.prisma) {
      console.warn(
        `[Prisma] Schema revision ${globalForPrisma.prismaSchemaRevision ?? 0} → ${PRISMA_SCHEMA_REVISION}; reconnecting client.`
      );
      invalidatePrismaClient();
    }
    globalForPrisma.prismaSchemaRevision = PRISMA_SCHEMA_REVISION;
  }

  const cached = globalForPrisma.prisma;

  if (
    process.env.NODE_ENV !== "production" &&
    cached &&
    !prismaHasRequiredDelegates(cached)
  ) {
    console.warn(
      "[Prisma] Stale client detected after schema change — reconnecting. Run `npx prisma generate` if this persists."
    );
    invalidatePrismaClient();
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

/** Always resolves the current singleton (safe after HMR / invalidatePrismaClient). */
export function getPrisma(): PrismaClient {
  return resolvePrismaClient();
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = resolvePrismaClient();
    const value = Reflect.get(client, prop, client);
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});

async function ensurePrismaConnected(): Promise<void> {
  const client = resolvePrismaClient();
  await client.$connect();
}

// Helper function to execute queries with retry logic
export async function executeWithRetry<T>(
  query: () => Promise<T>,
  maxRetries = 4,
  delay = 1000,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await ensurePrismaConnected();
      return await query();
    } catch (error: unknown) {
      lastError = error;

      // Check if it's a connection error (including P1001 = can't reach DB, e.g. Neon cold start)
      const errorString =
        typeof error === "object" && error !== null
          ? JSON.stringify(error)
          : String(error);
      const errorMessage =
        error instanceof Error ? error.message : errorString;
      const prismaCode =
        typeof error === "object" && error !== null && "code" in error
          ? (error as { code?: string }).code
          : undefined;
      const isConnectionError =
        prismaCode === "P1001" ||
        prismaCode === "P1017" ||
        prismaCode === "P1008" ||
        prismaCode === "P2024" ||
        errorMessage.includes("Engine is not yet connected") ||
        errorMessage.includes("Response from the Engine was empty") ||
        (error instanceof Error &&
          (error.message.includes("connection") ||
            error.message.includes("ConnectionReset") ||
            error.message.includes("Can't reach") ||
            error.message.includes("closed by the remote host") ||
            error.message.includes("Closed") ||
            error.message.includes("administrator command") ||
            error.message.includes("terminating connection") ||
            error.message.includes("Engine is not yet connected") ||
            error.message.includes("Response from the Engine was empty"))) ||
        (errorString &&
          (errorString.includes("kind: Closed") ||
            errorString.includes('"kind":"Closed"') ||
            errorString.includes("Closed") ||
            errorString.includes("E57P01") ||
            errorString.includes("administrator command") ||
            errorString.includes("terminating connection") ||
            errorString.includes("Engine is not yet connected") ||
            errorString.includes("Response from the Engine was empty")));

      if (isConnectionError && attempt < maxRetries) {
        if (
          errorMessage.includes("Engine is not yet connected") ||
          errorMessage.includes("Response from the Engine was empty") ||
          prismaCode === "P1017" ||
          prismaCode === "P2024"
        ) {
          // P2024 = pool exhausted/stuck; drop the client so retries get a fresh pool
          invalidatePrismaClient();
        }
        // Use longer delays for P1001 (Neon cold start) and P2024 (pool recovery)
        const waitMs =
          prismaCode === "P1001"
            ? 8000 * attempt
            : prismaCode === "P2024"
              ? 2000 * attempt
              : delay * attempt;
        console.warn(
          `Database connection error (attempt ${attempt}/${maxRetries}), retrying in ${waitMs / 1000}s...`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}
