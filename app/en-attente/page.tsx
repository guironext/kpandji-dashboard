import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getRoleLabel } from "@/lib/role-labels";
import WaitingActions from "./WaitingActions";

export const dynamic = "force-dynamic";

export default async function EnAttentePage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const meta = (user.publicMetadata ?? {}) as {
    pendingValidation?: boolean;
    invitationRejected?: boolean;
    invitedRole?: string;
  };
  // Compte validé (ou jamais en attente) : retour au routage normal par rôle
  if (!meta.pendingValidation) redirect("/");

  const rejected = Boolean(meta.invitationRejected);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-600 via-amber-500 to-yellow-400 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white/95 p-8 text-center shadow-2xl">
        <Image src="/logo.png" alt="KPANDJI logo" width={180} height={60} className="mx-auto mb-6" />
        {rejected ? (
          <>
            <h1 className="mb-3 text-2xl font-bold text-red-700">Inscription refusée</h1>
            <p className="text-gray-700">
              Votre demande d&apos;accès a été refusée par l&apos;administrateur. Contactez-le si
              vous pensez qu&apos;il s&apos;agit d&apos;une erreur.
            </p>
          </>
        ) : (
          <>
            <h1 className="mb-3 text-2xl font-bold text-gray-800">En attente de validation</h1>
            <p className="text-gray-700">
              Merci {user.firstName ?? ""} ! Votre inscription est enregistrée
              {meta.invitedRole ? (
                <>
                  {" "}pour le rôle <span className="font-semibold">{getRoleLabel(meta.invitedRole)}</span>
                </>
              ) : null}
              . Un administrateur doit maintenant valider votre compte.
            </p>
          </>
        )}
        <WaitingActions showCheck={!rejected} />
      </div>
    </div>
  );
}
