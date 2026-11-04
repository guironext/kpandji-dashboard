import { notFound } from "next/navigation";
import DossierFiche from "@/app/(dashboard)/commercial/dossier-clientele/[id]/DossierFiche";
import { getDossierFiche } from "@/lib/actions/dossier-clientele";
import { getBonCommandeSource } from "@/lib/bon-commande-lecture";
import { peutValiderAutresVersements } from "@/lib/actions/bondecommande";

export const dynamic = "force-dynamic";

export default async function ResponsableDossierClientelePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ facture?: string; section?: string }>;
}) {
  const { id } = await params;
  const { facture, section } = await searchParams;
  const [fiche, bonSource, peutValiderVersements] = await Promise.all([
    getDossierFiche(id),
    getBonCommandeSource(id, facture, { unrestricted: true }),
    peutValiderAutresVersements(),
  ]);
  if (!fiche) notFound();
  const openReponse = Boolean(facture) || section === "contrat";
  return (
    <DossierFiche
      fiche={fiche}
      bonSource={bonSource}
      initialTab={openReponse ? "reponse" : "profil"}
      initialSection={section === "contrat" ? "contrat" : "bon-commande"}
      peutValiderVersements={peutValiderVersements}
      dossierPath="/responsablecommercial/dossier-clientele"
    />
  );
}
