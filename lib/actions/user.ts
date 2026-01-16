"use server";

import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { prisma } from "../prisma";
import { UserRole } from "../generated/prisma";

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
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: targetClerkId },
    });

    // If user doesn't exist, create it from Clerk data
    if (!dbUser) {
      const clerkUser = await (await clerkClient()).users.getUser(targetClerkId);
      
      if (!clerkUser) {
        return { success: false, error: "User not found in Clerk" };
      }

      // Get email from Clerk user
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      if (!email) {
        return { success: false, error: "User email not found" };
      }

      // Get role from metadata or default to EMPLOYEE
      const role = (clerkUser.publicMetadata?.role as UserRole) || UserRole.EMPLOYEE;

      // Create user in database
      dbUser = await prisma.user.create({
        data: {
          clerkId: targetClerkId,
          email: email,
          firstName: clerkUser.firstName || "Unknown",
          lastName: clerkUser.lastName || "User",
          role: role,
          department: clerkUser.publicMetadata?.department as string | undefined,
          telephone: clerkUser.publicMetadata?.telephone as string | undefined,
        },
      });
    }

    return { success: true, data: dbUser };
  } catch (error) {
    console.error("Error getting or creating user:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get or create user";
    return { success: false, error: errorMessage };
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
