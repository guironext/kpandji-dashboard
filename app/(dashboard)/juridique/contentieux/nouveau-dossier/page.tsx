import { Suspense } from "react";
import ContentieuxPageClient from "@/components/juridique/ContentieuxPageClient";
import { getDossiersContentieux } from "@/lib/actions/contentieux";

const ADMINISTRATIVE_TABS = ["nouveau-dossier", "parties", "documents"] as const;

async function NouveauDossierContentieux() {
  const result = await getDossiersContentieux();
  const dossiers = result.data ?? [];

  return (
    <ContentieuxPageClient
      initialDossiers={dossiers}
      visibleTabs={[...ADMINISTRATIVE_TABS]}
      defaultTab="nouveau-dossier"
      pageTitle="Nouveau dossier contentieux"
      pageDescription="Créez un dossier, enregistrez les parties prenantes et archivez les pièces documentaires liées à un litige."
      heroBadge="Contentieux"
    />
  );
}

export default function NouveauDossierPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">
          Chargement du formulaire contentieux…
        </div>
      }
    >
      <NouveauDossierContentieux />
    </Suspense>
  );
}
