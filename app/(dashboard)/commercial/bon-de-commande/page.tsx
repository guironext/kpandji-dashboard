import { notFound } from "next/navigation";
import { getBonCommandeSource, listDossiersPourBonDeCommande } from "@/lib/bon-commande-lecture";
import BonDeCommandeDocument from "./BonDeCommandeDocument";

export const dynamic = "force-dynamic";

export default async function BonDeCommandePage({
  searchParams,
}: {
  searchParams: Promise<{ dossier?: string; facture?: string }>;
}) {
  const { dossier, facture } = await searchParams;
  const dossiers = await listDossiersPourBonDeCommande();
  const dossierId = dossier ?? dossiers.find((item) => item.proformaCount > 0)?.id;
  const source = dossierId ? await getBonCommandeSource(dossierId, facture) : null;
  if (dossier && !source) notFound();
  return <BonDeCommandeDocument source={source} dossiers={dossiers} />;
}
