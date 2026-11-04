"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FolderOpen, Search } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  NIVEAUX_DOSSIER,
  type DossierResponsableCard,
  type NiveauDossierId,
} from "@/lib/dossier-niveaux";

const COULEURS: Record<NiveauDossierId, string> = {
  ouverture: "#a8a29e",
  visite: "#38bdf8",
  proforma: "#f59e0b",
  reponse: "#8b5cf6",
  paiement: "#10b981",
  "autres-versements": "#14b8a6",
  montage: "#fb923c",
  livraison: "#16a34a",
};

const THEMES: Record<
  NiveauDossierId,
  { tab: string; fold: string; sheet: string; border: string; ink: string; muted: string; chip: string; dot: string }
> = {
  ouverture: {
    tab: "border-stone-400 bg-stone-300 text-stone-900",
    fold: "bg-stone-200",
    sheet: "border-stone-300 bg-gradient-to-b from-stone-50 to-stone-200",
    border: "border-stone-200",
    ink: "text-stone-900",
    muted: "text-stone-600",
    chip: "border-stone-300 bg-white text-stone-800",
    dot: "bg-stone-400",
  },
  visite: {
    tab: "border-sky-500 bg-sky-400 text-sky-950",
    fold: "bg-sky-200",
    sheet: "border-sky-300 bg-gradient-to-b from-sky-50 to-sky-200",
    border: "border-sky-200",
    ink: "text-sky-950",
    muted: "text-sky-800",
    chip: "border-sky-200 bg-white text-sky-900",
    dot: "bg-sky-400",
  },
  proforma: {
    tab: "border-amber-500 bg-amber-400 text-amber-950",
    fold: "bg-amber-200",
    sheet: "border-amber-300 bg-gradient-to-b from-amber-50 to-amber-200",
    border: "border-amber-200",
    ink: "text-amber-950",
    muted: "text-amber-800",
    chip: "border-amber-200 bg-white text-amber-950",
    dot: "bg-amber-400",
  },
  reponse: {
    tab: "border-violet-500 bg-violet-400 text-violet-950",
    fold: "bg-violet-200",
    sheet: "border-violet-300 bg-gradient-to-b from-violet-50 to-violet-200",
    border: "border-violet-200",
    ink: "text-violet-950",
    muted: "text-violet-800",
    chip: "border-violet-200 bg-white text-violet-950",
    dot: "bg-violet-400",
  },
  paiement: {
    tab: "border-emerald-600 bg-emerald-500 text-emerald-950",
    fold: "bg-emerald-200",
    sheet: "border-emerald-300 bg-gradient-to-b from-emerald-50 to-emerald-200",
    border: "border-emerald-200",
    ink: "text-emerald-950",
    muted: "text-emerald-800",
    chip: "border-emerald-200 bg-white text-emerald-950",
    dot: "bg-emerald-500",
  },
  "autres-versements": {
    tab: "border-teal-600 bg-teal-500 text-teal-950",
    fold: "bg-teal-200",
    sheet: "border-teal-300 bg-gradient-to-b from-teal-50 to-teal-200",
    border: "border-teal-200",
    ink: "text-teal-950",
    muted: "text-teal-800",
    chip: "border-teal-200 bg-white text-teal-950",
    dot: "bg-teal-500",
  },
  montage: {
    tab: "border-orange-500 bg-orange-400 text-orange-950",
    fold: "bg-orange-200",
    sheet: "border-orange-300 bg-gradient-to-b from-orange-50 to-orange-200",
    border: "border-orange-200",
    ink: "text-orange-950",
    muted: "text-orange-800",
    chip: "border-orange-200 bg-white text-orange-950",
    dot: "bg-orange-400",
  },
  livraison: {
    tab: "border-green-700 bg-green-600 text-white",
    fold: "bg-green-300",
    sheet: "border-green-400 bg-gradient-to-b from-green-50 to-green-200",
    border: "border-green-200",
    ink: "text-green-950",
    muted: "text-green-800",
    chip: "border-green-200 bg-white text-green-950",
    dot: "bg-green-600",
  },
};

const LABEL = Object.fromEntries(NIVEAUX_DOSSIER.map((niveau) => [niveau.id, niveau.label])) as Record<
  NiveauDossierId,
  string
>;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function initials(nom: string) {
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const lignes = payload.filter((item) => Number(item.value) > 0);
  if (lignes.length === 0) return null;
  const total = lignes.reduce((sum, item) => sum + Number(item.value), 0);
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-lg">
      <p className="font-bold text-black">{label}</p>
      <ul className="mt-2 space-y-1">
        {lignes.map((item) => (
          <li key={item.name} className="flex items-center justify-between gap-6">
            <span className="inline-flex items-center gap-2 text-gray-700">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="font-semibold tabular-nums text-black">{item.value}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 border-t border-gray-100 pt-2 text-xs font-semibold text-gray-500">
        Total : <span className="tabular-nums text-black">{total}</span>
      </p>
    </div>
  );
}

function EvolutionChart({ dossiers }: { dossiers: DossierResponsableCard[] }) {
  const rows = useMemo(() => {
    const groups = new Map<string, { commercial: string } & Record<NiveauDossierId, number>>();
    for (const dossier of dossiers) {
      let row = groups.get(dossier.commercialId);
      if (!row) {
        row = {
          commercial: dossier.commercialNom,
          ouverture: 0,
          visite: 0,
          proforma: 0,
          reponse: 0,
          paiement: 0,
          "autres-versements": 0,
          montage: 0,
          livraison: 0,
        };
        groups.set(dossier.commercialId, row);
      }
      row[dossier.niveau] += 1;
    }
    return [...groups.values()].sort((a, b) => {
      const total = (row: Record<NiveauDossierId, number>) =>
        NIVEAUX_DOSSIER.reduce((sum, niveau) => sum + row[niveau.id], 0);
      return total(b) - total(a) || a.commercial.localeCompare(b.commercial, "fr");
    });
  }, [dossiers]);

  if (rows.length === 0) return null;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-bold text-black">Dossiers par commercial et par évolution</h2>
      <p className="mt-1 text-sm text-gray-500">Chaque barre empile les dossiers d’un commercial selon leur niveau d’avancement.</p>
      <div className="mt-4" style={{ height: Math.max(280, rows.length * 56 + 72) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }} barSize={22}>
            <CartesianGrid stroke="#e5e7eb" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="commercial"
              width={148}
              tick={{ fill: "#111827", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: string) => (value.length > 18 ? `${value.slice(0, 17)}…` : value)}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            {NIVEAUX_DOSSIER.map((niveau) => (
              <Bar key={niveau.id} dataKey={niveau.id} name={niveau.label} stackId="dossiers" fill={COULEURS[niveau.id]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function FolderCard({ dossier }: { dossier: DossierResponsableCard }) {
  const theme = THEMES[dossier.niveau];
  return (
    <Link
      href={`/responsablecommercial/dossier-clientele/${dossier.id}`}
      className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
    >
      <article className="relative pt-8">
        <div className={`absolute left-3 top-0 z-10 flex h-9 max-w-[78%] items-center gap-2 rounded-t-xl border border-b-0 px-3 text-xs font-bold shadow-sm ${theme.tab}`}>
          <span className="tabular-nums tracking-wider">{dossier.numero}</span>
          <span className="truncate uppercase">{dossier.nomCourt}</span>
        </div>
        <div className={`absolute left-6 right-6 top-3 h-8 rounded-t-lg ${theme.fold}`} />
        <div className={`relative overflow-hidden rounded-2xl rounded-tl-md border shadow-md transition duration-200 group-hover:-translate-y-1 group-hover:shadow-xl ${theme.sheet}`}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-black/10 to-transparent" />
          <div className="min-h-[148px] px-4 pb-2 pt-7">
            <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${theme.muted}`}>{LABEL[dossier.niveau]}</p>
            <h3 className={`mt-1 line-clamp-2 text-lg font-bold leading-tight ${theme.ink}`}>{dossier.prospectNom}</h3>
            <p className={`mt-2 text-xs ${theme.muted}`}>
              {dossier.prospectType === "ENTREPRISE" ? "Entreprise" : "Particulier"} · {formatDate(dossier.createdAt)}
            </p>
          </div>
          <div className={`mx-3 mb-3 flex items-center justify-between rounded-lg border bg-white/80 px-3 py-2 text-xs font-medium ${theme.chip}`}>
            <span className="inline-flex items-center gap-1.5">
              <FolderOpen className="h-3.5 w-3.5" />
              Ouvrir
            </span>
            <span className="tabular-nums">{dossier.numero}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function DossiersResponsableView({ dossiers }: { dossiers: DossierResponsableCard[] }) {
  const [query, setQuery] = useState("");
  const [niveau, setNiveau] = useState<NiveauDossierId | "tous">("tous");

  const counts = useMemo(() => {
    const map = Object.fromEntries(NIVEAUX_DOSSIER.map((item) => [item.id, 0])) as Record<NiveauDossierId, number>;
    for (const dossier of dossiers) map[dossier.niveau] += 1;
    return map;
  }, [dossiers]);

  const commerciaux = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = dossiers.filter((dossier) => {
      if (niveau !== "tous" && dossier.niveau !== niveau) return false;
      if (!q) return true;
      return [dossier.numero, dossier.nomCourt, dossier.prospectNom, dossier.commercialNom, LABEL[dossier.niveau]]
        .some((value) => value.toLowerCase().includes(q));
    });

    const groups = new Map<string, { id: string; nom: string; dossiers: DossierResponsableCard[] }>();
    for (const dossier of filtered) {
      const group = groups.get(dossier.commercialId) ?? { id: dossier.commercialId, nom: dossier.commercialNom, dossiers: [] };
      group.dossiers.push(dossier);
      groups.set(dossier.commercialId, group);
    }

    return [...groups.values()]
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr"))
      .map((group) => ({
        ...group,
        niveaux: NIVEAUX_DOSSIER.map((item) => ({
          ...item,
          dossiers: group.dossiers.filter((dossier) => dossier.niveau === item.id),
        })).filter((item) => item.dossiers.length > 0),
      }));
  }, [dossiers, query, niveau]);

  const visibles = commerciaux.reduce((total, group) => total + group.dossiers.length, 0);
  const commerciauxTotal = new Set(dossiers.map((dossier) => dossier.commercialId)).size;

  return (
    <div className="w-full min-w-0 space-y-6 p-4 sm:p-6">
      <div className="rounded-2xl bg-black p-5 text-white sm:p-6">
        <h1 className="text-xl font-bold sm:text-2xl">Dossier clientèle</h1>
        <p className="mt-1 text-sm text-gray-300">
          {dossiers.length} dossier{dossiers.length > 1 ? "s" : ""} créé{dossiers.length > 1 ? "s" : ""} par {commerciauxTotal}{" "}
          commercial{commerciauxTotal > 1 ? "aux" : ""}, classés selon leur avancement.
        </p>
      </div>

      <EvolutionChart dossiers={dossiers} />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setNiveau("tous")}
          className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm font-medium ${
            niveau === "tous" ? "border-black bg-black text-white" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Tous
          <span className="tabular-nums">{dossiers.length}</span>
        </button>
        {NIVEAUX_DOSSIER.map((item) => {
          const theme = THEMES[item.id];
          const active = niveau === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setNiveau(active ? "tous" : item.id)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm font-medium ${
                active ? "border-black bg-black text-white" : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${theme.dot}`} />
              {item.label}
              <span className="tabular-nums">{counts[item.id]}</span>
            </button>
          );
        })}
      </div>

      <label className="relative block">
        <span className="sr-only">Rechercher un dossier</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par commercial, prospect, numéro ou niveau"
          className="min-h-12 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </label>

      {visibles === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center text-sm text-gray-500">
          {dossiers.length === 0
            ? "Aucun dossier créé par les commerciaux pour le moment."
            : "Aucun dossier ne correspond à cette recherche."}
        </div>
      ) : (
        <div className="space-y-8">
          {commerciaux.map((commercial) => (
            <section key={commercial.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-sm font-bold text-amber-400">
                    {initials(commercial.nom)}
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-black">{commercial.nom}</h2>
                    <p className="text-sm text-gray-500">
                      {commercial.dossiers.length} dossier{commercial.dossiers.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </header>

              <div className="space-y-6 p-4 sm:p-5">
                {commercial.niveaux.map((groupe) => {
                  const theme = THEMES[groupe.id];
                  return (
                    <div key={groupe.id}>
                      <div className="mb-3 flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${theme.dot}`} />
                        <h3 className="text-sm font-bold text-black">{groupe.label}</h3>
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums ${theme.chip}`}>
                          {groupe.dossiers.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {groupe.dossiers.map((dossier) => (
                          <FolderCard key={dossier.id} dossier={dossier} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
