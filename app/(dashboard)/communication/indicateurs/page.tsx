import type { Metadata } from "next";
import { getCommunicationIndicateurs } from "@/lib/actions/communication-indicateurs";
import IndicateursClient from "./IndicateursClient";

export const metadata: Metadata = {
  title: "Indicateurs | Communication",
  description:
    "Indicateurs des projets ponctuels et des activités de routine par statut et responsable",
};

export default async function IndicateursPage() {
  const result = await getCommunicationIndicateurs();

  return (
    <IndicateursClient
      initialData={result.data}
      initialError={result.success ? null : result.error}
    />
  );
}
