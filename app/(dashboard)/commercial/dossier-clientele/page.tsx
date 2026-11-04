import { getDossiersClientele, getProspectsForDossier } from "@/lib/actions/dossier-clientele";
import DossierClienteleView from "./DossierClienteleView";

export const dynamic = "force-dynamic";

export default async function DossierClientelePage() {
  const [dossiers, prospects] = await Promise.all([getDossiersClientele(), getProspectsForDossier()]);
  return <DossierClienteleView dossiers={dossiers} prospects={prospects} />;
}
