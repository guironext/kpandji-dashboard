import type { Metadata } from "next";
import JournalProspectPageClient from "@/components/responsablecommercial/JournalProspectPageClient";
import { getJournalProspectsByCommercial } from "@/lib/actions/journal-prospect";

export const metadata: Metadata = {
  title: "Journal Prospect | Responsable commercial",
  description:
    "Journal des prospects regroupés par commercial, avec fiche détaillée au clic",
};

export default async function JournalProspectPage() {
  const result = await getJournalProspectsByCommercial();

  return (
    <JournalProspectPageClient
      groups={result.data?.groups ?? []}
      totalProspects={result.data?.totalProspects ?? 0}
      totalCommercials={result.data?.totalCommercials ?? 0}
      error={result.success ? undefined : result.error}
    />
  );
}
