import Link from "next/link";
import { notFound } from "next/navigation";
import BonDeCommandeDocument from "@/app/(dashboard)/commercial/bon-de-commande/BonDeCommandeDocument";
import { getBonCommandePourValidation, listBonsAValider } from "@/lib/bon-commande-lecture";
import { formatNumberWithSpaces } from "@/lib/utils";
import LegacyBonDeCommande from "./LegacyBonDeCommande";

export const dynamic = "force-dynamic";

const STATUT: Record<string, string> = {
  A_VALIDER: "À valider",
  EN_VALIDATION: "Validation en cours",
  SOUS_RESERVE: "Sous réserve",
  VALIDE: "Validé",
  VALIDE_APPORT_INITIAL: "Validé — apport initial",
};

export default async function ResponsableBonDeCommandePage({
  searchParams,
}: {
  searchParams: Promise<{ facture?: string }>;
}) {
  const { facture } = await searchParams;
  if (facture) {
    const source = await getBonCommandePourValidation(facture);
    if (!source?.selected) notFound();
    return <BonDeCommandeDocument source={source} dossiers={[]} validation />;
  }

  const bons = await listBonsAValider();

  return (
    <div>
      <section className="print-hide border-b border-[#e7b84a] bg-[#f6f1e6] px-4 py-5">
        <h1 className="text-lg font-semibold text-[#111]">Bons de commande à valider</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-700">
          Les bons envoyés avec « Faire Valider » apparaissent ici. Ouvrez un bon pour le consulter et commencer la validation.
        </p>
        {bons.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed border-slate-400 bg-white px-4 py-6 text-sm text-slate-600">
            Aucun bon en attente de validation.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-md border border-[#111] bg-white">
            {bons.map((bon) => (
              <li key={bon.factureId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-semibold text-[#111]">{bon.numero}</p>
                  <p className="text-sm text-slate-700">
                    {bon.client}
                    {bon.modele ? ` · ${bon.modele}` : ""}
                    {bon.commercial ? ` · ${bon.commercial}` : ""}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatNumberWithSpaces(bon.totalTtc)} F CFA · {STATUT[bon.statut] ?? bon.statut}
                  </p>
                </div>
                <Link
                  href={`/responsablecommercial/bon-de-commande?facture=${bon.factureId}`}
                  className="rounded-md bg-[#111] px-3 py-2 text-sm font-semibold text-[#e7b84a]"
                >
                  {bon.statut === "A_VALIDER" ? "Voir et valider" : "Voir le bon"}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <LegacyBonDeCommande />
    </div>
  );
}
