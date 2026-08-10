"use server";

import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { prisma, executeWithRetry } from "../prisma";
import { UserRole } from "@prisma/client";
import { normalizeUserRole } from "../user-role";
import { shouldPreferDatabaseRole } from "../resolve-effective-user-role";

async function syncClerkPublicRole(clerkId: string, role: UserRole) {
  const clerkUser = await (await clerkClient()).users.getUser(clerkId);
  await (
    await clerkClient()
  ).users.updateUserMetadata(clerkId, {
    publicMetadata: {
      ...clerkUser.publicMetadata,
      role,
    },
  });
}

/**
 * Get or create a user in the database from Clerk
 * This ensures users exist in the database even if they haven't completed onboarding
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
      const clerkUser = await (
        await clerkClient()
      ).users.getUser(targetClerkId);

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
        const role = shouldPreferDatabaseRole(existingByEmail.role, normalizeUserRole(clerkUser.publicMetadata?.role))
          ? existingByEmail.role
          : normalizeUserRole(clerkUser.publicMetadata?.role);

        dbUser = await executeWithRetry(() =>
          prisma.user.update({
            where: { id: existingByEmail.id },
            data: {
              clerkId: targetClerkId,
              firstName: clerkUser.firstName || existingByEmail.firstName,
              lastName: clerkUser.lastName || existingByEmail.lastName,
              role,
            },
          }),
        );

        if (shouldPreferDatabaseRole(existingByEmail.role, normalizeUserRole(clerkUser.publicMetadata?.role))) {
          await syncClerkPublicRole(targetClerkId, existingByEmail.role);
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
      const clerkUser = await (await clerkClient()).users.getUser(targetClerkId);
      const clerkRole = normalizeUserRole(clerkUser.publicMetadata?.role);

      if (shouldPreferDatabaseRole(dbUser.role, clerkRole)) {
        await syncClerkPublicRole(targetClerkId, dbUser.role);
      } else if (dbUser.role !== clerkRole && clerkRole !== UserRole.EMPLOYEE) {
        dbUser = await executeWithRetry(() =>
          prisma.user.update({
            where: { id: dbUser!.id },
            data: { role: clerkRole },
          }),
        );
      }
    }

    return { success: true, data: dbUser };
  } catch (error) {
    console.error("Error getting or creating user:", error);
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
