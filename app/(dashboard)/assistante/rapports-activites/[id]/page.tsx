import React from "react";
import { notFound } from "next/navigation";

import { loadRapportActiviteDetail } from "@/lib/assistante/load-rapports-activites";
import { RapportActiviteDetailClient } from "./RapportActiviteDetailClient";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function RapportActiviteViewPage({ params }: PageProps) {
  const { id } = await params;
  const res = await loadRapportActiviteDetail(id);

  if (res.status === "unauthorized") {
    return (
      <div className="p-6 text-sm text-slate-600">
        Vous devez être connecté pour consulter ce rapport.
      </div>
    );
  }
  if (res.status === "not_found") {
    notFound();
  }

  return (
    <RapportActiviteDetailClient
      activity={res.data.activity}
      rapportSerialized={res.data.rapportSerialized}
      updatedAt={res.data.updatedAt}
    />
  );
}
