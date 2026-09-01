import MaintenanceReparationClient from "./MaintenanceReparationClient";

export default async function MaintenanceTabReparationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MaintenanceReparationClient id={id} />;
}
