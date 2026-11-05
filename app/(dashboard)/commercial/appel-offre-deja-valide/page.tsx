import { notFound } from "next/navigation";
import BonDeCommandeDocument from "@/app/(dashboard)/commercial/bon-de-commande/BonDeCommandeDocument";
import { getMonAppelValide, listMesAppelsDejaValides, type DossierBonOption } from "@/lib/bon-commande-lecture";

export const dynamic = "force-dynamic";

const BASE = "/commercial/appel-offre-deja-valide";
const VALIDES = new Set(["VALIDE", "VALIDE_APPORT_INITIAL"]);

function estValide(statut: string | undefined) {
  return Boolean(statut && VALIDES.has(statut));
}

function PageHeading({ count }: { count: number }) {
  const detail =
    count === 0 ? "Aucun appel d'offre pour le moment" : `${count} appel${count > 1 ? "s" : ""} d'offre`;

  return (
    <header className="print-hide bg-[#f6f1e6] px-4 pt-4">
      <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#ead7a2] bg-white px-5 py-4 shadow-[0_10px_28px_rgba(17,17,17,0.06)]">
        <div className="min-w-0 border-l-4 border-[#e7b84a] pl-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e36a12]">Mes appels d&apos;offre</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-[#111] sm:text-[1.65rem]">
            Appels d&apos;offre déjà validés
          </h1>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-[#111] px-4 py-3">
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#e7b84a]">Quantité</p>
            <p className="mt-1 text-xs text-white/70">{detail}</p>
          </div>
          <p className="text-4xl font-bold leading-none tabular-nums text-[#e7b84a]">{count}</p>
        </div>
      </div>
    </header>
  );
}

export default async function MesAppelsDejaValidesPage({
  searchParams,
}: {
  searchParams: Promise<{ facture?: string }>;
}) {
  const { facture } = await searchParams;
  const appels = await listMesAppelsDejaValides();
  const opened = facture ? await getMonAppelValide(facture) : null;
  const inList = Boolean(facture && appels.some((appel) => appel.factureId === facture));
  const valide = inList && estValide(opened?.selected?.bon?.statut) ? opened : null;
  const factureId = valide?.selected ? facture : appels[0]?.factureId;
  const dossiers: DossierBonOption[] = appels.map((appel) => ({
    id: appel.factureId,
    numero: appel.numero,
    nomCourt: appel.client,
    prospectNom: appel.client,
    prospectType: "CLIENT",
    proformaCount: 1,
    bonCount: 1,
    derniereProforma: null,
    totalTtc: appel.totalTtc,
  }));

  if (!factureId) {
    return (
      <>
        <PageHeading count={appels.length} />
        <BonDeCommandeDocument
          source={null}
          dossiers={[]}
          validation
          documentTitle="APPEL D'OFFRE"
          basePath={BASE}
          emptyText="Aucun appel d'offre déjà validé par le responsable commercial."
        />
      </>
    );
  }

  const source = factureId === facture && valide ? valide : await getMonAppelValide(factureId);
  if (!source?.selected || !estValide(source.selected.bon?.statut)) notFound();

  return (
    <>
      <PageHeading count={appels.length} />
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
        documentTitle="APPEL D'OFFRE"
        basePath={BASE}
      />
    </>
  );
}
