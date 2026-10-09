"use server";

import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { prisma, executeWithRetry } from "../prisma";
import { UserRole } from "@prisma/client";
import { normalizeUserRole } from "../user-role";
import { shouldPreferDatabaseRole } from "../resolve-effective-user-role";

type ClerkUser = Awaited<
  ReturnType<Awaited<ReturnType<typeof clerkClient>>["users"]["getUser"]>
>;

// --- Accès Clerk protégé : timeout, cache court par clerkId, pause (backoff) si Clerk est en panne ---
const CLERK_TIMEOUT_MS = 3_000;
const CLERK_USER_CACHE_TTL_MS = 60_000;
const CLERK_DEFAULT_BACKOFF_MS = 60_000;
const CLERK_TIMEOUT_BACKOFF_MS = 30_000;
const FALLBACK_WARN_INTERVAL_MS = 60_000;

// État en mémoire du processus serveur (réinitialisé au redémarrage / rechargement du module)
const clerkUserCache = new Map<string, { user: ClerkUser; expiresAt: number }>();
let clerkBackoffUntil = 0;
let lastFallbackWarnAt = 0;

class ClerkUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClerkUnavailableError";
  }
}

function describeClerkError(error: unknown): string {
  if (error && typeof error === "object") {
    const e = error as { status?: number; clerkTraceId?: string; message?: string };
    const parts = [
      e.status ? `status ${e.status}` : null,
      e.clerkTraceId ? `trace ${e.clerkTraceId}` : null,
      e.message && e.message !== "<none>" ? e.message : null,
    ].filter(Boolean);
    if (parts.length) return parts.join(", ");
  }
  return String(error);
}

/** Panne / surcharge Clerk (5xx, 429, timeout, réseau) — pas une vraie erreur métier comme un 404. */
function isTransientClerkError(error: unknown): boolean {
  if (error instanceof ClerkUnavailableError) return true;
  const status =
    error && typeof error === "object" ? (error as { status?: number }).status : undefined;
  if (typeof status === "number") return status >= 500 || status === 429;
  const message = error instanceof Error ? error.message : String(error);
  return /timed out|ECONNRESET|ETIMEDOUT|ENOTFOUND|fetch failed|network/i.test(message);
}

function backoffMsFor(error: unknown): number {
  const retryAfter =
    error && typeof error === "object" ? (error as { retryAfter?: number }).retryAfter : undefined;
  if (typeof retryAfter === "number" && retryAfter > 0) return retryAfter * 1000;
  const message = error instanceof Error ? error.message : "";
  return /timed out/i.test(message) ? CLERK_TIMEOUT_BACKOFF_MS : CLERK_DEFAULT_BACKOFF_MS;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  // Évite un rejet non géré si l'appel Clerk échoue après le timeout
  promise.catch(() => {});
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Récupère l'utilisateur Clerk avec cache (60 s), timeout (3 s) et pause pendant une panne
 * (respecte retryAfter). Lève ClerkUnavailableError si Clerk est indisponible.
 */
async function fetchClerkUser(clerkId: string): Promise<ClerkUser> {
  const now = Date.now();
  const cached = clerkUserCache.get(clerkId);
  if (cached && cached.expiresAt > now) return cached.user;

  if (now < clerkBackoffUntil) {
    throw new ClerkUnavailableError(
      `Clerk en pause encore ${Math.ceil((clerkBackoffUntil - now) / 1000)}s après une erreur`,
    );
  }

  try {
    const user = await withTimeout(
      (await clerkClient()).users.getUser(clerkId),
      CLERK_TIMEOUT_MS,
      "Clerk getUser",
    );
    clerkUserCache.set(clerkId, { user, expiresAt: Date.now() + CLERK_USER_CACHE_TTL_MS });
    return user;
  } catch (error) {
    if (isTransientClerkError(error)) {
      const backoff = backoffMsFor(error);
      clerkBackoffUntil = Date.now() + backoff;
      console.warn(
        `[clerk] getUser indisponible (${describeClerkError(error)}) — appels Clerk suspendus ${Math.round(backoff / 1000)}s`,
      );
      throw new ClerkUnavailableError(describeClerkError(error));
    }
    throw error;
  }
}

async function syncClerkPublicRole(
  clerkId: string,
  role: UserRole,
  currentMetadata: ClerkUser["publicMetadata"],
) {
  if (Date.now() < clerkBackoffUntil) return; // Clerk en panne : on réessaiera plus tard
  try {
    const updated = await withTimeout(
      (await clerkClient()).users.updateUserMetadata(clerkId, {
        publicMetadata: { ...currentMetadata, role },
      }),
      CLERK_TIMEOUT_MS,
      "Clerk updateUserMetadata",
    );
    clerkUserCache.set(clerkId, {
      user: updated,
      expiresAt: Date.now() + CLERK_USER_CACHE_TTL_MS,
    });
  } catch (error) {
    // Non bloquant : le rôle en base reste la référence pour cette requête
    clerkUserCache.delete(clerkId);
    if (isTransientClerkError(error)) {
      clerkBackoffUntil = Date.now() + backoffMsFor(error);
    }
    console.warn(
      `[getOrCreateUser] synchronisation du rôle vers Clerk impossible (${describeClerkError(error)})`,
    );
  }
}

/**
 * Get or create a user in the database from Clerk
 * This ensures users exist in the database even if they haven't completed onboarding.
 * If the user already exists in the DB, a Clerk failure/outage never breaks the request:
 * the DB user (and its role) is returned and a short warning is logged.
 */
export async function getOrCreateUser(clerkId?: string) {
  try {
    // Get clerkId from parameter or current user
    let targetClerkId = clerkId;

    if (!targetClerkId) {
      const user = await currentUser();
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }
      targetClerkId = user.id;
    }

    // Try to find user in database
    let dbUser = await executeWithRetry(() =>
      prisma.user.findUnique({
        where: { clerkId: targetClerkId },
      }),
    );

    if (!dbUser) {
      // Nouvel utilisateur : Clerk est indispensable pour créer la ligne en base
      let clerkUser: ClerkUser;
      try {
        clerkUser = await fetchClerkUser(targetClerkId);
      } catch (error) {
        if (error instanceof ClerkUnavailableError) {
          return {
            success: false,
            error:
              "Service d'authentification (Clerk) temporairement indisponible. Réessayez dans un instant.",
          };
        }
        throw error;
      }

      if (!clerkUser) {
        return { success: false, error: "User not found in Clerk" };
      }

      const email =
        (clerkUser as { primaryEmailAddress?: { emailAddress?: string } })
          .primaryEmailAddress?.emailAddress ||
        clerkUser.emailAddresses[0]?.emailAddress ||
        `${targetClerkId}@clerk.temp`;

      const role = normalizeUserRole(clerkUser.publicMetadata?.role);

      // A user with this email might already exist in the DB from a previous
      // Clerk account. In that case, reconcile by updating the stale clerkId
      // instead of creating a duplicate (which would violate the unique
      // constraint on `email`).
      const existingByEmail = await executeWithRetry(() =>
        prisma.user.findUnique({
          where: { email },
        }),
      );

      if (existingByEmail) {
        const preferDbRole = shouldPreferDatabaseRole(existingByEmail.role, role);
        const finalRole = preferDbRole ? existingByEmail.role : role;

        dbUser = await executeWithRetry(() =>
          prisma.user.update({
            where: { id: existingByEmail.id },
            data: {
              clerkId: targetClerkId,
              firstName: clerkUser.firstName || existingByEmail.firstName,
              lastName: clerkUser.lastName || existingByEmail.lastName,
              role: finalRole,
            },
          }),
        );

        if (preferDbRole) {
          await syncClerkPublicRole(targetClerkId, existingByEmail.role, clerkUser.publicMetadata);
        }
      } else {
        dbUser = await executeWithRetry(() =>
          prisma.user.create({
            data: {
              clerkId: targetClerkId,
              email: email,
              firstName: clerkUser.firstName || "Unknown",
              lastName: clerkUser.lastName || "User",
              role: role,
              department: clerkUser.publicMetadata?.department as
                | string
                | undefined,
              telephone: clerkUser.publicMetadata?.telephone as
                | string
                | undefined,
            },
          }),
        );
      }
    } else {
      // Utilisateur existant : la synchro du rôle avec Clerk est un bonus, jamais bloquante
      let clerkUser: ClerkUser | null = null;
      try {
        clerkUser = await fetchClerkUser(targetClerkId);
      } catch (error) {
        const now = Date.now();
        if (now - lastFallbackWarnAt > FALLBACK_WARN_INTERVAL_MS) {
          lastFallbackWarnAt = now;
          console.warn(
            `[getOrCreateUser] Clerk indisponible, utilisateur et rôle de la base utilisés (${describeClerkError(error)})`,
          );
        }
      }

      if (clerkUser) {
        const clerkRole = normalizeUserRole(clerkUser.publicMetadata?.role);

        if (shouldPreferDatabaseRole(dbUser.role, clerkRole)) {
          await syncClerkPublicRole(targetClerkId, dbUser.role, clerkUser.publicMetadata);
        } else if (dbUser.role !== clerkRole && clerkRole !== UserRole.EMPLOYEE) {
          dbUser = await executeWithRetry(() =>
            prisma.user.update({
              where: { id: dbUser!.id },
              data: { role: clerkRole },
            }),
          );
        }
      }
    }

    return { success: true, data: dbUser };
  } catch (error) {
    if (isTransientClerkError(error)) {
      console.warn(`[getOrCreateUser] Clerk indisponible (${describeClerkError(error)})`);
    } else {
      console.error("Error getting or creating user:", error);
    }
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get or create user";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get all users with role COMMERCIAL
 */
export async function getCommercialUsers() {
  try {
    const users = await prisma.user.findMany({
      where: { role: UserRole.COMMERCIAL },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: { id: true, firstName: true, lastName: true },
    });
    return {
      success: true,
      data: users.map((u) => ({
        id: u.id,
        fullName: `${u.firstName} ${u.lastName}`.trim(),
      })),
    };
  } catch (error) {
    console.error("Error fetching commercial users:", error);
    return { success: false, error: "Failed to fetch users", data: [] };
  }
}

/**
 * Get user by clerkId, return null if not found (don't create)
 */
export async function getUserByClerkId(clerkId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });
    return { success: true, data: user };
  } catch (error) {
    console.error("Error getting user:", error);
    return { success: false, error: "Failed to get user" };
  }
}
