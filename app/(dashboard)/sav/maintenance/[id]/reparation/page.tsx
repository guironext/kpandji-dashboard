import { redirect } from "next/navigation";

export default async function MaintenanceReparationRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/sav/maintenance/tabMaintenance/${id}`);
}
