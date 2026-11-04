"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderOpen, Plus, Search, X } from "lucide-react";
import {
  createDossierClientele,
  nextNumeroDossier,
  type DossierCard,
  type ProspectDossierOption,
} from "@/lib/actions/dossier-clientele";

const field =
  "w-full min-h-11 rounded-lg border border-gray-300 bg-white px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-amber-500";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function FolderCard({ dossier }: { dossier: DossierCard }) {
  return (
    <Link
      href={`/commercial/dossier-clientele/${dossier.id}`}
      className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
    >
      <article className="relative pt-8">
        <div className="absolute left-3 top-0 z-10 flex h-9 max-w-[78%] items-center gap-2 rounded-t-xl border border-b-0 border-[#c9922a] bg-[#e7b84a] px-3 text-xs font-bold text-[#3a2808] shadow-sm">
          <span className="tabular-nums tracking-wider">{dossier.numero}</span>
          <span className="truncate uppercase">{dossier.nomCourt}</span>
        </div>
        <div className="absolute left-6 right-6 top-3 h-8 rounded-t-lg bg-[#f3d48a]" />
        <div className="relative overflow-hidden rounded-2xl rounded-tl-md border border-[#d7a441] bg-gradient-to-b from-[#fff6df] to-[#f3ddaa] shadow-md transition duration-200 group-hover:-translate-y-1 group-hover:shadow-xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-black/10 to-transparent" />
          <div className="min-h-[132px] px-4 pb-2 pt-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a6420]">Dossier ouvert</p>
            <h3 className="mt-1 line-clamp-2 text-lg font-bold leading-tight text-[#2c2112]">{dossier.prospectNom}</h3>
            <p className="mt-2 text-xs text-[#6d5428]">
              {dossier.prospectType === "ENTREPRISE" ? "Entreprise" : "Particulier"} · {formatDate(dossier.createdAt)}
            </p>
          </div>
          <div className="mx-3 mb-3 flex items-center justify-between rounded-lg border border-[#ead7a2] bg-[#fffaf0] px-3 py-2 text-xs font-medium text-[#6d5428]">
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

export default function DossierClienteleView({
  dossiers,
  prospects,
}: {
  dossiers: DossierCard[];
  prospects: ProspectDossierOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [prospect, setProspect] = useState("");
  const [numero, setNumero] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [loadingNumero, setLoadingNumero] = useState(false);

  const selected = prospects.find((item) => `${item.type}:${item.id}` === prospect) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dossiers;
    return dossiers.filter((dossier) =>
      [dossier.numero, dossier.nomCourt, dossier.prospectNom].some((value) => value.toLowerCase().includes(q)),
    );
  }, [dossiers, query]);

  async function openForm() {
    setError(null);
    setProspect("");
    setNumero("");
    setOpen(true);
    setLoadingNumero(true);
    const res = await nextNumeroDossier();
    setLoadingNumero(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    setNumero(res.numero);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const [prospectType, prospectId] = prospect.split(":");
    if (!prospectId) return setError("Sélectionnez un prospect");
    if (!/^\d{5}$/.test(numero)) return setError("Le numéro à 5 chiffres n'est pas prêt");
    setError(null);
    start(async () => {
      const res = await createDossierClientele({
        prospectId,
        prospectType: prospectType as "CLIENT" | "ENTREPRISE",
        numero,
      });
      if (!res.success) return setError(res.error);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="w-full min-w-0 space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-black p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Dossier clientèle</h1>
          <p className="text-sm text-gray-300">Un dossier par prospect, identifié par un numéro à 5 chiffres.</p>
        </div>
        <button
          type="button"
          onClick={openForm}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 font-semibold text-black hover:bg-amber-400 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Créer nouveau dossier
        </button>
      </div>

      <label className="relative block">
        <span className="sr-only">Rechercher un dossier</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom ou numéro du dossier"
          className="min-h-12 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </label>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center text-sm text-gray-500">
          {dossiers.length === 0 ? "Aucun dossier créé pour le moment." : "Aucun dossier ne correspond à cette recherche."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((dossier) => (
            <FolderCard key={dossier.id} dossier={dossier} />
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center" onClick={() => setOpen(false)}>
          <form
            onSubmit={onSubmit}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full space-y-4 overflow-y-auto rounded-t-2xl bg-white p-5 text-black sm:max-w-lg sm:rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Nouveau dossier</h2>
              <button type="button" onClick={() => setOpen(false)} className="p-2" aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="block space-y-1">
              <span className="text-sm font-bold">Nom du prospect *</span>
              {prospects.length === 0 ? (
                <p className="rounded-lg border border-dashed px-3 py-2 text-sm text-gray-500">
                  Aucun prospect disponible. Créez d&apos;abord un prospect, ou tous vos prospects ont déjà un dossier.
                </p>
              ) : (
                <select required value={prospect} onChange={(e) => setProspect(e.target.value)} className={field}>
                  <option value="">Sélectionner un prospect</option>
                  {prospects.map((item) => (
                    <option key={`${item.type}:${item.id}`} value={`${item.type}:${item.id}`}>
                      {item.nom}
                    </option>
                  ))}
                </select>
              )}
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-bold">Numéro du dossier</span>
              <input readOnly value={loadingNumero ? "Génération…" : numero} className={`${field} bg-gray-50 tabular-nums tracking-[0.3em]`} />
              <span className="text-xs text-gray-500">Généré automatiquement, 5 chiffres.</span>
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-bold">Nom court</span>
              <input
                readOnly
                value={selected?.nomCourt ?? ""}
                placeholder="Sélectionnez un prospect"
                className={`${field} bg-gray-50 uppercase`}
              />
              <span className="text-xs text-gray-500">Sigle ou initiales du prospect sélectionné.</span>
            </label>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={pending || loadingNumero || prospects.length === 0 || !numero}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-black font-semibold text-white disabled:opacity-50"
            >
              {pending ? "Création…" : "Créer le dossier"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
