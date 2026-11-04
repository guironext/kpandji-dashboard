"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, CalendarDays, CarFront, MapPin, Search, Trash2, UserRound } from "lucide-react";
import { deleteRapportVisite } from "@/lib/actions/rapport-visite-clientele";
import RapportVisiteForm, { type ModeleOption, type ProspectOption } from "./RapportVisiteForm";
import { CONCLUSION_CRITERES, type ConclusionProspect } from "./visite-options";

export type RapportCard = {
  id: string; date: string; prospectId: string; prospectType: string; prospectNom: string;
  activites: string[]; typesVehicules: string[]; modelesPresentes: string[]; modelesRetenus: string[];
  lieuRencontre: string | null; testDrivePropose: boolean | null; modesAcquisition: string[];
  barrieresDecision: string[]; conclusion: ConclusionProspect | null; auteur: string;
};

function Tags({ items, color }: { items: string[]; color: string }) {
  if (items.length === 0) return <p className="text-sm text-slate-400">—</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className={`rounded-full px-2.5 py-1 text-xs font-medium leading-snug ${color}`}>{item}</span>
      ))}
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      {children}
    </div>
  );
}

function DeleteButton({ id, nom }: { id: string; nom: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button type="button" disabled={pending} aria-label="Supprimer" title="Supprimer"
      onClick={() => {
        if (!confirm(`Supprimer ce rapport de visite pour « ${nom} » ?`)) return;
        start(async () => {
          const res = await deleteRapportVisite(id);
          if (!res.success) alert(res.error);
          router.refresh();
        });
      }}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50">
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

function VisitCard({ r, prospects, modeles }: { r: RapportCard; prospects: ProspectOption[]; modeles: ModeleOption[] }) {
  const entreprise = r.prospectType === "ENTREPRISE";
  const dateLabel = new Date(r.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="relative bg-slate-950 px-4 py-4 text-white">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-amber-200/90">
              {entreprise ? <Building2 className="h-3.5 w-3.5" /> : <UserRound className="h-3.5 w-3.5" />}
              {entreprise ? "Entreprise" : "Particulier"}
            </p>
            <h3 className="mt-1 truncate text-lg font-semibold leading-tight">{r.prospectNom}</h3>
          </div>
          {r.testDrivePropose !== null && (
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${r.testDrivePropose ? "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/30" : "bg-white/10 text-slate-200 ring-1 ring-white/15"}`}>
              Test drive {r.testDrivePropose ? "oui" : "non"}
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-amber-300" />
            {dateLabel}
          </span>
          {r.lieuRencontre && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-amber-300" />
              {r.lieuRencontre}
            </span>
          )}
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <Block label="Activités">
          <Tags items={r.activites} color="bg-slate-100 text-slate-700" />
        </Block>
        <Block label="Véhicules utilisés">
          <Tags items={r.typesVehicules} color="bg-sky-50 text-sky-800" />
        </Block>
        <div className="grid gap-4 sm:grid-cols-2">
          <Block label="Modèles présentés">
            <Tags items={r.modelesPresentes} color="bg-amber-50 text-amber-900" />
          </Block>
          <Block label="Modèles retenus">
            <Tags items={r.modelesRetenus} color="bg-emerald-50 text-emerald-800" />
          </Block>
        </div>
        <Block label="Mode d'acquisition">
          <Tags items={r.modesAcquisition} color="bg-violet-50 text-violet-800" />
        </Block>
        <Block label="Barrières à la décision">
          <Tags items={r.barrieresDecision} color="bg-rose-50 text-rose-800" />
        </Block>
        {r.conclusion && (
          <Block label="Conclusion">
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100">
              {CONCLUSION_CRITERES.map((critere) => (
                <li key={critere.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="text-slate-700">{critere.label}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${r.conclusion?.[critere.id] ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                    {r.conclusion?.[critere.id] ? "Oui" : "Non"}
                  </span>
                </li>
              ))}
            </ul>
          </Block>
        )}
      </div>

      <footer className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3">
        <p className="min-w-0 truncate text-xs text-slate-500">
          <CarFront className="mr-1 inline h-3.5 w-3.5 align-[-2px] text-slate-400" />
          Par {r.auteur}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <RapportVisiteForm prospects={prospects} modeles={modeles} prefill={{ prospectId: r.prospectId, prospectType: r.prospectType }} />
          <DeleteButton id={r.id} nom={r.prospectNom} />
        </div>
      </footer>
    </article>
  );
}

export default function RapportsList({ rapports, prospects, modeles }: { rapports: RapportCard[]; prospects: ProspectOption[]; modeles: ModeleOption[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? rapports.filter((r) => r.prospectNom.toLowerCase().includes(s)) : rapports;
  }, [q, rapports]);

  return (
    <section className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un prospect par nom…"
          className="w-full min-h-11 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
      </div>

      <h2 className="text-lg font-semibold text-slate-900">
        Rapports de visite <span className="text-sm font-normal text-slate-500">({filtered.length})</span>
      </h2>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <CarFront className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 font-medium text-slate-700">
            {rapports.length === 0 ? "Aucun rapport de visite" : "Aucun rapport ne correspond"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {rapports.length === 0 ? "Les visites enregistrées apparaîtront ici." : "Essayez un autre nom de prospect."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((r) => (
            <VisitCard key={r.id} r={r} prospects={prospects} modeles={modeles} />
          ))}
        </div>
      )}
    </section>
  );
}
