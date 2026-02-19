import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
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
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "5");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "20");
    }
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "15");
    }
    if (!url.searchParams.has("sslmode") && url.hostname.includes("neon.tech")) {
      url.searchParams.set("sslmode", "require");
    }
    process.env.DATABASE_URL = url.toString();
  } catch (error) {
    console.warn("[Prisma] Failed to parse DATABASE_URL:", error);
  }
}

configureDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

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
