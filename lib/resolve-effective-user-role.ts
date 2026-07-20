import { clerkClient } from "@clerk/nextjs/server";
import { normalizeUserRole } from "./user-role";
import { UserRole } from "./user-role-constants";

const CLERK_LOOKUP_TIMEOUT_MS = 3_000;

/** When DB was corrected but Clerk still has the default EMPLOYEE role. */
export function shouldPreferDatabaseRole(
  databaseRole: UserRole,
  clerkRole: UserRole,
): boolean {
  return clerkRole === UserRole.EMPLOYEE && databaseRole !== UserRole.EMPLOYEE;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

async function fetchClerkRole(userId: string): Promise<UserRole | null> {
  try {
    const clerkUser = await withTimeout(
      (await clerkClient()).users.getUser(userId),
      CLERK_LOOKUP_TIMEOUT_MS,
      "Clerk getUser",
    );
    return normalizeUserRole(clerkUser.publicMetadata?.role);
  } catch (error) {
    console.warn("[resolveEffectiveUserRole] Clerk lookup failed:", error);
    return null;
  }
}

/**
 * Resolve the effective role for redirects/guards (Edge-safe).
 * Prefers live Clerk publicMetadata over JWT session claims (can be stale after onboarding).
 * DB fallback is handled in server actions via shouldPreferDatabaseRole.
 */
export async function resolveEffectiveUserRole(
  userId: string,
  sessionRole: unknown,
): Promise<UserRole> {
  const sessionNormalized = normalizeUserRole(sessionRole);

  // JWT already carries a specific role — skip live Clerk fetch on every middleware hit.
  if (sessionNormalized !== UserRole.EMPLOYEE) {
    return sessionNormalized;
  }

  const clerkRole = await fetchClerkRole(userId);
  return clerkRole ?? sessionNormalized;
}