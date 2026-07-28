import { AlertCircle } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import CommunityManagerDashboardClient from "@/components/communityManager/CommunityManagerDashboardClient";
import { Card, CardContent } from "@/components/ui/card";
import { getCommunityManagerDashboard } from "@/lib/actions/community-manager-dashboard";
import { getOrCreateUser } from "@/lib/actions/user";
import { getRedirectForRole } from "@/lib/role-redirects";

export const metadata: Metadata = {
  title: "Dashboard | Community Manager",
  description:
    "Tableau de bord community manager — projets ponctuels et activités de routine",
};

export default async function CommunityManagerPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const result = await getOrCreateUser(userId);
  const role = result.data?.role;

  if (role && role !== UserRole.COMMUNITY_MANAGER) {
    const redirectPath = getRedirectForRole(role);
    if (redirectPath) {
      redirect(redirectPath);
    }
  }

  const dashboardResult = await getCommunityManagerDashboard(userId);

  if (!dashboardResult.success && dashboardResult.data.projetsPonctuels.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <Card className="max-w-md border-rose-200 bg-rose-50/50">
          <CardContent className="flex items-center gap-4 p-6">
            <AlertCircle className="h-8 w-8 shrink-0 text-rose-500" />
            <div>
              <p className="font-semibold text-rose-900">
                Impossible de charger le tableau de bord
              </p>
              <p className="mt-1 text-sm text-rose-700">
                {dashboardResult.error ?? "Une erreur inattendue s'est produite."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <CommunityManagerDashboardClient
      initialData={dashboardResult.data}
      initialError={dashboardResult.success ? null : dashboardResult.error}
    />
  );
}
