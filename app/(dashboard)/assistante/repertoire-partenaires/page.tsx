import React from "react";

import { getAllPartenaires } from "@/lib/actions/partenaire";

import RepertoirePartenairesClient, {
  type SerializedPartenaire,
} from "./RepertoirePartenairesClient";

export default async function RepertoirePartenairesPage() {
  const res = await getAllPartenaires();
  if (!res.success) {
    return <RepertoirePartenairesClient initialPartenaires={[]} loadError />;
  }
  return (
    <RepertoirePartenairesClient
      initialPartenaires={res.data as SerializedPartenaire[]}
    />
  );
}
