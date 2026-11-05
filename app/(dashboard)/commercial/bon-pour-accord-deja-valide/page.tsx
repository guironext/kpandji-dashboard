import { notFound } from "next/navigation";
import BonDeCommandeDocument from "@/app/(dashboard)/commercial/bon-de-commande/BonDeCommandeDocument";
import {
  getMonBonPourAccordValide,
  listMesBonsPourAccordDejaValides,
  type DossierBonOption,
} from "@/lib/bon-commande-lecture";

export const dynamic = "force-dynamic";

const BASE = "/commercial/bon-pour-accord-deja-valide";
const VALIDES = new Set(["VALIDE", "VALIDE_APPORT_INITIAL"]);

function estValide(statut: string | undefined) {
  return Boolean(statut && VALIDES.has(statut));
}

function PageHeading({ count, apport }: { count: number; apport: number }) {
  const valides = Math.max(0, count - apport);
  const detail =
    count === 0
      ? "Aucun bon pour le moment"
      : [
          valides > 0 ? `${valides} validé${valides > 1 ? "s" : ""}` : null,
          apport > 1 ? `${apport} apports initiaux` : apport === 1 ? "1 apport initial" : null,
        ]
          .filter(Boolean)
          .join(" · ");

  return (
    <header className="print-hide bg-[#f6f1e6] px-4 pt-4">
      <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#ead7a2] bg-white px-5 py-4 shadow-[0_10px_28px_rgba(17,17,17,0.06)]">
        <div className="min-w-0 border-l-4 border-[#e7b84a] pl-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e36a12]">Mes accords</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-[#111] sm:text-[1.65rem]">
            Bon pour accord déjà validés
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

export default async function MesBonsPourAccordDejaValidesPage({
  searchParams,
}: {
  searchParams: Promise<{ facture?: string }>;
}) {
  const { facture } = await searchParams;
  const bons = await listMesBonsPourAccordDejaValides();
  const apport = bons.filter((bon) => bon.statut === "VALIDE_APPORT_INITIAL").length;
  const opened = facture ? await getMonBonPourAccordValide(facture) : null;
  const inList = Boolean(facture && bons.some((bon) => bon.factureId === facture));
  const valide = inList && estValide(opened?.selected?.bon?.statut) ? opened : null;
  const factureId = valide?.selected ? facture : bons[0]?.factureId;
  const dossiers: DossierBonOption[] = bons.map((bon) => ({
    id: bon.factureId,
    numero: bon.numero,
    nomCourt: bon.client,
    prospectNom: bon.client,
    prospectType: "CLIENT",
    proformaCount: 1,
    bonCount: 1,
    derniereProforma: null,
    totalTtc: bon.totalTtc,
  }));

  if (!factureId) {
    return (
      <>
        <PageHeading count={bons.length} apport={apport} />
        <BonDeCommandeDocument
          source={null}
          dossiers={[]}
          validation
          documentTitle="BON POUR ACCORD"
          basePath={BASE}
          emptyText="Aucun bon pour accord déjà validé par le responsable commercial."
        />
      </>
    );
  }

  const source = factureId === facture && valide ? valide : await getMonBonPourAccordValide(factureId);
  if (!source?.selected || !estValide(source.selected.bon?.statut)) notFound();

  return (
    <>
      <PageHeading count={bons.length} apport={apport} />
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
        documentTitle="BON POUR ACCORD"
        basePath={BASE}
      />
    </>
  );
}
