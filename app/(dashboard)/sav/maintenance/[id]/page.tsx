import GarantieSavProceedClient from "./GarantieSavProceedClient";

export default async function MaintenanceGarantieProceedPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ detail?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const detailId =
    typeof query.detail === "string" ? query.detail.trim() : "";
  return <GarantieSavProceedClient id={id} initialDetailId={detailId} />;
}
