"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { prisma } from "../prisma";
import { normalizeUserRole } from "../user-role";

async function persistOnboardedUser(
  clerkId: string,
  role: string | UserRole,
  department?: string,
  telephone?: string,
) {
  const normalizedRole = normalizeUserRole(role);
  const user = await (await clerkClient()).users.getUser(clerkId);

  if (!user || !user.firstName || !user.lastName) {
    throw new Error("User not found");
  }

  const email =
    user.emailAddresses[0]?.emailAddress ?? `${user.id}@clerk.temp`;

  await (
    await clerkClient()
  ).users.updateUserMetadata(user.id, {
    publicMetadata: {
      onboardingCompleted: true,
      role: normalizedRole,
      ...(department !== undefined && { department }),
      ...(telephone !== undefined && { telephone }),
    },
  });

  const userData = {
    email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: normalizedRole,
    department,
    telephone,
  };

  const existingByClerkId = await prisma.user.findUnique({
    where: { clerkId: user.id },
  });

  if (existingByClerkId) {
    await prisma.user.update({
      where: { clerkId: user.id },
      data: userData,
    });
    return;
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (existingByEmail) {
    await prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        clerkId: user.id,
        ...userData,
      },
    });
    return;
  }

  await prisma.user.create({
    data: {
      clerkId: user.id,
      ...userData,
    },
  });
}

export async function createEmployee(
  department: string | undefined,
  clerkId: string,
  role: string | UserRole,
) {
  try {
    await persistOnboardedUser(clerkId, role, department);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
}

export async function completeUserOnboarding(
  department: string | undefined,
  clerkId: string,
  role: string | UserRole,
  telephone?: string,
) {
  try {
    await persistOnboardedUser(clerkId, role, department, telephone);
    return { success: true };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to complete onboarding",
    };
  }
}
