"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { InvitationStatus, UserRole } from "@prisma/client";
import { prisma } from "../prisma";
import { normalizeUserRole } from "../user-role";

async function persistOnboardedUser(
  clerkId: string,
  role: string | UserRole,
  department?: string,
  telephone?: string,
  pending?: { invitedRole: UserRole },
) {
  // Invité : rôle EMPLOYEE (sans accès) tant que l'admin n'a pas validé ; rôle cible dans invitedRole
  const normalizedRole = pending ? UserRole.EMPLOYEE : normalizeUserRole(role);
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
      ...(pending && {
        pendingValidation: true,
        invitationRejected: false,
        invitedRole: pending.invitedRole,
      }),
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
    if (normalizeUserRole(role) === UserRole.ADMIN) {
      return { success: false };
    }
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
    const normalizedRole = normalizeUserRole(role);
    if (normalizedRole === UserRole.ADMIN) {
      return {
        success: false,
        error: "Le rôle Admin ne peut pas être choisi à l'inscription.",
      };
    }
    await persistOnboardedUser(clerkId, normalizedRole, department, telephone);
    return { success: true, role: normalizedRole };
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

/**
 * Inscription via un lien d'invitation : le rôle vient de l'invitation (non modifiable),
 * l'email du compte doit correspondre, puis l'utilisateur attend la validation de l'admin.
 */
export async function completeInvitedOnboarding(
  token: string,
  department?: string,
  telephone?: string,
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Session utilisateur introuvable." };
    }

    const invitation = await prisma.invitation.findUnique({ where: { token } });
    if (!invitation || invitation.status !== InvitationStatus.PENDING) {
      return { success: false, error: "Invitation invalide ou déjà utilisée." };
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      return { success: false, error: "Cette invitation a expiré. Demandez-en une nouvelle." };
    }

    const clerkUser = await (await clerkClient()).users.getUser(userId);
    const emails = clerkUser.emailAddresses.map((e) => e.emailAddress.toLowerCase());
    if (!emails.includes(invitation.email.toLowerCase())) {
      return {
        success: false,
        error: `Cette invitation est destinée à ${invitation.email}. Connectez-vous avec cette adresse.`,
      };
    }

    await persistOnboardedUser(userId, UserRole.EMPLOYEE, department, telephone, {
      invitedRole: invitation.role,
    });

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: InvitationStatus.WAITING_VALIDATION,
        acceptedByClerkId: userId,
        acceptedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to complete onboarding",
    };
  }
}
