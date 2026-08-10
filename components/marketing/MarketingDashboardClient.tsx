"use client";

import CommunityManagerDashboardClient from "@/components/communityManager/CommunityManagerDashboardClient";
import {
  getMarketingDashboard,
  type MarketingDashboardData,
} from "@/lib/actions/marketing-dashboard";

type Props = {
  initialData: MarketingDashboardData;
  initialError: string | null;
};

export default function MarketingDashboardClient({
  initialData,
  initialError,
}: Props) {
  return (
    <CommunityManagerDashboardClient
      initialData={initialData}
      initialError={initialError}
      brandLabel="Marketing"
      refreshAction={getMarketingDashboard}
    />
  );
}
