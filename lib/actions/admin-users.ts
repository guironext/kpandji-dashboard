"use server";

import { revalidatePath } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Prisma, UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../prisma";
import { resolveEffectiveUserRole } from "../resolve-effective-user-role";

const CLERK_TIMEOUT_MS = 8_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  promise.catch(() => {});
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error("Non authentifié");
  const role = await resolveEffectiveUserRole(userId, sessionClaims?.metadata?.role);
  if (role !== UserRole.ADMIN) throw new Error("Accès réservé aux administrateurs");
  return { clerkId: userId };
}

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Erreur inattendue";
}

export type AdminUserDetails = {
  id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: string | null;
  telephone: string | null;
  isActive: boolean;
  disabledAt: string | null;
  createdAt: string;
  updatedAt: string;
  isSelf: boolean;
  clerk: {
    imageUrl: string | null;
    lastSignInAt: string | null;
    createdAt: string | null;
    banned: boolean;
    onboardingCompleted: boolean | null;
    pendingValidation: boolean | null;
    metadataRole: string | null;
  } | null;
};

export async function getUserDetails(userId: string) {
  try {
    const me = await requireAdmin();
    const u = await prisma.user.findUnique({ where: { id: userId } });
    if (!u) return { success: false as const, error: "Utilisateur introuvable" };
    let clerk: AdminUserDetails["clerk"] = null;
    try {
      const cu = await withTimeout((await clerkClient()).users.getUser(u.clerkId), CLERK_TIMEOUT_MS, "Clerk getUser");
      const pm = (cu.publicMetadata ?? {}) as Record<string, unknown>;
      clerk = {
        imageUrl: cu.imageUrl ?? null,
        lastSignInAt: cu.lastSignInAt ? new Date(cu.lastSignInAt).toISOString() : null,
        createdAt: cu.createdAt ? new Date(cu.createdAt).toISOString() : null,
        banned: Boolean(cu.banned),
        onboardingCompleted: typeof pm.onboardingCompleted === "boolean" ? pm.onboardingCompleted : null,
        pendingValidation: typeof pm.pendingValidation === "boolean" ? pm.pendingValidation : null,
        metadataRole: typeof pm.role === "string" ? pm.role : null,
      };
    } catch {
      clerk = null;
    }
    const data: AdminUserDetails = {
      id: u.id,
      clerkId: u.clerkId,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      department: u.department,
      telephone: u.telephone,
      isActive: u.isActive,
      disabledAt: u.disabledAt ? u.disabledAt.toISOString() : null,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
      isSelf: u.clerkId === me.clerkId,
      clerk,
    };
    return { success: true as const, data };
  } catch (e) {
    return { success: false as const, error: errMsg(e) };
  }
}

const updateSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis").max(100),
  lastName: z.string().trim().min(1, "Nom requis").max(100),
  role: z.nativeEnum(UserRole),
  department: z.string().trim().max(100).optional().nullable(),
  telephone: z.string().trim().max(30).optional().nullable(),
});

export async function updateUserByAdmin(userId: string, input: z.input<typeof updateSchema>) {
  try {
    const me = await requireAdmin();
    const parsed = updateSchema.safeParse(input);
    if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message ?? "Données invalides" };
    const data = parsed.data;
    const u = await prisma.user.findUnique({ where: { id: userId } });
    if (!u) return { success: false as const, error: "Utilisateur introuvable" };

    if (u.role === UserRole.ADMIN && data.role !== UserRole.ADMIN) {
      if (u.clerkId === me.clerkId) return { success: false as const, error: "Vous ne pouvez pas retirer votre propre rôle Admin" };
      const admins = await prisma.user.count({ where: { role: UserRole.ADMIN } });
      if (admins <= 1) return { success: false as const, error: "Impossible de retirer le dernier administrateur" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        department: data.department || null,
        telephone: data.telephone || null,
      },
    });

    let clerkWarning: string | null = null;
    try {
      const client = await clerkClient();
      await withTimeout(
        client.users.updateUserMetadata(u.clerkId, { publicMetadata: { role: data.role } }),
        CLERK_TIMEOUT_MS,
        "Clerk updateUserMetadata",
      );
      await withTimeout(
        client.users.updateUser(u.clerkId, { firstName: data.firstName, lastName: data.lastName }),
        CLERK_TIMEOUT_MS,
        "Clerk updateUser",
      );
    } catch {
      clerkWarning = "Enregistré en base, mais la synchronisation Clerk a échoué";
    }
    revalidatePath("/admin/invitations");
    return { success: true as const, warning: clerkWarning };
  } catch (e) {
    return { success: false as const, error: errMsg(e) };
  }
}

export async function deleteUserByAdmin(userId: string) {
  try {
    const me = await requireAdmin();
    const u = await prisma.user.findUnique({ where: { id: userId } });
    if (!u) return { success: false as const, error: "Utilisateur introuvable" };
    if (u.clerkId === me.clerkId) return { success: false as const, error: "Vous ne pouvez pas supprimer votre propre compte" };
    if (u.role === UserRole.ADMIN) {
      const admins = await prisma.user.count({ where: { role: UserRole.ADMIN } });
      if (admins <= 1) return { success: false as const, error: "Impossible de supprimer le dernier administrateur" };
    }

    try {
      // Invitation.invitedBy est en onDelete: SetNull ; les autres relations bloquent si des données existent.
      await prisma.user.delete({ where: { id: userId } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && (e.code === "P2003" || e.code === "P2014")) {
        return {
          success: false as const,
          error: "Suppression impossible : cet utilisateur est lié à des données (factures, clients, projets…). Désactivez son compte plutôt que de le supprimer.",
          canDeactivate: true as const,
        };
      }
      throw e;
    }

    let clerkWarning: string | null = null;
    try {
      await withTimeout((await clerkClient()).users.deleteUser(u.clerkId), CLERK_TIMEOUT_MS, "Clerk deleteUser");
    } catch {
      clerkWarning = "Supprimé en base, mais la suppression du compte Clerk a échoué";
    }
    revalidatePath("/admin/invitations");
    return { success: true as const, warning: clerkWarning };
  } catch (e) {
    return { success: false as const, error: errMsg(e) };
  }
}

export async function deactivateUserByAdmin(userId: string) {
  try {
    const me = await requireAdmin();
    const u = await prisma.user.findUnique({ where: { id: userId } });
    if (!u) return { success: false as const, error: "Utilisateur introuvable" };
    if (u.clerkId === me.clerkId) return { success: false as const, error: "Vous ne pouvez pas désactiver votre propre compte" };
    if (u.role === UserRole.ADMIN) {
      const admins = await prisma.user.count({ where: { role: UserRole.ADMIN, isActive: true } });
      if (admins <= 1) return { success: false as const, error: "Impossible de désactiver le dernier administrateur actif" };
    }
    await prisma.user.update({ where: { id: userId }, data: { isActive: false, disabledAt: new Date() } });

    let clerkWarning: string | null = null;
    try {
      const client = await clerkClient();
      await withTimeout(client.users.updateUserMetadata(u.clerkId, { publicMetadata: { disabled: true } }), CLERK_TIMEOUT_MS, "Clerk updateUserMetadata");
      // Le bannissement révoque toutes les sessions et empêche toute nouvelle connexion.
      await withTimeout(client.users.banUser(u.clerkId), CLERK_TIMEOUT_MS, "Clerk banUser");
    } catch {
      clerkWarning = "Désactivé en base, mais le blocage du compte Clerk a échoué";
    }
    revalidatePath("/admin/invitations");
    return { success: true as const, warning: clerkWarning };
  } catch (e) {
    return { success: false as const, error: errMsg(e) };
  }
}

export async function reactivateUserByAdmin(userId: string) {
  try {
    await requireAdmin();
    const u = await prisma.user.findUnique({ where: { id: userId } });
    if (!u) return { success: false as const, error: "Utilisateur introuvable" };
    await prisma.user.update({ where: { id: userId }, data: { isActive: true, disabledAt: null } });

    let clerkWarning: string | null = null;
    try {
      const client = await clerkClient();
      await withTimeout(client.users.unbanUser(u.clerkId), CLERK_TIMEOUT_MS, "Clerk unbanUser");
      await withTimeout(client.users.updateUserMetadata(u.clerkId, { publicMetadata: { disabled: null } }), CLERK_TIMEOUT_MS, "Clerk updateUserMetadata");
    } catch {
      clerkWarning = "Réactivé en base, mais le déblocage du compte Clerk a échoué";
    }
    revalidatePath("/admin/invitations");
    return { success: true as const, warning: clerkWarning };
  } catch (e) {
    return { success: false as const, error: errMsg(e) };
  }
}
