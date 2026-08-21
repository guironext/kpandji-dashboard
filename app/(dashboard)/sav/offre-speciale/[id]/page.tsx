import OffreSpecialeDetailClient from "./OffreSpecialeDetailClient";

export default async function OffreSpecialeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OffreSpecialeDetailClient id={id} />;
}
