import { notFound } from "next/navigation";
import BonDeCommandeDocument from "@/app/(dashboard)/commercial/bon-de-commande/BonDeCommandeDocument";
import { getBonCommandeSource, listDossiersPourBonDeCommande } from "@/lib/bon-commande-lecture";

export const dynamic = "force-dynamic";

export default async function AppelOffrePage({
  searchParams,
}: {
  searchParams: Promise<{ dossier?: string; facture?: string }>;
}) {
  const { dossier, facture } = await searchParams;
  const dossiers = await listDossiersPourBonDeCommande();
  const dossierId = dossier ?? dossiers.find((item) => item.proformaCount > 0)?.id;
  const source = dossierId ? await getBonCommandeSource(dossierId, facture) : null;
  if (dossier && !source) notFound();
  return (
    <BonDeCommandeDocument
      source={source}
      dossiers={dossiers}
      documentTitle="APPEL D'OFFRE"
      basePath="/commercial/appel-offre"
    />
  );
}
