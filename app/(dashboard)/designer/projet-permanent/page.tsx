import { auth } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/actions/user";
import { getRedirectForRole } from "@/lib/role-redirects";
import { getTachesForCurrentResponsable } from "@/lib/actions/tache-activite-projet-routine";
import ProjetPermanentResponsableKanban from "@/components/projet-permanent/ProjetPermanentResponsableKanban";

export default async function DesignerProjetPermanentPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const result = await getOrCreateUser(userId);
  if (!result.success || !result.data) {
    return <ProjetPermanentResponsableKanban initialTaches={[]} variant="designer" />;
  }

  const role = result.data.role;

  if (role && role !== UserRole.DESIGNER) {
    const redirectPath = getRedirectForRole(role);
    if (redirectPath) {
      redirect(redirectPath);
    }
  }

  const tachesResult = await getTachesForCurrentResponsable(userId);

  return (
    <ProjetPermanentResponsableKanban
      initialTaches={tachesResult.success ? tachesResult.taches : []}
      variant="designer"
    />
  );
}
