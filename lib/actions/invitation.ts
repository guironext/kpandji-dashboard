"use server";

import { randomBytes } from "crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { InvitationStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../prisma";
import { resolveEffectiveUserRole } from "../resolve-effective-user-role";
import { ASSIGNABLE_ROLES, INVITATION_VALIDITY_DAYS } from "../role-labels";

const CLERK_TIMEOUT_MS = 8_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  promise.catch(() => {});
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function shortError(error: unknown): string {
  if (error && typeof error === "object") {
    const e = error as {
      status?: number;
      errors?: Array<{ longMessage?: string; message?: string }>;
      message?: string;
    };
    const detail = e.errors?.[0]?.longMessage || e.errors?.[0]?.message || e.message;
    return [e.status ? `status ${e.status}` : null, detail].filter(Boolean).join(" — ");
  }
  return String(error);
}

/** Vérifie que l'appelant est ADMIN (même logique de rôle que le middleware). */
async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error("Non authentifié");
  const role = await resolveEffectiveUserRole(userId, sessionClaims?.metadata?.role);
  if (role !== UserRole.ADMIN) throw new Error("Accès réservé aux administrateurs");
  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  return { clerkId: userId, dbUser };
}

async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  if (host) {
    const proto =
      h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function buildInviteLink(baseUrl: string, token: string) {
  return `${baseUrl}/onboarding?invite=${encodeURIComponent(token)}`;
}

export type InvitationRow = {
  id: string;
  email: string;
  role: UserRole;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  acceptedAt: string | null;
  validatedAt: string | null;
  invitedByName: string | null;
  acceptedByName: string | null;
  link: string | null;
  expired: boolean;
};

const createSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide").max(100),
  role: z.nativeEnum(UserRole),
});

/** Crée une invitation (email + rôle futur), envoie l'email via Clerk si possible et renvoie le lien. */
export async function createInvitation(input: { email: string; role: string }) {
  try {
    const admin = await requireAdmin();
    const parsed = createSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.issues[0]?.message ?? "Données invalides" };
    }
    const { email, role } = parsed.data;
    if (!ASSIGNABLE_ROLES.includes(role)) {
      return { success: false as const, error: "Ce rôle ne peut pas être attribué par invitation" };
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    if (existingUser) {
      return { success: false as const, error: "Un compte existe déjà avec cet email" };
    }

    const now = new Date();
    const active = await prisma.invitation.findFirst({
      where: {
        email,
        OR: [
          { status: InvitationStatus.PENDING, expiresAt: { gt: now } },
          { status: InvitationStatus.WAITING_VALIDATION },
        ],
      },
      select: { id: true },
    });
    if (active) {
      return { success: false as const, error: "Une invitation est déjà en cours pour cet email" };
    }

    const token = randomBytes(24).toString("base64url");
    const expiresAt = new Date(now.getTime() + INVITATION_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
    const invitation = await prisma.invitation.create({
      data: { email, role, token, expiresAt, invitedById: admin.dbUser?.id ?? null },
    });

    const link = buildInviteLink(await getBaseUrl(), token);

    // Email envoyé par Clerk (aucun service d'email dans le projet). Le lien reste affiché en secours.
    let emailSent = false;
    let emailError: string | null = null;
    try {
      const clerkInvitation = await withTimeout(
        (await clerkClient()).invitations.createInvitation({
          emailAddress: email,
          redirectUrl: link,
          notify: true,
          ignoreExisting: true,
        }),
        CLERK_TIMEOUT_MS,
        "Clerk createInvitation",
      );
      emailSent = true;
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { clerkInvitationId: clerkInvitation.id },
      });
    } catch (error) {
      emailError = shortError(error);
      console.warn(`[invitation] email Clerk non envoyé (${emailError})`);
    }

    revalidatePath("/admin/invitations");
    return { success: true as const, link, emailSent, emailError };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Erreur" };
  }
}

export async function listInvitations() {
  try {
    await requireAdmin();
    const baseUrl = await getBaseUrl();
    const invitations = await prisma.invitation.findMany({
      orderBy: { createdAt: "desc" },
      include: { invitedBy: { select: { firstName: true, lastName: true } } },
    });
    const clerkIds = invitations
      .map((i) => i.acceptedByClerkId)
      .filter((id): id is string => Boolean(id));
    const acceptedUsers = clerkIds.length
      ? await prisma.user.findMany({
          where: { clerkId: { in: clerkIds } },
          select: { clerkId: true, firstName: true, lastName: true },
        })
      : [];
    const nameByClerkId = new Map(
      acceptedUsers.map((u) => [u.clerkId, `${u.firstName} ${u.lastName}`.trim()]),
    );
    const now = Date.now();

    const rows: InvitationRow[] = invitations.map((i) => {
      const expired = i.status === InvitationStatus.PENDING && i.expiresAt.getTime() < now;
      return {
        id: i.id,
        email: i.email,
        role: i.role,
        status: i.status,
        expiresAt: i.expiresAt.toISOString(),
        createdAt: i.createdAt.toISOString(),
        acceptedAt: i.acceptedAt?.toISOString() ?? null,
        validatedAt: i.validatedAt?.toISOString() ?? null,
        invitedByName: i.invitedBy
          ? `${i.invitedBy.firstName} ${i.invitedBy.lastName}`.trim()
          : null,
        acceptedByName: i.acceptedByClerkId
          ? (nameByClerkId.get(i.acceptedByClerkId) ?? null)
          : null,
        link: i.status === InvitationStatus.PENDING && !expired ? buildInviteLink(baseUrl, i.token) : null,
        expired,
      };
    });
    return { success: true as const, data: rows };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Erreur" };
  }
}

/** Valider : l'utilisateur reçoit le rôle de l'invitation (base + Clerk) et accède à son espace. */
export async function validateInvitation(invitationId: string) {
  try {
    await requireAdmin();
    const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
    if (!invitation) return { success: false as const, error: "Invitation introuvable" };
    if (invitation.status !== InvitationStatus.WAITING_VALIDATION || !invitation.acceptedByClerkId) {
      return { success: false as const, error: "Cette invitation n'est pas en attente de validation" };
    }

    const user = await prisma.user.findUnique({ where: { clerkId: invitation.acceptedByClerkId } });
    if (!user) return { success: false as const, error: "Utilisateur introuvable en base" };

    await prisma.user.update({ where: { id: user.id }, data: { role: invitation.role } });
    await withTimeout(
      (await clerkClient()).users.updateUserMetadata(invitation.acceptedByClerkId, {
        publicMetadata: {
          role: invitation.role,
          onboardingCompleted: true,
          pendingValidation: false,
          invitationRejected: false,
        },
      }),
      CLERK_TIMEOUT_MS,
      "Clerk updateUserMetadata",
    );
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.ACCEPTED, validatedAt: new Date() },
    });

    revalidatePath("/admin/invitations");
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: shortError(error) };
  }
}

/**
 * Refuser : en attente de validation → REJECTED (l'utilisateur reste bloqué sur la page d'attente) ;
 * pas encore utilisée → REVOKED (le lien ne fonctionne plus).
 */
export async function rejectInvitation(invitationId: string) {
  try {
    await requireAdmin();
    const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
    if (!invitation) return { success: false as const, error: "Invitation introuvable" };

    if (invitation.status === InvitationStatus.PENDING) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.REVOKED },
      });
      if (invitation.clerkInvitationId) {
        try {
          await withTimeout(
            (await clerkClient()).invitations.revokeInvitation(invitation.clerkInvitationId),
            CLERK_TIMEOUT_MS,
            "Clerk revokeInvitation",
          );
        } catch (error) {
          console.warn(`[invitation] révocation Clerk impossible (${shortError(error)})`);
        }
      }
    } else if (invitation.status === InvitationStatus.WAITING_VALIDATION) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.REJECTED, validatedAt: new Date() },
      });
      if (invitation.acceptedByClerkId) {
        await withTimeout(
          (await clerkClient()).users.updateUserMetadata(invitation.acceptedByClerkId, {
            publicMetadata: { pendingValidation: true, invitationRejected: true },
          }),
          CLERK_TIMEOUT_MS,
          "Clerk updateUserMetadata",
        );
      }
    } else {
      return { success: false as const, error: "Cette invitation est déjà traitée" };
    }

    revalidatePath("/admin/invitations");
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: shortError(error) };
  }
}
