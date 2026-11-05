import { notFound } from "next/navigation";
import BonDeCommandeDocument from "@/app/(dashboard)/commercial/bon-de-commande/BonDeCommandeDocument";
import { getMaLettreValide, listMesLettresDejaValides, type DossierBonOption } from "@/lib/bon-commande-lecture";

export const dynamic = "force-dynamic";

const BASE = "/commercial/lettre-commande-deja-valide";

function PageHeading({ count }: { count: number }) {
  const detail = count === 0 ? "Aucune lettre pour le moment" : `${count} lettre${count > 1 ? "s" : ""}`;

  return (
    <header className="print-hide bg-[#f6f1e6] px-4 pt-4">
      <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#ead7a2] bg-white px-5 py-4 shadow-[0_10px_28px_rgba(17,17,17,0.06)]">
        <div className="min-w-0 border-l-4 border-[#e7b84a] pl-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e36a12]">Mes lettres</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-[#111] sm:text-[1.65rem]">
            Lettres déjà validées
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

export default async function MesLettresDejaValidesPage({
  searchParams,
}: {
  searchParams: Promise<{ facture?: string }>;
}) {
  const { facture } = await searchParams;
  const lettres = await listMesLettresDejaValides();
  const opened = facture ? await getMaLettreValide(facture) : null;
  const inList = Boolean(facture && lettres.some((lettre) => lettre.factureId === facture));
  const valide = inList && opened?.selected?.bon?.statut === "VALIDE" ? opened : null;
  const factureId = valide?.selected ? facture : lettres[0]?.factureId;
  const dossiers: DossierBonOption[] = lettres.map((lettre) => ({
    id: lettre.factureId,
    numero: lettre.numero,
    nomCourt: lettre.client,
    prospectNom: lettre.client,
    prospectType: "CLIENT",
    proformaCount: 1,
    bonCount: 1,
    derniereProforma: null,
    totalTtc: lettre.totalTtc,
  }));

  if (!factureId) {
    return (
      <>
        <PageHeading count={lettres.length} />
        <BonDeCommandeDocument
          source={null}
          dossiers={[]}
          validation
          documentTitle="LETTRE DE COMMANDE"
          basePath={BASE}
          emptyText="Aucune lettre de commande déjà validée par le responsable commercial."
        />
      </>
    );
  }

  const source = factureId === facture && valide ? valide : await getMaLettreValide(factureId);
  if (!source?.selected || source.selected.bon?.statut !== "VALIDE") notFound();

  return (
    <>
      <PageHeading count={lettres.length} />
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
        documentTitle="LETTRE DE COMMANDE"
        basePath={BASE}
      />
    </>
  );
}
