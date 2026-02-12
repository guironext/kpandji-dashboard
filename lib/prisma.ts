import { PrismaClient } from "@prisma/client";

// Next.js automatically loads environment variables from .env files
// No need to import dotenv explicitly

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 6 reads DATABASE_URL from environment variables (defined in schema.prisma)
// During build time, if DATABASE_URL is not set, set a dummy URL to allow schema validation
// This URL will never be used for actual connections since these routes are dynamic
const isBuildTime =
  process.env.NEXT_PHASE === "phase-production-build" ||
  (!process.env.DATABASE_URL && process.env.NODE_ENV !== "development");

if (!process.env.DATABASE_URL) {
  // Set a dummy URL in process.env so Prisma can read it from schema.prisma
  process.env.DATABASE_URL = isBuildTime
    ? "postgresql://dummy:dummy@dummy:5432/dummy?schema=public"
    : "postgresql://dummy:dummy@dummy:5432/dummy";

  if (!isBuildTime) {
    console.warn(
      "DATABASE_URL is not set. Using dummy URL for build-time validation only.",
    );
  }
}

// Configure logging - only log errors, suppress connection lifecycle events
const logConfig = (
  process.env.NODE_ENV === "development"
    ? ([
        { emit: "event" as const, level: "error" as const },
        { emit: "event" as const, level: "warn" as const },
      ] as const)
    : ([{ emit: "event" as const, level: "error" as const }] as const)
) as Array<{ emit: "event"; level: "error" | "warn" }>;

// Prisma will read DATABASE_URL from process.env (defined in schema.prisma)
// Enhance DATABASE_URL with connection pool settings if not already present
let databaseUrl = process.env.DATABASE_URL || "";
if (
  databaseUrl &&
  !databaseUrl.includes("connection_limit") &&
  !isBuildTime &&
  databaseUrl.startsWith("postgresql://")
) {
  try {
    // Add connection pool parameters to prevent connection exhaustion
    const url = new URL(databaseUrl);
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "10");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "20");
    }
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "10");
    }
    databaseUrl = url.toString();
  } catch (error) {
    // If URL parsing fails, use original URL
    console.warn("Failed to parse DATABASE_URL, using original:", error);
  }
}

// We don't pass datasources explicitly to avoid validation issues
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isBuildTime ? [] : logConfig,
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    errorFormat: "minimal",
  });

// Handle connection errors and reconnect
(
  prisma.$on as (
    event: "error" | "warn",
    callback: (e: unknown) => void,
  ) => void
)("error", (e: unknown) => {
  // Convert error to string for comprehensive checking
  let errorString = "";
  try {
    errorString = JSON.stringify(e, null, 2);
  } catch {
    errorString = String(e);
  }

  // Also check the error message directly
  const error = e as { message?: string; code?: string; kind?: string; cause?: unknown; target?: string };
  const errorMessage = error.message || "";
  
  // Check if this is a connection termination error (E57P01)
  // These errors are expected with serverless PostgreSQL and should be suppressed
  const isConnectionTerminationError =
    errorString.includes("E57P01") ||
    errorString.includes("terminating connection due to administrator command") ||
    errorString.includes("SqlState(E57P01)") ||
    errorString.includes('code: SqlState(E57P01)') ||
    errorString.includes("ProcessInterrupts") ||
    errorMessage.includes("E57P01") ||
    errorMessage.includes("terminating connection due to administrator command") ||
    errorMessage.includes("SqlState(E57P01)") ||
    // Check nested cause structure
    (typeof error.cause === "object" && error.cause !== null && 
     JSON.stringify(error.cause).includes("E57P01"));

  // Suppress connection termination errors completely - Prisma auto-reconnects
  if (isConnectionTerminationError) {
    // These are normal with serverless PostgreSQL (Neon, Supabase, etc.)
    // Connections are terminated when idle - Prisma handles reconnection automatically
    // No logging needed to reduce console noise
    return;
  }

  // Check for other connection-related errors that should be suppressed
  const errorCode = error.code || "";
  
  const isConnectionError =
    errorMessage.includes("Closed") ||
    errorMessage.includes("ConnectionReset") ||
    errorMessage.includes("connection terminated") ||
    errorCode === "P1001" ||
    errorCode === "P1017" ||
    errorCode === "P1008" ||
    errorString.includes("kind: Closed") ||
    errorString.includes('"kind":"Closed"') ||
    errorString.includes("ConnectionReset");

  if (isConnectionError) {
    // Suppress connection lifecycle errors
    return;
  }

  // Log only genuine errors that need attention
  const errorDetails = {
    message: e instanceof Error ? e.message : String(e),
    name: e instanceof Error ? e.name : typeof e,
    stack: e instanceof Error ? e.stack : undefined,
    ...(typeof e === "object" && e !== null ? e : {}),
  };

  console.error("Prisma Client Error:", errorDetails);
});

// Handle warnings in development
if (process.env.NODE_ENV === "development") {
  (
    prisma.$on as (
      event: "error" | "warn",
      callback: (e: unknown) => void,
    ) => void
  )("warn", (e: unknown) => {
    console.warn("Prisma Client Warning:", e);
  });
}

// Prisma Client manages connections automatically
// Don't manually connect/disconnect unless necessary
// Connections are opened on first query and reused from the pool

// Add connection retry logic
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Helper function to execute queries with retry logic
export async function executeWithRetry<T>(
  query: () => Promise<T>,
  maxRetries = 3,
  delay = 1000,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await query();
    } catch (error: unknown) {
      lastError = error;

      // Check if it's a connection error
      const errorString =
        typeof error === "object" && error !== null
          ? JSON.stringify(error)
          : String(error);
      const isConnectionError =
        (error instanceof Error &&
          (error.message.includes("connection") ||
            error.message.includes("ConnectionReset") ||
            error.message.includes("closed by the remote host") ||
            error.message.includes("Closed"))) ||
        (errorString &&
          (errorString.includes("kind: Closed") ||
            errorString.includes('"kind":"Closed"') ||
            errorString.includes("Closed"))) ||
        (typeof error === "object" &&
          error !== null &&
          "code" in error &&
          (error.code === "P1001" ||
            error.code === "P1017" ||
            error.code === "P1008"));

      if (isConnectionError && attempt < maxRetries) {
        console.warn(
          `Database connection error (attempt ${attempt}/${maxRetries}), retrying...`,
        );
        // Wait before retrying (Prisma will automatically reconnect)
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}
