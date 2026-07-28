import { auth } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/actions/user";
import { getRedirectForRole } from "@/lib/role-redirects";
import { getTachesForCurrentResponsable } from "@/lib/actions/tache-activite-projet-routine";
import ProjetPermanentResponsableSplit from "@/components/projet-permanent/ProjetPermanentResponsableSplit";

export default async function MarketingProjetsPermanentsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const result = await getOrCreateUser(userId);
  if (!result.success || !result.data) {
    return <ProjetPermanentResponsableSplit initialTaches={[]} />;
  }

  const role = result.data.role;

  if (role && role !== UserRole.MARKETING) {
    const redirectPath = getRedirectForRole(role);
    if (redirectPath) {
      redirect(redirectPath);
    }
  }

  const tachesResult = await getTachesForCurrentResponsable(userId);

  return (
    <ProjetPermanentResponsableSplit
      initialTaches={tachesResult.success ? tachesResult.taches : []}
    />
  );
}
