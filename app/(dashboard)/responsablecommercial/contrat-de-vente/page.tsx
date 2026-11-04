import { notFound, redirect } from "next/navigation";
import ContratDeVenteDocument from "@/app/(dashboard)/commercial/dossier-clientele/[id]/ContratDeVenteDocument";
import { getContratPourValidation, listContratsAValider } from "@/lib/actions/contrat-vente";
import type { DossierBonOption } from "@/lib/actions/bondecommande";

export const dynamic = "force-dynamic";

const BASE = "/responsablecommercial/contrat-de-vente";
const DEJA_VALIDE = "/responsablecommercial/contrat-de-vente-deja-valide";

export default async function ResponsableContratDeVentePage({
  searchParams,
}: {
  searchParams: Promise<{ facture?: string }>;
}) {
  const { facture } = await searchParams;
  const contrats = await listContratsAValider();
  const opened = facture ? await getContratPourValidation(facture) : null;
  if (opened?.selected?.contrat?.etapeValidation === "VALIDE") {
    redirect(`${DEJA_VALIDE}?facture=${facture}`);
  }
  const factureId =
    opened?.selected && contrats.some((contrat) => contrat.factureId === facture) ? facture : contrats[0]?.factureId;
  const dossiers: DossierBonOption[] = contrats.map((contrat) => ({
    id: contrat.factureId,
    numero: contrat.modele || "Contrat",
    nomCourt: contrat.client,
    prospectNom: [contrat.client, contrat.commercial].filter(Boolean).join(" · "),
    prospectType: "CLIENT",
    proformaCount: 1,
    bonCount: 1,
    derniereProforma: null,
    totalTtc: contrat.totalTtc,
  }));
  if (opened?.selected && facture && !dossiers.some((item) => item.id === facture)) {
    dossiers.unshift({
      id: facture,
      numero: opened.selected.vehicule?.modele || opened.dossier.numero,
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
      <ContratDeVenteDocument
        source={null}
        dossiers={[]}
        validation
        basePath={BASE}
      />
    );
  }

  const source = factureId === facture && opened ? opened : await getContratPourValidation(factureId);
  if (!source?.selected) notFound();

  return (
    <ContratDeVenteDocument
      source={{
        ...source,
        dossier: {
          ...source.dossier,
          id: factureId,
        },
      }}
      dossiers={dossiers}
      validation
      basePath={BASE}
      validatedPath={DEJA_VALIDE}
      activeFactureId={factureId}
    />
  );
}
