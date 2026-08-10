import { auth } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/actions/user";
import { getRedirectForRole } from "@/lib/role-redirects";
import { getTachesForCurrentResponsable } from "@/lib/actions/tache-activite-projet-routine";
import ProjetPermanentResponsableKanban from "@/components/projet-permanent/ProjetPermanentResponsableKanban";

export default async function InfographieProjetPermanentPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const result = await getOrCreateUser(userId);
  if (!result.success || !result.data) {
    return <ProjetPermanentResponsableKanban initialTaches={[]} variant="infographie" />;
  }

  const role = result.data.role;

  if (role && role !== UserRole.INFOGRAPHIE) {
    const redirectPath = getRedirectForRole(role);
    if (redirectPath) {
      redirect(redirectPath);
    }
  }

  const tachesResult = await getTachesForCurrentResponsable(userId);

  return (
    <ProjetPermanentResponsableKanban
      initialTaches={tachesResult.success ? tachesResult.taches : []}
      variant="infographie"
    />
  );
}
