import { getDossiersPourResponsable } from "@/lib/actions/dossier-clientele";
import DossiersResponsableView from "./DossiersResponsableView";

export const dynamic = "force-dynamic";

export default async function DossierClienteleResponsablePage() {
  const dossiers = await getDossiersPourResponsable();
  return <DossiersResponsableView dossiers={dossiers} />;
}
