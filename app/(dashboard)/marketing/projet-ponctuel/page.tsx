import { auth } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/actions/user";
import { getRedirectForRole } from "@/lib/role-redirects";
import { getActivitesForCurrentResponsable } from "@/lib/actions/projet-ponctuel-activite";
import ProjetPonctuelResponsableKanban from "@/components/projet-ponctuel/ProjetPonctuelResponsableKanban";

export default async function MarketingPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const result = await getOrCreateUser(userId);
  if (!result.success || !result.data) {
    return <ProjetPonctuelResponsableKanban initialActivites={[]} variant="marketing" />;
  }

  const role = result.data.role;

  if (role && role !== UserRole.MARKETING) {
    const redirectPath = getRedirectForRole(role);
    if (redirectPath) {
      redirect(redirectPath);
    }
  }

  const activitesResult = await getActivitesForCurrentResponsable(userId);

  return (
    <ProjetPonctuelResponsableKanban
      initialActivites={activitesResult.success ? activitesResult.activites : []}
      variant="marketing"
    />
  );
}
