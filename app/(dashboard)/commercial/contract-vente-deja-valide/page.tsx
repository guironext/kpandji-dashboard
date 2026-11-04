import { notFound } from "next/navigation";
import ContratDeVenteDocument from "@/app/(dashboard)/commercial/dossier-clientele/[id]/ContratDeVenteDocument";
import { getMonContratValide, listMesContratsDejaValides } from "@/lib/actions/contrat-vente";
import type { DossierBonOption } from "@/lib/bon-commande-lecture";

export const dynamic = "force-dynamic";

const BASE = "/commercial/contract-vente-deja-valide";

function PageHeading({ count }: { count: number }) {
  const detail = count === 0 ? "Aucun contrat pour le moment" : `${count} contrat${count > 1 ? "s" : ""}`;

  return (
    <header className="print-hide bg-[#f6f1e6] px-4 pt-4">
      <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#ead7a2] bg-white px-5 py-4 shadow-[0_10px_28px_rgba(17,17,17,0.06)]">
        <div className="min-w-0 border-l-4 border-[#e7b84a] pl-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e36a12]">Mes contrats</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-[#111] sm:text-[1.65rem]">
            Contrats déjà validés
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

export default async function MesContratsDejaValidesPage({
  searchParams,
}: {
  searchParams: Promise<{ facture?: string }>;
}) {
  const { facture } = await searchParams;
  const contrats = await listMesContratsDejaValides();
  const opened = facture ? await getMonContratValide(facture) : null;
  const inList = Boolean(facture && contrats.some((contrat) => contrat.factureId === facture));
  const valide = inList && opened?.selected?.contrat?.etapeValidation === "VALIDE" ? opened : null;
  const factureId = valide?.selected ? facture : contrats[0]?.factureId;
  const dossiers: DossierBonOption[] = contrats.map((contrat) => ({
    id: contrat.factureId,
    numero: contrat.modele || "Contrat",
    nomCourt: contrat.client,
    prospectNom: contrat.client,
    prospectType: "CLIENT",
    proformaCount: 1,
    bonCount: 1,
    derniereProforma: null,
    totalTtc: contrat.totalTtc,
  }));

  if (!factureId) {
    return (
      <>
        <PageHeading count={contrats.length} />
        <ContratDeVenteDocument
          source={null}
          dossiers={[]}
          validation
          basePath={BASE}
          emptyText="Aucun contrat déjà validé par le responsable commercial."
        />
      </>
    );
  }

  const source = factureId === facture && valide ? valide : await getMonContratValide(factureId);
  if (!source?.selected || source.selected.contrat?.etapeValidation !== "VALIDE") notFound();

  return (
    <>
      <PageHeading count={contrats.length} />
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
      />
    </>
  );
}
