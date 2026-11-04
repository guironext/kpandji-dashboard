"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";
import { createRapportVisite } from "@/lib/actions/rapport-visite-clientele";
import { BARRIERES_DECISION, CONCLUSION_CRITERES, emptyConclusion, type ConclusionKey } from "./visite-options";

export type ProspectOption = { id: string; type: "CLIENT" | "ENTREPRISE"; nom: string };
export type ModeleOption = { id: string; model: string };

const field = "w-full min-h-11 rounded-lg border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-amber-500";

export const VEHICULES: { categorie: string; types: string[] }[] = [
  { categorie: "Citadines", types: ["Petite voiture", "Compacte"] },
  { categorie: "Berlines", types: ["Berline", "Berline de luxe"] },
  { categorie: "SUV", types: ["SUV compact", "SUV moyen", "Grand SUV"] },
  { categorie: "Pick-up", types: ["Simple cabine", "Double cabine"] },
  { categorie: "Utilitaires", types: ["Fourgon", "Fourgonnette"] },
  { categorie: "Familiales", types: ["Monospace", "Minivan"] },
  { categorie: "Sportives", types: ["Coupé", "Cabriolet"] },
  { categorie: "Tout-terrain", types: ["4x4", "Véhicule off-road"] },
  { categorie: "Électriques", types: ["Citadine électrique", "SUV électrique"] },
];

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export const MODES_ACQUISITION: { titre: string; description: string }[] = [
  {
    titre: "Achat au comptant",
    description: "Le client paie la totalité du prix du véhicule en une seule fois (paiement intégral).",
  },
  {
    titre: "Achat à tempérament",
    description: "Le client verse un apport initial, puis rembourse le solde en plusieurs mensualités selon une durée convenue.",
  },
  {
    titre: "Location avec option d'achat (LOA)",
    description: "Le client loue le véhicule pendant une période définie et peut l'acheter à la fin en payant une valeur résiduelle.",
  },
  {
    titre: "Location longue durée (LLD)",
    description: "Le client utilise le véhicule contre un loyer mensuel pendant une période déterminée, sans obligation de l'acheter à la fin.",
  },
  {
    titre: "Crédit automobile",
    description: "Une banque ou un organisme financier finance le véhicule. Le client rembourse le financement avec les intérêts éventuels.",
  },
  {
    titre: "Reprise de véhicule",
    description: "Le client remet son ancien véhicule en échange d'un nouveau. La valeur de reprise est déduite du prix du nouveau véhicule.",
  },
  {
    titre: "Acquisition sur réservation",
    description: "Le client réserve un véhicule en versant un acompte. Le véhicule est ensuite fabriqué, assemblé ou approvisionné avant livraison.",
  },
];

function Chips({ options, value, onChange }: { options: { id: string; label: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  if (options.length === 0) return <p className="text-sm text-gray-500">Aucun modèle disponible.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.id);
        return (
          <button key={o.id} type="button" onClick={() => onChange(toggle(value, o.id))}
            className={`rounded-full border px-3 py-1.5 text-sm ${on ? "border-amber-500 bg-amber-100 text-amber-900" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default function RapportVisiteForm({
  prospects, modeles, prefill,
}: { prospects: ProspectOption[]; modeles: ModeleOption[]; prefill?: { prospectId: string; prospectType: string } }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const today = new Date().toISOString().slice(0, 10);
  const initKey = prefill ? `${prefill.prospectType}:${prefill.prospectId}` : "";
  const [date, setDate] = useState(today);
  const [prospect, setProspect] = useState(initKey);
  const [activites, setActivites] = useState<string[]>([""]);
  const [types, setTypes] = useState<string[]>([]);
  const [presentes, setPresentes] = useState<string[]>([]);
  const [retenus, setRetenus] = useState<string[]>([]);
  const [lieu, setLieu] = useState("");
  const [testDrive, setTestDrive] = useState<boolean | null>(null);
  const [modes, setModes] = useState<string[]>([]);
  const [barrieres, setBarrieres] = useState<string[]>([]);
  const [conclusion, setConclusion] = useState(emptyConclusion);

  function openForm() {
    setError(null); setDate(today); setProspect(initKey); setActivites([""]); setTypes([]);
    setPresentes([]); setRetenus([]); setLieu(""); setTestDrive(null); setModes([]);
    setBarrieres([]); setConclusion(emptyConclusion()); setOpen(true);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const [prospectType, prospectId] = prospect.split(":");
    if (!prospectId) return setError("Veuillez sélectionner un prospect");
    if (testDrive === null) return setError("Indiquez si un test drive a été proposé");
    if (CONCLUSION_CRITERES.some((c) => conclusion[c.id] === null)) {
      return setError("Complétez la conclusion concernant le prospect");
    }
    setError(null);
    start(async () => {
      const res = await createRapportVisite({
        date, prospectId, prospectType: prospectType as "CLIENT" | "ENTREPRISE",
        activites: activites.map((a) => a.trim()).filter(Boolean),
        typesVehicules: types, modelesPresentes: presentes, modelesRetenus: retenus,
        lieuRencontre: lieu, testDrivePropose: testDrive, modesAcquisition: modes,
        barrieresDecision: barrieres,
        conclusion: conclusion as Record<ConclusionKey, boolean>,
      });
      if (!res.success) return setError(res.error);
      setOpen(false);
      router.refresh();
    });
  }

  const modeleOpts = modeles.map((m) => ({ id: m.id, label: m.model }));

  return (
    <>
      {prefill ? (
        <button type="button" onClick={openForm}
          className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-amber-500 px-3 text-sm font-semibold text-black hover:bg-amber-400">
          <Plus className="h-4 w-4" /> Autre visite
        </button>
      ) : (
        <button type="button" onClick={openForm}
          className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 font-semibold text-black hover:bg-amber-400">
          <Plus className="h-4 w-4" /> Nouvelle visite chez nouveau prospect
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
          <form onSubmit={onSubmit} onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl bg-white p-5 text-black space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Rapport de visite</h2>
              <button type="button" onClick={() => setOpen(false)} className="p-2" aria-label="Fermer"><X className="h-5 w-5" /></button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-sm font-bold">Date *</span>
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={field} />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-bold">Nom du Prospect *</span>
                {prospects.length === 0 ? (
                  <p className="rounded-lg border border-dashed px-3 py-2 text-sm text-gray-500">
                    Aucun prospect créé par vous.
                  </p>
                ) : (
                  <select required value={prospect} onChange={(e) => setProspect(e.target.value)} className={field}>
                    <option value="">— Sélectionner un prospect —</option>
                    {prospects.map((p) => (
                      <option key={`${p.type}:${p.id}`} value={`${p.type}:${p.id}`}>
                        {p.nom}{p.type === "ENTREPRISE" ? " (entreprise)" : ""}
                      </option>
                    ))}
                  </select>
                )}
              </label>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-bold">Activité réalisée par le prospect</span>
              {activites.map((a, i) => (
                <div key={i} className="flex gap-2">
                  <input value={a} onChange={(e) => setActivites(activites.map((x, j) => (j === i ? e.target.value : x)))}
                    className={field} placeholder={`Activité ${i + 1}`} />
                  {activites.length > 1 && (
                    <button type="button" aria-label="Retirer" onClick={() => setActivites(activites.filter((_, j) => j !== i))}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setActivites([...activites, ""])} className="text-sm font-medium text-amber-700 hover:underline">
                + Ajouter une activité
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-bold">Type de voiture utilisés par le prospect</span>
              <div className="grid gap-2 sm:grid-cols-2">
                {VEHICULES.map((c) => (
                  <div key={c.categorie} className="rounded-lg border p-2">
                    <p className="text-xs font-semibold uppercase text-gray-500">{c.categorie}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      {c.types.map((t) => {
                        const v = `${c.categorie} – ${t}`;
                        return (
                          <label key={v} className="inline-flex items-center gap-1.5 text-sm">
                            <input type="checkbox" checked={types.includes(v)} onChange={() => setTypes(toggle(types, v))} className="accent-amber-500" />
                            {t}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-bold">Modèle Kpandji présenté</span>
              <Chips options={modeleOpts} value={presentes} onChange={setPresentes} />
            </div>
            <div className="space-y-2">
              <span className="text-sm font-bold">Modèle Kpandji retenu</span>
              <Chips options={modeleOpts} value={retenus} onChange={setRetenus} />
            </div>

            <label className="block space-y-1">
              <span className="text-sm font-bold">Lieu de rencontre</span>
              <input value={lieu} onChange={(e) => setLieu(e.target.value)} className={field} />
            </label>

            <fieldset className="space-y-2">
              <legend className="text-sm font-bold">Test drive proposé *</legend>
              <div className="flex gap-2">
                {([{ label: "Oui", value: true }, { label: "Non", value: false }] as const).map((opt) => (
                  <label key={opt.label} className={`inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-lg border px-4 text-sm font-medium ${testDrive === opt.value ? "border-amber-500 bg-amber-100 text-amber-900" : "border-gray-300 bg-white text-gray-700"}`}>
                    <input type="radio" name="testDrive" className="sr-only" checked={testDrive === opt.value} onChange={() => setTestDrive(opt.value)} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-bold">Mode d&apos;acquisition de véhicules</legend>
              <div className="space-y-2">
                {MODES_ACQUISITION.map((mode) => {
                  const on = modes.includes(mode.titre);
                  return (
                    <label key={mode.titre} className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${on ? "border-amber-500 bg-amber-50" : "border-gray-200 bg-white"}`}>
                      <input type="checkbox" checked={on} onChange={() => setModes(toggle(modes, mode.titre))} className="mt-1 accent-amber-500" />
                      <span>
                        <span className="block text-sm font-medium">{mode.titre}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-gray-600">{mode.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-bold">Barrière à la décision du prospect</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {BARRIERES_DECISION.map((item) => (
                  <label key={item} className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 text-sm ${barrieres.includes(item) ? "border-amber-500 bg-amber-50" : "border-gray-200 bg-white"}`}>
                    <input type="checkbox" checked={barrieres.includes(item)} onChange={() => setBarrieres(toggle(barrieres, item))} className="mt-0.5 accent-amber-500" />
                    {item}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-bold">Conclusion concernant le prospect</legend>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <div className="hidden grid-cols-[1fr_auto] gap-3 bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:grid">
                  <span>Critères</span>
                  <span>Évaluation</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {CONCLUSION_CRITERES.map((critere) => (
                    <div key={critere.id} className="grid gap-2 px-3 py-2.5 sm:grid-cols-[1fr_auto] sm:items-center">
                      <span className="text-sm font-bold">{critere.label}</span>
                      <div className="flex gap-2">
                        {([{ label: "Oui", value: true }, { label: "Non", value: false }] as const).map((opt) => (
                          <label key={opt.label} className={`inline-flex min-h-9 min-w-16 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm ${conclusion[critere.id] === opt.value ? "border-amber-500 bg-amber-100 text-amber-900" : "border-gray-300 bg-white text-gray-700"}`}>
                            <input
                              type="radio"
                              name={`conclusion-${critere.id}`}
                              className="sr-only"
                              checked={conclusion[critere.id] === opt.value}
                              onChange={() => setConclusion({ ...conclusion, [critere.id]: opt.value })}
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </fieldset>

            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-lg border px-4">Annuler</button>
              <button type="submit" disabled={pending} className="min-h-11 rounded-lg bg-black px-4 font-semibold text-white disabled:opacity-50">
                {pending ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
