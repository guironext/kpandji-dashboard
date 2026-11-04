import { notFound } from "next/navigation";
import BonDeCommandeDocument from "@/app/(dashboard)/commercial/bon-de-commande/BonDeCommandeDocument";
import {
  getBonCommandePourValidation,
  listBonsAValider,
  type DossierBonOption,
} from "@/lib/bon-commande-lecture";

export const dynamic = "force-dynamic";

export default async function ResponsableBonDeCommandePage({
  searchParams,
}: {
  searchParams: Promise<{ facture?: string }>;
}) {
  const { facture } = await searchParams;
  const bons = await listBonsAValider();
  const opened = facture ? await getBonCommandePourValidation(facture) : null;
  const factureId = opened?.selected ? facture : bons[0]?.factureId;
  const dossiers: DossierBonOption[] = bons.map((bon) => ({
    id: bon.factureId,
    numero: bon.numero,
    nomCourt: bon.client,
    prospectNom: [bon.client, bon.commercial].filter(Boolean).join(" · "),
    prospectType: "CLIENT",
    proformaCount: 1,
    bonCount: 1,
    derniereProforma: null,
    totalTtc: bon.totalTtc,
  }));
  if (opened?.selected && facture && !dossiers.some((item) => item.id === facture)) {
    dossiers.unshift({
      id: facture,
      numero: opened.selected.bon?.numero || opened.dossier.numero,
      nomCourt: opened.selected.client.nom,
      prospectNom: [opened.selected.client.nom, opened.selected.commercial.nom].filter(Boolean).join(" · "),
      prospectType: opened.selected.client.kind,
      proformaCount: 1,
      bonCount: 1,
      derniereProforma: null,
      totalTtc: opened.selected.prix.totalTtc,
    });
  }

  if (!factureId) {
    return (
      <BonDeCommandeDocument
        source={null}
        dossiers={[]}
        validation
        basePath="/responsablecommercial/bon-de-commande"
      />
    );
  }

  const source = await getBonCommandePourValidation(factureId);
  if (!source?.selected) notFound();

  return (
    <BonDeCommandeDocument
      source={{
        ...source,
        dossier: {
          ...source.dossier,
          id: factureId,
        },
      }}
      dossiers={dossiers}
      validation
      basePath="/responsablecommercial/bon-de-commande"
    />
  );
}

