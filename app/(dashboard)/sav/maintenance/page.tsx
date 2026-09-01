import MaintenanceClient from "./MaintenanceClient";

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const query = await searchParams;
  const tab = query.tab;
  const initialQueueTab =
    tab === "attente" ||
    tab === "maintenance" ||
    tab === "garantie" ||
    tab === "sortie"
      ? tab
      : "maintenance";
  return <MaintenanceClient initialQueueTab={initialQueueTab} />;
}
