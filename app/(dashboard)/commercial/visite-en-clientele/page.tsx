import {
  getModelesOptions,
  getProspectsOptions,
  getRapportsVisite,
  type ModeleOption,
  type RapportVisiteRow,
} from "@/lib/actions/rapport-visite-clientele";
import RapportVisiteForm from "./RapportVisiteForm";
import RapportsList from "./RapportsList";
import { readConclusion } from "./visite-options";

export const dynamic = "force-dynamic";

const toArr = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);

export default async function VisiteEnClientelePage() {
  const [prospects, modeles, rapports] = await Promise.all([getProspectsOptions(), getModelesOptions(), getRapportsVisite()]);
  const modelName = new Map<string, string>(
    modeles.map((m: ModeleOption) => [m.id, m.model]),
  );
  const cards = rapports.map((r: RapportVisiteRow) => ({
    id: r.id,
    date: r.date.toISOString(),
    prospectId: r.prospectId,
    prospectType: r.prospectType,
    prospectNom: r.prospectNom,
    activites: toArr(r.activites),
    typesVehicules: toArr(r.typesVehicules),
    modelesPresentes: toArr(r.modelesPresentes).map((id) => modelName.get(id) ?? "Modèle supprimé"),
    modelesRetenus: toArr(r.modelesRetenus).map((id) => modelName.get(id) ?? "Modèle supprimé"),
    lieuRencontre: r.lieuRencontre,
    testDrivePropose: r.testDrivePropose,
    modesAcquisition: toArr(r.modesAcquisition),
    barrieresDecision: toArr(r.barrieresDecision),
    conclusion: readConclusion(r.conclusion),
    auteur: `${r.User.firstName} ${r.User.lastName}`,
  }));

  return (
    <div className="w-full min-w-0 p-4 sm:p-6 space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-black text-white p-5 sm:p-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Visite en clientèle</h1>
          <p className="text-sm text-gray-300">Rapports de visite chez les prospects.</p>
        </div>
        <RapportVisiteForm prospects={prospects} modeles={modeles} />
      </div>
      <RapportsList rapports={cards} prospects={prospects} modeles={modeles} />
    </div>
  );
}
