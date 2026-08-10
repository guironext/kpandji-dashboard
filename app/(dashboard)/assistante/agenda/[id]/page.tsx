import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import { loadRapportPageInitialData } from "@/lib/assistante/load-rapport-page-initial";
import { RapportPageInner } from "@/app/(dashboard)/assistante/rapport/RapportPageInner";

export default async function AgendaRapportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const serverInitial = await loadRapportPageInitialData(id);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-50 via-white to-indigo-50/50 px-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-600">Chargement…</p>
        </div>
      }
    >
      <RapportPageInner activityIdFromRoute={id} serverInitial={serverInitial} />
    </Suspense>
  );
}
