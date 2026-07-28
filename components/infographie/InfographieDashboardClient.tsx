"use client";

import CommunityManagerDashboardClient from "@/components/communityManager/CommunityManagerDashboardClient";
import {
  getInfographieDashboard,
  type InfographieDashboardData,
} from "@/lib/actions/infographie-dashboard";

type Props = {
  initialData: InfographieDashboardData;
  initialError: string | null;
};

export default function InfographieDashboardClient({
  initialData,
  initialError,
}: Props) {
  return (
    <CommunityManagerDashboardClient
      initialData={initialData}
      initialError={initialError}
      brandLabel="Infographie"
      refreshAction={getInfographieDashboard}
    />
  );
}
