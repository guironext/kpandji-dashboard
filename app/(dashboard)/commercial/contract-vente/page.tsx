import { notFound } from "next/navigation";
import ContratDeVenteDocument from "@/app/(dashboard)/commercial/dossier-clientele/[id]/ContratDeVenteDocument";
import { getBonCommandeSource, listDossiersPourBonDeCommande } from "@/lib/bon-commande-lecture";

export const dynamic = "force-dynamic";

export default async function ContratVentePage({
  searchParams,
}: {
  searchParams: Promise<{ dossier?: string; facture?: string }>;
}) {
  const { dossier, facture } = await searchParams;
  const dossiers = await listDossiersPourBonDeCommande();
  const dossierId = dossier ?? dossiers.find((item) => item.proformaCount > 0)?.id;
  const source = dossierId ? await getBonCommandeSource(dossierId, facture) : null;
  if (dossier && !source) notFound();
  return <ContratDeVenteDocument source={source} dossiers={dossiers} />;
}
