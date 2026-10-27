import OnboardingForm from "@/components/Onboarding";
import { currentUser } from "@clerk/nextjs/server";
import { InvitationStatus, UserRole } from "@prisma/client";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

type InvitationInfo = { token: string; role: UserRole; email: string };

async function loadInvitation(
  token: string,
  userEmails: string[],
): Promise<{ invitation: InvitationInfo | null; error: string | null }> {
  const invitation = await prisma.invitation.findUnique({ where: { token } });
  if (!invitation) {
    return { invitation: null, error: "Lien d'invitation invalide." };
  }
  if (invitation.status !== InvitationStatus.PENDING) {
    return {
      invitation: null,
      error:
        invitation.status === InvitationStatus.WAITING_VALIDATION
          ? "Cette invitation a déjà été utilisée et attend la validation de l'administrateur."
          : "Cette invitation n'est plus valable.",
    };
  }
  if (invitation.expiresAt.getTime() < Date.now()) {
    return {
      invitation: null,
      error: "Cette invitation a expiré. Demandez un nouveau lien à l'administrateur.",
    };
  }
  if (!userEmails.includes(invitation.email.toLowerCase())) {
    return {
      invitation: null,
      error: `Cette invitation est destinée à ${invitation.email}. Déconnectez-vous puis connectez-vous (ou inscrivez-vous) avec cette adresse.`,
    };
  }
  return {
    invitation: { token: invitation.token, role: invitation.role, email: invitation.email },
    error: null,
  };
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string | string[] }>;
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const userEmail = user.emailAddresses[0]?.emailAddress ?? "";
  const params = await searchParams;
  const inviteToken = Array.isArray(params.invite) ? params.invite[0] : params.invite;

  const { invitation, error: invitationError } = inviteToken
    ? await loadInvitation(
        inviteToken,
        user.emailAddresses.map((e) => e.emailAddress.toLowerCase()),
      )
    : { invitation: null, error: null };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-600 via-amber-500 to-yellow-400 p-4 sm:p-6">
      <div className="grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex justify-center">
          <Image
            src="/logo.png"
            alt="KPANDJI logo"
            width={280}
            height={90}
            priority
            className="dark:invert"
          />
        </div>

        <OnboardingForm
          userEmail={userEmail}
          firstName={user.firstName ?? ""}
          lastName={user.lastName ?? ""}
          invitation={invitation}
          invitationError={invitationError}
        />
      </div>
    </div>
  );
}
